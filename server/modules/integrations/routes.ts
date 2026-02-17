import type { Express } from "express"
import { z } from "zod"
import { verifyJWT } from "../../middleware/jwt"
import { telegramIntegrationService } from "./telegram-service"
import { tonIntegrationService } from "./ton-service"
import { tonWalletService } from "./ton-wallet-service"
import { respondWithContract } from "../contracts/response"
import { tonManifestContract } from "../contracts/target-api-contracts"

export function setupIntegrationsModuleRoutes(app: Express) {

  app.get("/api/integrations/ton/manifest", (_req, res) => {
    respondWithContract(res, tonManifestContract, tonWalletService.getTonConnectManifest())
  })

  app.get("/.well-known/tonconnect-manifest.json", (_req, res) => {
    respondWithContract(res, tonManifestContract, tonWalletService.getTonConnectManifest())
  })
  app.post("/api/integrations/ton/inbound", (req, res) => {
    const parsed = z.object({ txHash: z.string().min(6), amount: z.coerce.bigint().positive(), memo: z.string().optional(), confirmations: z.coerce.number().int().min(0).optional() }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    tonIntegrationService.pushInboundTransfer(parsed.data.txHash, parsed.data.amount, parsed.data.memo, parsed.data.confirmations)
    res.status(202).json({ accepted: true })
  })

  app.post("/api/integrations/ton/sync", (_req, res) => {
    const confirmed = tonIntegrationService.syncDeposits()
    res.json({ confirmed })
  })

  app.post("/api/integrations/telegram/notify", verifyJWT, (req, res) => {
    const parsed = z.object({ message: z.string().min(1) }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    res.status(201).json(telegramIntegrationService.notify(req.user!.sub, parsed.data.message))
  })
}
