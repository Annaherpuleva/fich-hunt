import type { Express } from "express"
import { z } from "zod"
import { authService } from "./service"

const loginSchema = z.object({
  initData: z.string().min(1),
  walletAddress: z.string().min(16).max(128).optional(),
})

export function setupAuthModuleRoutes(app: Express) {
  app.post("/api/auth/telegram", (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() })
    }

    try {
      const result = authService.validateAndLogin(parsed.data.initData, parsed.data.walletAddress)
      return res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed"
      return res.status(401).json({ error: message })
    }
  })
}
