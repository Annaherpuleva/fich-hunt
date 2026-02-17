import { getTelegramBot } from "./telegram-bot"
import { MINING_CONSTANTS } from "../shared/constants"

type SubscriptionCheck = {
  channelId: string
  isSubscribed: boolean
}

function isChatNotFoundError(error: unknown): boolean {
  if (error && typeof error === "object") {
    const message = (error as { message?: string }).message
    const description = (error as { response?: { body?: { description?: string } } }).response?.body?.description
    const combined = [message, description].filter(Boolean).join(" ").toLowerCase()
    return combined.includes("chat not found")
  }

  return false
}

function normalizeChannelIds(): string[] {
  return [MINING_CONSTANTS.REQUIRED_CHANNEL_ID, MINING_CONSTANTS.MAIN_CHAT_ID, ...MINING_CONSTANTS.ADDITIONAL_CHANNELS].filter(
    (channelId) => Boolean(channelId),
  )
}

// Check if user is subscribed to a channel
async function checkSingleChannel(telegramId: string, channelId: string): Promise<boolean> {
  const bot = getTelegramBot()
  if (!bot) return false

  try {
    const chatMember = await bot.getChatMember(channelId, Number(telegramId))
    // User is subscribed if they are member, administrator, or creator
    return ["member", "administrator", "creator"].includes(chatMember.status)
  } catch (error) {
    if (isChatNotFoundError(error)) {
      console.warn(`[Subscription] Chat not found for ${channelId}. Skipping subscription check.`)
      return true
    }

    console.error("Failed to check subscription:", error)
    return false
  }
}

export async function checkChannelSubscription(telegramId: string, channelId: string): Promise<boolean> {
  return checkSingleChannel(telegramId, channelId)
}

export async function checkRequiredSubscriptions(telegramId: string): Promise<{ isSubscribed: boolean; checks: SubscriptionCheck[] }> {
  const channelIds = normalizeChannelIds()
  if (channelIds.length === 0) {
    return { isSubscribed: true, checks: [] }
  }

  const checks = await Promise.all(
    channelIds.map(async (channelId) => ({
      channelId,
      isSubscribed: await checkSingleChannel(telegramId, channelId),
    })),
  )

  return {
    isSubscribed: checks.every((check) => check.isSubscribed),
    checks,
  }
}
