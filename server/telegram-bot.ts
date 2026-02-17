import type { Express, Request, Response } from "express"
import TelegramBot from "node-telegram-bot-api"
import { db } from "./db"
import { users } from "../shared/schema"
import { eq } from "drizzle-orm"
import { MINING_CONSTANTS } from "../shared/constants"

const botToken = process.env.TELEGRAM_BOT_TOKEN
let bot: TelegramBot | null = null
let pollingRestartTimeout: NodeJS.Timeout | null = null
let pollingRetryCount = 0
const POLLING_RESTART_BASE_DELAY_MS = 5_000
const POLLING_RESTART_MAX_DELAY_MS = 60_000

export function initializeTelegramBot() {
  if (!botToken) {
    console.error("[Bot] BOT_TOKEN not configured. Telegram bot will not be initialized.")
    return
  }

  try {
    bot = new TelegramBot(botToken, { polling: true })
    bot.on("polling_error", (error) => {
      const message = typeof error?.message === "string" ? error.message : "Unknown polling error"
      const code = typeof (error as { code?: string })?.code === "string" ? (error as { code?: string }).code : "unknown"
      console.error(`[Bot] Polling error (${code}):`, message)

      if (pollingRestartTimeout) {
        return
      }

      pollingRetryCount += 1
      const delay = Math.min(
        POLLING_RESTART_MAX_DELAY_MS,
        POLLING_RESTART_BASE_DELAY_MS * pollingRetryCount,
      )

      pollingRestartTimeout = setTimeout(async () => {
        try {
          await bot?.stopPolling()
        } catch (stopError) {
          console.warn("[Bot] Failed to stop polling after error:", stopError)
        }

        try {
          await bot?.startPolling()
          pollingRetryCount = 0
        } catch (startError) {
          console.error("[Bot] Failed to restart polling:", startError)
        } finally {
          pollingRestartTimeout = null
        }
      }, delay)
    })

    // Handle /start command
    bot.onText(/\/start/, async (msg) => {
      try {
        const chatId = msg.chat.id
        const telegramId = msg.from?.id
        const username = msg.from?.username
        if (!telegramId) return

        // Determine user language
        const languageCode = msg.from?.language_code || "en"
        const isRussian = languageCode.startsWith("ru")

        // Check if user exists
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.telegramId, String(telegramId)))
          .limit(1)

        const isNewUser = userResult.length === 0
        const appUrl = process.env.APP_URL || "https://usdt-core.pro"
        const startPayloadMatch = msg.text?.match(/^\/start(?:@[\w_]+)?(?:\s+(.+))?$/)
        const startPayload = startPayloadMatch?.[1]?.trim()
        const appUrlWithStart = startPayload
          ? `${appUrl}${appUrl.includes("?") ? "&" : "?"}startapp=${encodeURIComponent(startPayload)}`
          : appUrl

        const resolveTelegramUrl = (explicitUrl: string | undefined, fallbackId: string | null) => {
          if (explicitUrl?.trim()) {
            return explicitUrl.trim()
          }
          if (!fallbackId) return null
          const trimmed = fallbackId.trim()
          if (!trimmed) return null
          if (/^https?:\/\//i.test(trimmed)) {
            return trimmed
          }
          if (trimmed.startsWith("@")) {
            return `https://t.me/${trimmed.slice(1)}`
          }
          if (/^-100\d+$/.test(trimmed)) {
            return `https://t.me/c/${trimmed.slice(4)}`
          }
          if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
            return `https://t.me/${trimmed}`
          }
          return null
        }

        const channelUrl = resolveTelegramUrl(process.env.REQUIRED_CHANNEL_URL, MINING_CONSTANTS.REQUIRED_CHANNEL_ID)
        const chatUrl = resolveTelegramUrl(process.env.MAIN_CHAT_URL, MINING_CONSTANTS.MAIN_CHAT_ID)
        const subscribeButtons = [
          [
            ...(channelUrl ? [{ text: isRussian ? " Channel" : " Channel", url: channelUrl }] : []),
            ...(chatUrl ? [{ text: isRussian ? " Chat" : " Chat", url: chatUrl }] : []),
          ],
        ].filter((row) => row.length > 0)
        const openAppButton = [
          {
            text: isRussian ? " Play now" : " Open App",
            web_app: { url: appUrlWithStart },
          },
        ]

        if (isNewUser) {
          // New user - show welcome with subscription requirement
          const welcomeText = isRussian
            ? ` 👋 Hello, \n\nWelcome to USDT Core 🚀\n\nUSDT Core is your smart mining and earning platform built for speed, automation, and transparency. Earn passive USDT rewards every minute, manage miners, complete daily bonuses, and withdraw instantly across TON, BEP20, and TRC20 networks.\n\nSecure. Automated. Profitable.\n\nStart mining, grow your balance, and take full control of your earnings — all in one place. `
            : " 👋 Hello! Welcome to USDT Core! \nTo launch the application, press Play now. 🚀 "

          await bot!.sendMessage(chatId, welcomeText, {
            reply_markup: {
              inline_keyboard: [
                openAppButton,
                ...subscribeButtons,
              ],
            },
          })
        } else {
          // Returning user
          const continueText = isRussian
            ? " 👇 Tap the button below to continue"
            : " 👇 Tap the button below to continue."

          await bot!.sendMessage(chatId, continueText, {
            reply_markup: {
              inline_keyboard: [
                openAppButton,
                ...subscribeButtons,
              ],
            },
          })
        }
      } catch (error) {
        console.error("[Bot] Error handling /start command:", error)
      }
    })

    console.log("[Bot] Telegram bot initialized successfully")
  } catch (error) {
    console.error("[Bot] Failed to initialize Telegram bot:", error)
  }
}

export function getTelegramBot() {
  return bot
}

export function setupTelegramBotWebhook(app: Express) {
  if (!botToken) {
    console.warn("[Bot] BOT_TOKEN not configured. Telegram webhook will not be set up.")
    return
  }

  app.post("/api/telegram/webhook", (req: Request, res: Response) => {
    if (!bot) {
      res.status(503).json({ error: "Telegram bot not initialized" })
      return
    }

    try {
      bot.processUpdate(req.body)
      res.sendStatus(200)
    } catch (error) {
      console.error("[Bot] Failed to process webhook update:", error)
      res.sendStatus(500)
    }
  })
}
