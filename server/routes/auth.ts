import type { Express, Request, Response } from "express"
import crypto from "crypto"
import { and, eq, sql } from "drizzle-orm"
import { db } from "../db"
import { generateAccessToken } from "../jwt"
import { registerBrowserAccessGuards } from "../middleware/browserAccess"
import { MINING_CONSTANTS, bonusTransactions, tasks, userTasks, users } from "../../shared/schema"
import { createReferralChain, getReferralChain } from "../utils/referral-links"
import { ensureTasksSeeded } from "../utils/task-seeding"

type TelegramUser = {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  allows_write_to_pm?: boolean
  photo_url?: string
}

type InitDataValidationResult = {
  user: TelegramUser
  authDate: number
  queryId?: string
  startParam?: string
}

function parseAdminIds(): Set<string> {
  const raw = process.env.ADMIN_TELEGRAM_IDS || process.env.ADMIN_USER_IDS || ""
  const ids = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)

  return new Set(ids)
}

function timingSafeEqualHex(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex")
  const bBuffer = Buffer.from(b, "hex")
  if (aBuffer.length !== bBuffer.length) return false
  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function validateInitData(initData: string): InitDataValidationResult {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured")
  }

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) {
    throw new Error("Missing hash in initData")
  }

  params.delete("hash")

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  if (!timingSafeEqualHex(calculatedHash, hash)) {
    throw new Error("Invalid initData signature")
  }

  const authDateValue = params.get("auth_date")
  if (!authDateValue) {
    throw new Error("Missing auth_date")
  }

  const authDate = Number(authDateValue)
  if (!Number.isFinite(authDate)) {
    throw new Error("Invalid auth_date")
  }

  const maxAgeSeconds = Number(process.env.TELEGRAM_AUTH_MAX_AGE || "86400")
  if (Number.isFinite(maxAgeSeconds) && maxAgeSeconds > 0) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (nowSeconds - authDate > maxAgeSeconds) {
      throw new Error("initData expired")
    }
  }

  const userRaw = params.get("user")
  if (!userRaw) {
    throw new Error("Missing user in initData")
  }

  let user: TelegramUser
  try {
    user = JSON.parse(userRaw)
  } catch (error) {
    throw new Error("Invalid user payload")
  }

  if (!user?.id) {
    throw new Error("Invalid user payload")
  }

  return {
    user,
    authDate,
    queryId: params.get("query_id") || undefined,
    startParam: params.get("start_param") || undefined,
  }
}

function parseStartParam(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const normalized = trimmed.startsWith("ref") ? trimmed.slice(3) : trimmed
  if (!/^\d+$/.test(normalized)) return null
  return normalized
}

