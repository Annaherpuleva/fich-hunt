import { LedgerService } from "../../domain/services/ledgerService"
import type { LedgerEntry } from "../../domain/types"
import { appState } from "../state"

export class BillingLedgerService {
  private ledgerService = new LedgerService()

  addEntry(entry: LedgerEntry): LedgerEntry {
    appState.ledgerEntries = this.ledgerService.appendEntry(appState.ledgerEntries, entry)
    return appState.ledgerEntries[appState.ledgerEntries.length - 1]
  }

  getUserLedger(userId: number): LedgerEntry[] {
    return appState.ledgerEntries.filter((entry) => entry.userId === userId)
  }

  getUserBalance(userId: number): bigint {
    return this.ledgerService.getBalance(appState.ledgerEntries, userId)
  }

  ensureSufficientBalance(userId: number, amount: bigint): void {
    this.ledgerService.ensureSufficientBalance(appState.ledgerEntries, userId, amount)
  }
}

export const billingLedgerService = new BillingLedgerService()
