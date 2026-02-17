export type OceanMode = "calm" | "storm"
export type FishStatus = "alive" | "dead" | "exited"

export interface OceanState {
  id: 1
  totalFishCount: number
  totalShares: bigint
  balanceUnits: bigint
  mode: OceanMode
  feedingPercentageBps: number
  stormProbabilityBps: number
  cycleStartTime: Date
  nextModeChangeTime: Date
  updatedAt: Date
}

export interface Fish {
  id: number
  ownerUserId: number
  name: string
  share: bigint
  createdAt: Date
  lastFedAt: Date | null
  lastHuntAt: Date | null
  canHuntAfter: Date | null
  isProtected: boolean
  protectionEndsAt: Date | null
  markedByFishId: number | null
  markExpiresAt: Date | null
  status: FishStatus
  version: number
}

export interface LedgerEntry {
  userId: number
  delta: bigint
  reason: string
  refId?: string | null
  createdAt?: Date
}

export interface Payment {
  userId: number
  direction: "deposit" | "withdraw"
  amount: bigint
  status: "pending" | "confirmed" | "failed"
  memo?: string | null
  txHash?: string | null
}

export interface CreateFishInput {
  ownerUserId: number
  name: string
  depositUnits: bigint
}

export interface FeedFishInput {
  fishId: number
  actorUserId: number
  amountUnits: bigint
  expectedVersion: number
}

export interface HuntFishInput {
  hunterFishId: number
  preyFishId: number
  actorUserId: number
  expectedHunterVersion: number
  expectedPreyVersion: number
}

export interface TransferFishInput {
  fishId: number
  actorUserId: number
  newOwnerUserId: number
  expectedVersion: number
}

export interface ExitFishInput {
  fishId: number
  actorUserId: number
  expectedVersion: number
}

export interface ResurrectFishInput {
  fishId: number
  actorUserId: number
  depositUnits: bigint
  expectedVersion: number
}

export interface PlaceMarkInput {
  hunterFishId: number
  preyFishId: number
  actorUserId: number
  expectedHunterVersion: number
  expectedPreyVersion: number
}
