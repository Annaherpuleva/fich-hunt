import type { Express } from "express"
import { z } from "zod"
import { requireAdmin, verifyJWT } from "../../middleware/jwt"
import { adminApproveContract, adminRejectContract, oceanStateContract } from "../contracts/target-api-contracts"
import { respondWithContract } from "../contracts/response"
import { billingPaymentsService } from "../billing/payments-service"
import { domainModuleService } from "../domain/service"
import { tonIntegrationService } from "../integrations/ton-service"
import { notifyOceanActionToChat } from "../integrations/ocean-chat-notifier"

export function setupAdminModuleRoutes(app: Express) {
  app.post("/api/admin/ocean/init", verifyJWT, requireAdmin, (_req, res) => {
    const oceanState = domainModuleService.initOcean()
    void notifyOceanActionToChat("init", oceanState)
    respondWithContract(res, oceanStateContract, oceanState)
  })

  app.post("/api/admin/ocean/rollover", verifyJWT, requireAdmin, (req, res) => {
    const parsed = z.object({ randomBps: z.number().int().min(0).max(9999).default(5000) }).safeParse(req.body ?? {})
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const oceanState = domainModuleService.rollover(parsed.data.randomBps)
    void notifyOceanActionToChat("rollover", oceanState)
    respondWithContract(res, oceanStateContract, oceanState)
  })

  app.post("/api/admin/withdraw/:id/approve", verifyJWT, requireAdmin, (req, res) => {
    const parsed = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    try {
      const txHash = tonIntegrationService.sendWithdrawal(parsed.data.id)
      return respondWithContract(res, adminApproveContract, { success: true, txHash })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Cannot approve" })
    }
  })

  app.post("/api/admin/withdraw/:id/reject", verifyJWT, requireAdmin, (req, res) => {
    const parsed = z.object({ id: z.coerce.number().int().positive() }).safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    try {
      const payment = billingPaymentsService.rejectWithdrawal(parsed.data.id)
      return respondWithContract(res, adminRejectContract, { success: true, payment })
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Cannot reject" })
    }
  })
}
