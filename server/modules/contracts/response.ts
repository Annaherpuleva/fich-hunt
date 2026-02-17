import type { Response } from "express"
import type { ZodTypeAny } from "zod"

function toJsonSafe<T>(value: T): unknown {
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(toJsonSafe)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)]))
  }
  return value
}

export function respondWithContract(res: Response, contract: ZodTypeAny, payload: unknown, status = 200) {
  const safePayload = toJsonSafe(payload)
  const parsed = contract.parse(safePayload)
  return res.status(status).json(parsed)
}
