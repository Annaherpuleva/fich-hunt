import type { LedgerEntry } from "../types"

export class LedgerService {
  getBalance(entries: LedgerEntry[], userId: number): bigint {
    return entries.filter((entry) => entry.userId === userId).reduce((sum, entry) => sum + entry.delta, BigInt(0))
  }

  appendEntry(entries: LedgerEntry[], entry: LedgerEntry): LedgerEntry[] {
    return [...entries, { ...entry, createdAt: entry.createdAt ?? new Date() }]
  }

  ensureSufficientBalance(entries: LedgerEntry[], userId: number, amount: bigint): void {
    if (amount <= BigInt(0)) {
      throw new Error("Amount must be positive")
    }

    const balance = this.getBalance(entries, userId)
    if (balance < amount) {
      throw new Error("Insufficient ledger balance")
    }
  }
}
