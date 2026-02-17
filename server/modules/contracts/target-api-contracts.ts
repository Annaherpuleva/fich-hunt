import { z } from "zod"

const bigintString = z.string().regex(/^-?\d+$/)
const isoDateString = z.string().datetime()

export const fishContract = z.object({
  id: z.number().int().positive(),
  ownerUserId: z.number().int().positive(),
  name: z.string().min(1),
  share: bigintString,
  createdAt: isoDateString,
  lastFedAt: isoDateString.nullable(),
  lastHuntAt: isoDateString.nullable(),
  canHuntAfter: isoDateString.nullable(),
  isProtected: z.boolean(),
  protectionEndsAt: isoDateString.nullable(),
  markedByFishId: z.number().int().positive().nullable(),
  markExpiresAt: isoDateString.nullable(),
  status: z.enum(["alive", "dead", "exited"]),
  version: z.number().int().positive(),
})

export const oceanStateContract = z.object({
  id: z.literal(1),
  totalFishCount: z.number().int().nonnegative(),
  totalShares: bigintString,
  balanceUnits: bigintString,
  mode: z.enum(["calm", "storm"]),
  feedingPercentageBps: z.number().int().nonnegative(),
  stormProbabilityBps: z.number().int().nonnegative(),
  cycleStartTime: isoDateString,
  nextModeChangeTime: isoDateString,
  updatedAt: isoDateString,
})

export const meLedgerContract = z.object({
  entries: z.array(
    z.object({
      userId: z.number().int().positive(),
      delta: bigintString,
      reason: z.string().min(1),
      refId: z.string().nullable().optional(),
      createdAt: isoDateString,
    }),
  ),
  balance: bigintString,
})

export const paymentsContract = z.array(
  z.object({
    id: z.number().int().positive(),
    userId: z.number().int().positive(),
    direction: z.enum(["deposit", "withdraw"]),
    amount: bigintString,
    status: z.enum(["pending", "confirmed", "failed"]),
    memo: z.string().nullable().optional(),
    txHash: z.string().nullable().optional(),
    createdAt: isoDateString,
    updatedAt: isoDateString,
  }),
)

export const depositIntentContract = z.object({
  payment: paymentsContract.element,
  asset: z.literal("USDT_TON"),
  depositAddress: z.string().min(10),
  confirmationsRequired: z.number().int().positive(),
})

export const tonManifestContract = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  iconUrl: z.string().url(),
  termsOfUseUrl: z.string().url(),
  privacyPolicyUrl: z.string().url(),
  supportedWallets: z.array(z.string().min(1)).min(1),
})

export const huntResultContract = z.object({
  hunter: fishContract,
  prey: fishContract,
})

export const exitResultContract = z.object({
  fish: fishContract,
  payoutUnits: bigintString,
})

export const adminApproveContract = z.object({
  success: z.literal(true),
  txHash: z.string().min(1),
})

export const adminRejectContract = z.object({
  success: z.literal(true),
  payment: paymentsContract.element,
})

export const gameConfigContract = z.object({
  currencyCode: z.literal("TON"),
  atomicUnitsPerCurrency: z.string().regex(/^\d+$/),
  minDepositAtomic: z.string().regex(/^\d+$/),
  minFeedAtomic: z.string().regex(/^\d+$/),
  commissionBps: z.number().int().nonnegative(),
})
