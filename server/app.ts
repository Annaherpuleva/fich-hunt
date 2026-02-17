import type { Server } from "node:http"
import express, { type Express, type Request, type Response, type NextFunction } from "express"
import { registerRoutes } from "./routes/index"
import { scheduleMiningRewards } from "./cron/mining-rewards"
import { scheduleDailyBonuses } from "./cron/daily-bonus"
import { initializeTelegramBot } from "./telegram-bot"

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const adminAttemptStore = new Map<string, { count: number; blockedUntil: number }>()

const blockedEntities = new Set<string>()

process.on("unhandledRejection", (reason: any, promise) => {
  console.error("Unhandled Rejection at:", promise)
  console.error("Reason:", reason?.message || reason)
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.message)
  if (
    error.message?.includes("BUTTON_TYPE_INVALID") ||
    error.message?.includes("bot was blocked") ||
    error.message?.includes("chat not found") ||
    error.message?.includes("user not found") ||
    error.message?.includes("ETELEGRAM")
  ) {
    console.log("Non-fatal Telegram error, continuing...")
    return
  }
})

export function log(message: string, source = "express") {
  // Logging disabled
}

export function isBlocked(identifier: string): boolean {
  return blockedEntities.has(identifier)
}

export function blockEntity(identifier: string): void {
  blockedEntities.add(identifier)
  console.log(`[Security] Blocked entity: ${identifier}`)
}

export function recordAdminAttempt(identifier: string): boolean {
  const now = Date.now()
  const record = adminAttemptStore.get(identifier)

  if (record) {
    // Check if blocked
    if (record.blockedUntil > now) {
      return true // Still blocked
    }

    // Reset if window expired (1 hour)
    if (record.resetTime < now) {
      adminAttemptStore.set(identifier, { count: 1, resetTime: now + 3600000, blockedUntil: 0 })
      return false
    }

    // Increment count
    record.count++

    // Block after 5 attempts for 24 hours
    if (record.count >= 5) {
      record.blockedUntil = now + 86400000 // 24 hours
      blockEntity(identifier)
      console.log(`[Security] Entity ${identifier} blocked for 24h after ${record.count} admin access attempts`)
      return true
    }

    return false
  }

  // First attempt
  adminAttemptStore.set(identifier, { count: 1, resetTime: now + 3600000, blockedUntil: 0 })
  return false
}

export function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown"
    const now = Date.now()

    // Check if blocked
    if (isBlocked(identifier)) {
      return res.status(403).json({ error: "Access denied" })
    }

    const record = rateLimitStore.get(identifier)

    if (record) {
      if (record.resetTime < now) {
        // Reset window
        rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
      } else {
        record.count++
        if (record.count > maxRequests) {
          return res.status(429).json({ error: "Too many requests, please try again later" })
        }
      }
    } else {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    }

    next()
  }
}

export const app = express()

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "https://usdt-core.pro",
    "https://www.usdt-core.pro",
    // Allow localhost for development
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:5173",
  ].filter(Boolean)

  const origin = req.headers.origin

  // Allow requests without origin (same-origin, mobile apps, Telegram WebApp)
  if (!origin) {
    next()
    return
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Telegram-Init-Data, X-User-Id")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  next()
})

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf
    },
  }),
)
app.use(express.urlencoded({ extended: false }))

// Admin routes - 100 requests per minute (admins need more for dashboard)
app.use("/api/admin", rateLimiter(500, 60000))
// Withdrawals - 30 requests per minute
app.use("/api/withdrawals", rateLimiter(30, 60000))
// General API - 1000 requests per minute per IP (generous for normal use)
app.use("/api", rateLimiter(1000, 60000))

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  next()
})

app.use((req, res, next) => {
  const start = Date.now()
  const path = req.path
  let capturedJsonResponse: Record<string, any> | undefined = undefined

  const originalResJson = res.json
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson
    return originalResJson.apply(res, [bodyJson, ...args])
  }

  res.on("finish", () => {
    const duration = Date.now() - start
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…"
      }

      log(logLine)
    }
  })

  next()
})

export default async function runApp(setup: (app: Express, server: Server) => Promise<void>) {
  const server = await registerRoutes(app)

  // Initialize Telegram bot for handling /start command and subscription info
  initializeTelegramBot()

  // Schedule mining rewards cron job
  scheduleMiningRewards(app)

  // Schedule daily bonus accrual
  scheduleDailyBonuses(app)

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || "Internal Server Error"

    res.status(status).json({ message })
    throw err
  })

  await setup(app, server)

  const port = Number.parseInt(process.env.PORT || "5000", 10)
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`)
    },
  )
}
