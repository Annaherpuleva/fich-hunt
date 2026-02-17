import { OceanService } from "../domain/services/oceanService"
import type { Fish, LedgerEntry, OceanState, Payment } from "../domain/types"

export type AppUser = {
  id: number
  telegramId: string
  username?: string
  role: "user" | "admin"
}

export type StoredPayment = Payment & {
  id: number
  createdAt: Date
  updatedAt: Date
}

export type PendingTonTransfer = {
  txHash: string
  amount: bigint
  memo?: string
  confirmations?: number
}

export type WithdrawalQueueItem = {
  paymentId: number
  nextAttemptAt: number
  attempts: number
  idempotencyKey: string
  lastError?: string
}

export type WorkerAlert = {
  type: "deposit_unmatched" | "withdrawal_retry" | "withdrawal_failed"
  message: string
  createdAt: Date
  paymentId?: number
  txHash?: string
}

class InMemoryState {
  users = new Map<number, AppUser>()
  usersByTelegramId = new Map<string, AppUser>()
  sessions = new Map<string, { userId: number; createdAt: Date }>()
  consumedInitDataHashes = new Set<string>()
  fish = new Map<number, Fish>()
  ledgerEntries: LedgerEntry[] = []
  payments = new Map<number, StoredPayment>()
  inboundTonTransfers: PendingTonTransfer[] = []
  processedInboundTxHashes = new Set<string>()
  consumedIdempotencyKeys = new Set<string>()
  withdrawalQueue: WithdrawalQueueItem[] = []
  withdrawalDispatchLocks = new Set<number>()
  workerAlerts: WorkerAlert[] = []
  ocean: OceanState
  private fishSeq = 1
  private paymentSeq = 1

  constructor() {
    const oceanService = new OceanService()
    this.ocean = oceanService.initialize()
  }

  nextFishId(): number {
    return this.fishSeq++
  }

  nextPaymentId(): number {
    return this.paymentSeq++
  }
}

export const appState = new InMemoryState()
