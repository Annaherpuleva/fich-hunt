import { db } from "../db"

// Map to track active notification intervals
const activeNotifications = new Map<number, NodeJS.Timer>()

// Send Telegram notification to ambassador
async function sendTelegramNotification(telegramId: number, message: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("[v0] TELEGRAM_BOT_TOKEN not configured")
      return false
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      console.error("[v0] Telegram API error:", await response.text())
      return false
    }

    console.log(`[v0] Telegram notification sent to ${telegramId}`)
    return true
  } catch (error) {
    console.error("[v0] Failed to send Telegram notification:", error)
    return false
  }
}

// Schedule 6-hourly notifications for ambassador
export function scheduleAmbassadorNotifications(
  telegramId: number,
  promocode: any,
  maxActivations: number,
  bonusAmount: string,
  bonusCurrency: string,
) {
  const normalizedCurrency = normalizeCurrency(bonusCurrency || promocode?.currency)

  // Clear existing interval if any
  if (activeNotifications.has(telegramId)) {
    clearInterval(activeNotifications.get(telegramId)!)
  }

  // Send first notification immediately
  const message = formatAmbassadorNotification(promocode.code, maxActivations, bonusAmount, normalizedCurrency)
  sendTelegramNotification(telegramId, message)

  // Then send every 6 hours (21600000 ms)
  const interval = setInterval(async () => {
    try {
      // Get latest stats for this promocode
      const result = await db.query(
        "SELECT current_activations FROM promocodes WHERE id = $1",
        [promocode.id],
      )

      if (result.rows.length > 0) {
        const currentActivations = result.rows[0].current_activations
        const updatedMessage = formatAmbassadorNotification(
          promocode.code,
          maxActivations,
          bonusAmount,
          normalizedCurrency,
          currentActivations,
        )
        await sendTelegramNotification(telegramId, updatedMessage)
      }
    } catch (error) {
      console.error("[v0] Error sending scheduled notification:", error)
    }
  }, 6 * 60 * 60 * 1000) // 6 hours

  activeNotifications.set(telegramId, interval)
  console.log(`[v0] 6-hourly notifications scheduled for ambassador ${telegramId}`)
}

// Format notification message
function formatAmbassadorNotification(
  code: string,
  maxActivations: number,
  bonusAmount: string,
  bonusCurrency: string,
  currentActivations: number = 0,
): string {
  const bonusFormatted = parseFloat(bonusAmount).toFixed(10)
  const currency = normalizeCurrency(bonusCurrency)
  const remainingActivations = maxActivations - currentActivations

  return `🤝 <b>Амбассадор Статистика</b>\n\n` +
    `📝 <b>Промокод:</b> <code>${code}</code>\n` +
    `💰 <b>Размер бонуса:</b> ${bonusFormatted} ${currency}\n` +
    `📊 <b>Активаций:</b> ${currentActivations} / ${maxActivations}\n` +
    `📈 <b>Осталось:</b> ${remainingActivations}\n` +
    `⏰ <b>Это сообщение повторяется каждые 6 часов</b>`
}

function normalizeCurrency(value?: string): "TON" | "USDT" {
  return value?.toUpperCase() === "USDT" ? "USDT" : "TON"
}

// Stop notifications for an ambassador
export function stopAmbassadorNotifications(telegramId: number) {
  if (activeNotifications.has(telegramId)) {
    clearInterval(activeNotifications.get(telegramId)!)
    activeNotifications.delete(telegramId)
    console.log(`[v0] Notifications stopped for ambassador ${telegramId}`)
  }
}
