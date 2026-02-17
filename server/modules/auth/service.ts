import crypto from "node:crypto"
import { z } from "zod"
import { generateAccessToken } from "../../jwt"
import { appState, type AppUser } from "../state"

const telegramUserSchema = z.object({
  id: z.number(),
  username: z.string().optional(),
})

const parsedInitDataSchema = z.object({
  user: z.string(),
  auth_date: z.string(),
  hash: z.string(),
})

export class AuthService {
  validateAndLogin(initData: string): { token: string; user: AppUser; isNew: boolean } {
    const params = new URLSearchParams(initData)
    const parsed = parsedInitDataSchema.safeParse(Object.fromEntries(params.entries()))
    if (!parsed.success) {
      throw new Error("Invalid initData payload")
    }

    const hash = params.get("hash") || ""
    if (appState.consumedInitDataHashes.has(hash)) {
      throw new Error("initData replay detected")
    }

    const userRaw = params.get("user")
    if (!userRaw) {
      throw new Error("Missing user payload")
    }

    const userParsed = telegramUserSchema.safeParse(JSON.parse(userRaw))
    if (!userParsed.success) {
      throw new Error("Invalid Telegram user payload")
    }

    const authDate = Number(params.get("auth_date"))
    const now = Math.floor(Date.now() / 1000)
    if (!Number.isFinite(authDate) || now - authDate > 86400) {
      throw new Error("initData expired")
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || ""
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is required")
    }

    const checkParams = new URLSearchParams(initData)
    checkParams.delete("hash")
    const dataCheckString = Array.from(checkParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n")

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
    const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")
    if (expectedHash !== hash) {
      throw new Error("Invalid initData signature")
    }

    const telegramId = String(userParsed.data.id)
    const existing = appState.usersByTelegramId.get(telegramId)
    const user: AppUser =
      existing || {
        id: appState.users.size + 1,
        telegramId,
        username: userParsed.data.username,
        role: "user",
      }

    if (!existing) {
      appState.users.set(user.id, user)
      appState.usersByTelegramId.set(telegramId, user)
    }

    const token = generateAccessToken({
      sub: user.id,
      telegramId: Number(user.telegramId),
      username: user.username || `user_${user.id}`,
      role: user.role,
    })

    appState.sessions.set(token, { userId: user.id, createdAt: new Date() })
    appState.consumedInitDataHashes.add(hash)

    return { token, user, isNew: !existing }
  }
}

export const authService = new AuthService()
