import { db } from "../db"
import { referrals, users } from "../../shared/schema"
import { and, eq } from "drizzle-orm"

type ReferralNotificationOptions = {
  notify?: boolean
  refereeName?: string
  refereeUsername?: string | null
}

// Helper function to send Telegram notifications about referrals
export async function sendReferralNotification(
  referrerId: number,
  refereeName: string,
  refereeUsername: string | null,
  level: number,
) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || ""
    if (!botToken) return

    const referrerResult = await db.select().from(users).where(eq(users.id, referrerId)).limit(1)
    if (referrerResult.length === 0) return

    const referrerChatId = referrerResult[0].telegramId
    if (!referrerChatId) return

    const levelLabel = {
      1: "1️⃣ уровень 1",
      2: "2️⃣ уровень 2",
      3: "3️⃣ уровень 3",
      4: "4️⃣ уровень 4",
      5: "5️⃣ уровень 5",
    }[level] || `Уровень ${level}`

    const userLink = refereeUsername ? `@${refereeUsername}` : `ID: ${refereeName}`
    const message = `🎉 <b>Новый реферал - ${levelLabel}</b>\n\n👤 Реферал: ${userLink}\n\n💡 Бонус активируется после активации промокода рефералом!`

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: referrerChatId,
        text: message,
        parse_mode: "HTML",
      }),
    })
  } catch (error) {
    console.error("Failed to send referral notification:", error)
  }
}

// Helper function to send referral registration notification
export async function sendReferralRegistrationNotification(
  referrerId: number,
  newUserName: string,
  newUserUsername: string | null,
) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || ""
    if (!botToken) return

    const referrerResult = await db.select().from(users).where(eq(users.id, referrerId)).limit(1)
    if (referrerResult.length === 0) return

    const referrerChatId = referrerResult[0].telegramId
    if (!referrerChatId) return

    const userLink = newUserUsername ? `@${newUserUsername}` : `ID: ${newUserName}`
    const message = `🎉 <b>Новый реферал зарегистрирован!</b>\n\n👤 Пользователь: ${userLink}\n\n💰 Бонус получен реферал активен!`

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: referrerChatId,
        text: message,
        parse_mode: "HTML",
      }),
    })
  } catch (error) {
    console.error("Failed to send referral registration notification:", error)
  }
}

export async function ensureReferralChain(
  referredUserId: number,
  referrerId: number,
  options: ReferralNotificationOptions = {},
) {
  try {
    let currentReferrerId: number | null = referrerId
    let level = 1

    while (currentReferrerId && level <= 5) {
      const existingReferral = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, currentReferrerId),
            eq(referrals.referredId, referredUserId),
            eq(referrals.level, level),
          ),
        )
        .limit(1)

      if (existingReferral.length === 0) {
        await db.insert(referrals).values({
          referrerId: currentReferrerId,
          referredId: referredUserId,
          level,
          createdAt: new Date(),
        })
        if (options.notify && options.refereeName) {
          await sendReferralNotification(
            currentReferrerId,
            options.refereeName,
            options.refereeUsername ?? null,
            level,
          )
        }
      }

      const referrerResult = await db.select().from(users).where(eq(users.id, currentReferrerId)).limit(1)
      currentReferrerId = referrerResult.length > 0 ? referrerResult[0].referrerId : null
      level++
    }
  } catch (error) {
    console.error("Failed to ensure referral chain:", error)
  }
}
