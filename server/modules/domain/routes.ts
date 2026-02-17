import type { Express } from "express"
import { z } from "zod"
import { verifyJWT } from "../../middleware/jwt"
import {
  exitResultContract,
  fishContract,
  huntResultContract,
  oceanStateContract,
} from "../contracts/target-api-contracts"
import { respondWithContract } from "../contracts/response"
import { domainModuleService } from "./service"

const idParam = z.object({ id: z.coerce.number().int().positive() })
const amountSchema = z.coerce.bigint().refine((value) => value > BigInt(0), "must be > 0")
const preySearchQuery = z.object({
  walletAddress: z.string().min(16).max(128).optional(),
  name: z.string().min(1).max(120).optional(),
})

export function setupDomainModuleRoutes(app: Express) {
  app.get("/api/ocean/state", (_req, res) => {
    respondWithContract(res, oceanStateContract, domainModuleService.getOceanState())
  })

  app.get("/api/fish/:id", (req, res) => {
    const parsed = idParam.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    try {
      respondWithContract(res, fishContract, domainModuleService.getFish(parsed.data.id))
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : "Not found" })
    }
  })

  app.get("/api/me/fish", verifyJWT, (req, res) => {
    respondWithContract(res, z.array(fishContract), domainModuleService.listFishByOwner(req.user!.sub))
  })

  app.get("/api/prey/search", verifyJWT, (req, res) => {
    const parsed = preySearchQuery.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    respondWithContract(
      res,
      z.array(fishContract),
      domainModuleService.searchPrey({
        hunterUserId: req.user!.sub,
        victimWalletAddress: parsed.data.walletAddress,
        victimName: parsed.data.name,
      }),
    )
  })

  app.post("/api/fish/create", verifyJWT, (req, res) => {
    const parsed = z.object({ name: z.string().min(1), depositUnits: amountSchema }).safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

    try {
      const fish = domainModuleService.createFish(req.user!.sub, parsed.data.name, parsed.data.depositUnits)
      respondWithContract(res, fishContract, fish, 201)
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })

  app.post("/api/fish/:id/feed", verifyJWT, (req, res) => {
    const params = idParam.safeParse(req.params)
    const body = z.object({ amountUnits: amountSchema, expectedVersion: z.number().int().positive() }).safeParse(req.body)
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid payload" })

    try {
      respondWithContract(res, fishContract, domainModuleService.feedFish(params.data.id, req.user!.sub, body.data.amountUnits, body.data.expectedVersion))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })

  app.post("/api/fish/:id/place-mark", verifyJWT, (req, res) => {
    const params = idParam.safeParse(req.params)
    const body = z.object({ preyFishId: z.number().int().positive(), expectedHunterVersion: z.number().int().positive(), expectedPreyVersion: z.number().int().positive() }).safeParse(req.body)
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid payload" })

    try {
      respondWithContract(res, huntResultContract, domainModuleService.placeMark(params.data.id, body.data.preyFishId, req.user!.sub, body.data.expectedHunterVersion, body.data.expectedPreyVersion))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })

  app.post("/api/fish/:id/hunt", verifyJWT, (req, res) => {
    const params = idParam.safeParse(req.params)
    const body = z.object({ preyFishId: z.number().int().positive(), expectedHunterVersion: z.number().int().positive(), expectedPreyVersion: z.number().int().positive() }).safeParse(req.body)
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid payload" })

    try {
      respondWithContract(res, huntResultContract, domainModuleService.huntFish(params.data.id, body.data.preyFishId, req.user!.sub, body.data.expectedHunterVersion, body.data.expectedPreyVersion))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })

  app.post("/api/fish/:id/resurrect", verifyJWT, (req, res) => {
    const params = idParam.safeParse(req.params)
    const body = z.object({ depositUnits: amountSchema, expectedVersion: z.number().int().positive() }).safeParse(req.body)
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid payload" })

    try {
      respondWithContract(res, fishContract, domainModuleService.resurrectFish(params.data.id, req.user!.sub, body.data.expectedVersion, body.data.depositUnits))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })

  app.post("/api/fish/:id/exit", verifyJWT, (req, res) => {
    const params = idParam.safeParse(req.params)
    const body = z.object({ expectedVersion: z.number().int().positive() }).safeParse(req.body)
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid payload" })

    try {
      respondWithContract(res, exitResultContract, domainModuleService.exitFish(params.data.id, req.user!.sub, body.data.expectedVersion))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })

  app.post("/api/fish/:id/transfer", verifyJWT, (req, res) => {
    const params = idParam.safeParse(req.params)
    const body = z.object({ newOwnerUserId: z.number().int().positive(), expectedVersion: z.number().int().positive() }).safeParse(req.body)
    if (!params.success || !body.success) return res.status(400).json({ error: "Invalid payload" })

    try {
      respondWithContract(res, fishContract, domainModuleService.transferFish(params.data.id, req.user!.sub, body.data.expectedVersion, body.data.newOwnerUserId))
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Bad request" })
    }
  })
}