export function setupAuthRoutes(app: Express) {
  registerBrowserAccessGuards(app)

  app.post("/api/auth/telegram", async (req: Request, res: Response) => {
    try {
      const initData = req.body?.initData
      if (typeof initData !== "string" || initData.trim().length === 0) {
        return res.status(400).json({ error: "initData is required" })
      }

      const { user, authDate, queryId, startParam } = validateInitData(initData)
      const adminIds = parseAdminIds()
      const telegramId = String(user.id)
      let isNew = false
      let [userRecord] = await db
        .select({
          id: users.id,
          isAdmin: users.isAdmin,
          referrerTelegramId: users.referrerTelegramId,
          referrerId: users.referrerId,
        })
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1)

      if (!userRecord) {
        const parsedStartParam = parseStartParam(startParam)
        let resolvedReferrerTelegramId: string | null = null
        let resolvedReferrerId: number | null = null

        if (parsedStartParam && parsedStartParam !== telegramId) {
          const [referrer] = await db
            .select({ id: users.id, telegramId: users.telegramId })
            .from(users)
            .where(eq(users.telegramId, parsedStartParam))
            .limit(1)
          if (referrer?.id) {
            resolvedReferrerTelegramId = referrer.telegramId
            resolvedReferrerId = referrer.id
          }
        }

        const [createdUser] = await db
          .insert(users)
          .values({
            telegramId,
            username: user.username ?? null,
            referrerId: resolvedReferrerId,
            referrerTelegramId: resolvedReferrerTelegramId,
            internalBalance: MINING_CONSTANTS.REGISTRATION_BONUS.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing()
          .returning({
            id: users.id,
            isAdmin: users.isAdmin,
            referrerTelegramId: users.referrerTelegramId,
            referrerId: users.referrerId,
          })

        userRecord = createdUser
        isNew = Boolean(createdUser)

        if (!userRecord) {
          const [existingUser] = await db
            .select({
              id: users.id,
              isAdmin: users.isAdmin,
              referrerTelegramId: users.referrerTelegramId,
              referrerId: users.referrerId,
            })
            .from(users)
            .where(eq(users.telegramId, telegramId))
            .limit(1)
          userRecord = existingUser
        }

        if (createdUser) {
          await db.insert(bonusTransactions).values({
            userId: createdUser.id,
            type: "registration_bonus",
            amount: MINING_CONSTANTS.REGISTRATION_BONUS.toString(),
          })

          if (resolvedReferrerId) {
            await createReferralChain(createdUser.id, resolvedReferrerId)

            const referralChain = await getReferralChain(resolvedReferrerId, 3)
            for (const referrer of referralChain) {
              await db
                .update(users)
                .set({ internalBalance: sql`internal_balance + ${MINING_CONSTANTS.INVITE_BONUS}` })
                .where(eq(users.id, referrer.referrerId))

              await db.insert(bonusTransactions).values({
                userId: referrer.referrerId,
                type: "invite_bonus",
                amount: MINING_CONSTANTS.INVITE_BONUS.toString(),
                metadata: JSON.stringify({ invitedUserId: createdUser.id, level: referrer.level }),
              })
            }

            await ensureTasksSeeded()
            const [inviteTask] = await db
              .select({ id: tasks.id, reward: tasks.reward })
              .from(tasks)
              .where(eq(tasks.key, "invite_friend"))
              .limit(1)
            if (inviteTask) {
              const rewardAmount = Number(inviteTask.reward)
              const [taskAlreadyCompleted] = await db
                .select({ id: userTasks.id })
                .from(userTasks)
                .where(and(eq(userTasks.userId, resolvedReferrerId), eq(userTasks.taskId, inviteTask.id)))
                .limit(1)
              const [bonusAlreadyGranted] = await db
                .select({ id: bonusTransactions.id })
                .from(bonusTransactions)
                .where(and(eq(bonusTransactions.userId, resolvedReferrerId), eq(bonusTransactions.type, "task_invite_friend")))
                .limit(1)

              if (!taskAlreadyCompleted && !bonusAlreadyGranted) {
                await db
                  .update(users)
                  .set({
                    internalBalance: sql`internal_balance + ${rewardAmount}`,
                    updatedAt: new Date(),
                  })
                  .where(eq(users.id, resolvedReferrerId))
                await db.insert(bonusTransactions).values({
                  userId: resolvedReferrerId,
                  type: "task_invite_friend",
                  amount: rewardAmount.toString(),
                  metadata: JSON.stringify({ invitedUserId: createdUser.id }),
                })
                await db.insert(userTasks).values({
                  userId: resolvedReferrerId,
                  taskId: inviteTask.id,
                  completedAt: new Date(),
                })
              }
            }
          }
        }
      }

      if (!userRecord || userRecord.id == null) {
        throw new Error("Failed to resolve user record")
      }

      const isAdmin = adminIds.has(telegramId) || userRecord?.isAdmin === true

      const token = generateAccessToken({
        sub: String(userRecord.id),
        telegramId: user.id,
        username: user.username ?? "",
        role: isAdmin ? "admin" : "user",
      })

      return res.json({
        ok: true,
        isNew,
        token,
        user: {
          id: userRecord.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          language_code: user.language_code,
          photo_url: user.photo_url,
          telegramId: user.id,
          referrerTelegramId: userRecord.referrerTelegramId ?? null,
        },
        authDate,
        queryId,
        isAdmin,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auth failed"
      console.error("Telegram auth error:", error)
      return res.status(401).json({ error: message })
    }
  })
}
