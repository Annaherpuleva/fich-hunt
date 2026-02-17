import crypto from "crypto"

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface InitDataPayload {
  query_id?: string
  user?: TelegramUser
  auth_date: number
  hash: string
  start_param?: string
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

// Validate initData from Telegram Mini App
export function validateInitData(
  initData: string,
  isAdmin = false,
  skipExpiration = false,
): { valid: boolean; user?: TelegramUser; error?: string } {
  if (!initData) {
    return { valid: false, error: "No initData provided" }
  }

  if (!BOT_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Security] BOT_TOKEN not set in production!")
      return { valid: false, error: "Server configuration error" }
    }
    return { valid: true }
  }

  try {
    const params = new URLSearchParams(initData)
    const hash = params.get("hash")

    if (!hash) {
      return { valid: false, error: "No hash in initData" }
    }

    const authDate = Number.parseInt(params.get("auth_date") || "0", 10)

    if (!authDate || authDate <= 0) {
      return { valid: false, error: "Invalid auth_date" }
    }

    if (!skipExpiration) {
      const now = Math.floor(Date.now() / 1000)
      const MAX_AGE = isAdmin ? 7 * 24 * 60 * 60 : 30 * 60

      if (now - authDate > MAX_AGE) {
        return { valid: false, error: `initData expired` }
      }

      if (authDate > now + 60) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[Security] auth_date in future`)
        }
        return { valid: false, error: "Invalid auth_date (future)" }
      }
    }

    const dataCheckArr: string[] = []
    params.forEach((value, key) => {
      if (key !== "hash") {
        dataCheckArr.push(`${key}=${value}`)
      }
    })
    dataCheckArr.sort()
    const dataCheckString = dataCheckArr.join("\n")

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest()
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

    if (calculatedHash !== hash) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Security] Hash mismatch in initData validation")
      }
      return { valid: false, error: "Invalid hash - data may be tampered" }
    }

    const userStr = params.get("user")
    let user: TelegramUser | undefined
    if (userStr) {
      try {
        user = JSON.parse(decodeURIComponent(userStr))

        if (!user || typeof user.id !== "number" || user.id <= 0) {
          return { valid: false, error: "Invalid user data structure" }
        }
      } catch (e) {
        return { valid: false, error: "Invalid user data JSON" }
      }
    }

    return { valid: true, user }
  } catch (error) {
    console.error("[Security] Error validating initData:", error)
    return { valid: false, error: "Validation failed" }
  }
}

// Rate limiter for API endpoints
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowSeconds = 60,
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowSeconds * 1000,
    })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowSeconds }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60 * 1000) // Clean every minute

// Lock manager for preventing race conditions
const lockMap = new Map<string, number>()
const LOCK_TIMEOUT = 10000 // 10 seconds

export function acquireLock(key: string): boolean {
  const now = Date.now()
  const existingLock = lockMap.get(key)

  if (existingLock && now - existingLock < LOCK_TIMEOUT) {
    return false // Lock exists and not expired
  }

  lockMap.set(key, now)
  return true
}

export function releaseLock(key: string): void {
  lockMap.delete(key)
}

// Clean up old locks
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of lockMap.entries()) {
    if (now - timestamp > LOCK_TIMEOUT) {
      lockMap.delete(key)
    }
  }
}, 30 * 1000)
