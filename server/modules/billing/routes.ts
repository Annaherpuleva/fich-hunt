import type { Express } from "express"
import { z } from "zod"
import { verifyJWT } from "../../middleware/jwt"
import { depositIntentContract, meLedgerContract, paymentsContract } from "../contracts/target-api-contracts"
import { respondWithContract } from "../contracts/response"
import { billingLedgerService } from "./ledger-service"
import { billingPaymentsService } from "./payments-service"
import { tonIntegrationService } from "../integrations/ton-service"

export function setupBillingModuleRoutes(app: Express) {
  app.get("/api/me/ledger", verifyJWT, (req, res) => {
    const entries = billingLedgerService.getUserLedger(req.user!.sub)
    const balance = billingLedgerService.getUserBalance(req.user!.sub)
    respondWithContract(res, meLedgerContract, { entries, balance })
  })

  app.get("/api/me/payments", verifyJWT, (req, res) => {
    respondWithContract(res, paymentsContract, billingPaymentsService.listUserPayments(req.user!.sub))
  })

  app.post("/api/payments/deposit-intent", verifyJWT, (req, res) => {
    const parsed = z.object({ amount: z.coerce.bigint().positive(), memo: z.string().min(3) }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    const payment = billingPaymentsService.createDepositIntent(req.user!.sub, parsed.data.amount, parsed.data.memo)
    const config = tonIntegrationService.getDepositConfig()

    respondWithContract(res, depositIntentContract, {
      payment,
      ...config,
    }, 201)
  })

  app.post("/api/payments/withdraw", verifyJWT, (req, res) => {
    const parsed = z.object({ amount: z.coerce.bigint().positive() }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    try {
      res.status(201).json(billingPaymentsService.createWithdrawRequest(req.user!.sub, parsed.data.amount))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })
}
