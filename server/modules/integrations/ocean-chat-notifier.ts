import type { OceanState } from "../../domain/types"

type OceanAction = "init" | "rollover"

const isEnabled = () => {
  const raw = (process.env.OCEAN_NOTIFICATIONS_ENABLED ?? "true").trim().toLowerCase()
  return !["0", "false", "off", "no"].includes(raw)
}

const resolveChatId = () => process.env.OCEAN_NOTIFICATIONS_CHAT_ID || process.env.MAIN_CHAT_ID || ""

function formatOceanActionMessage(action: OceanAction, ocean: OceanState): string {
  const actionLabel = action === "init" ? "🌊 Океан инициализирован" : "🌦 Океан обновлён (daily rollover)"
  const modeLabel = ocean.mode === "storm" ? "Шторм" : "Спокойный"

  return [
    `<b>${actionLabel}</b>`,
    "",
    `Режим: <b>${modeLabel}</b>`,
    `Кормление: <b>${(ocean.feedingPercentageBps / 100).toFixed(2)}%</b>`,
    `Шанс шторма: <b>${(ocean.stormProbabilityBps / 100).toFixed(2)}%</b>`,
    `Рыб в океане: <b>${ocean.totalFishCount}</b>`,
  ].join("\n")
}

export async function notifyOceanActionToChat(action: OceanAction, ocean: OceanState): Promise<boolean> {
  if (!isEnabled()) return false

  const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || ""
  const chatId = resolveChatId()
  if (!botToken || !chatId) return false

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatOceanActionMessage(action, ocean),
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.warn(`[OceanNotifications] Telegram API error: ${response.status} ${body}`)
      return false
    }

    return true
  } catch (error) {
    console.warn("[OceanNotifications] Failed to send ocean action notification", error)
    return false
  }
}
