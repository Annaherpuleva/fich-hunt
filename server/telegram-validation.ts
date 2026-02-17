import crypto from "crypto"

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

interface TelegramUserData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

interface ValidatedData {
  user: TelegramUserData
  auth_date: number
  hash: string
  query_id?: string
  start_param?: string
}

export function validateInitData(initData: string): ValidatedData | null {
  try {
    if (!initData || !BOT_TOKEN) {
      console.error("[Telegram] Missing initData or BOT_TOKEN")
      return null
    }

    // Parse initData
    const params = new URLSearchParams(initData)
    const hash = params.get("hash")

    if (!hash) {
      console.error("[Telegram] No hash in initData")
      return null
    }

    // Remove hash from params for verification
    params.delete("hash")

    // Sort params alphabetically and create data-check-string
    const dataCheckArr: string[] = []
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`)
    })
    dataCheckArr.sort()
    const dataCheckString = dataCheckArr.join("\n")

    // Create secret key using HMAC-SHA256 with "WebAppData" as key
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest()

    // Calculate hash
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    // Compare hashes
    if (calculatedHash !== hash) {
      console.error("[Telegram] Hash mismatch - invalid initData")
      return null
    }

    // Check auth_date (not older than 24 hours)
    const authDate = Number.parseInt(params.get("auth_date") || "0", 10)
    const now = Math.floor(Date.now() / 1000)
    const maxAge = 24 * 60 * 60 // 24 hours

    if (now - authDate > maxAge) {
      console.error("[Telegram] initData expired")
      return null
    }

    // Parse user data
    const userStr = params.get("user")
    if (!userStr) {
      console.error("[Telegram] No user in initData")
      return null
    }

    const user: TelegramUserData = JSON.parse(userStr)

    // Validate required user fields
    if (!user || !user.id) {
      console.error("[Telegram] Invalid user data in initData")
      return null
    }

    return {
      user,
      auth_date: authDate,
      hash,
      query_id: params.get("query_id") || undefined,
      start_param: params.get("start_param") || undefined,
    }
  } catch (error) {
    console.error("[Telegram] Error validating initData:", error)
    return null
  }
}

export function getTelegramUserFromInitData(initData: string): TelegramUserData | null {
  const validated = validateInitData(initData)
  return validated?.user || null
}
