import { appState } from "../state"
import { billingPaymentsService } from "../billing/payments-service"

const MIN_CONFIRMATIONS = 1
const DEFAULT_USDT_DEPOSIT_ADDRESS = process.env.TON_USDT_DEPOSIT_ADDRESS ?? "UQDBSgcChGzgjE7DxjnirzwGoWvfiLRsWiZ6zypMbMcbwMX7"

export class TonIntegrationService {
  private withdrawalFailuresLeft = new Map<number, number>()

  setWithdrawalFailures(paymentId: number, failuresCount: number) {
    this.withdrawalFailuresLeft.set(paymentId, Math.max(0, failuresCount))
  }


  getDepositConfig() {
    return {
      asset: "USDT_TON" as const,
      depositAddress: DEFAULT_USDT_DEPOSIT_ADDRESS,
      confirmationsRequired: MIN_CONFIRMATIONS,
    }
  }

  pushInboundTransfer(txHash: string, amount: bigint, memo?: string, confirmations = MIN_CONFIRMATIONS) {
    appState.inboundTonTransfers.push({ txHash, amount, memo, confirmations })
  }

  syncDeposits(): number {
    let confirmed = 0
    const pendingInbound = appState.inboundTonTransfers.splice(0)

    for (const tx of pendingInbound) {
      if (appState.processedInboundTxHashes.has(tx.txHash)) {
        continue
      }

      if ((tx.confirmations ?? 0) < MIN_CONFIRMATIONS) {
        appState.inboundTonTransfers.push(tx)
        continue
      }

      const match = Array.from(appState.payments.values()).find(
        (payment) => payment.direction === "deposit" && payment.status === "pending" && payment.memo === tx.memo && payment.amount === tx.amount,
      )

      if (!match) {
        appState.workerAlerts.push({
          type: "deposit_unmatched",
          message: `Unmatched inbound tx ${tx.txHash}: memo=${tx.memo ?? "-"} amount=${tx.amount.toString()}`,
          createdAt: new Date(),
          txHash: tx.txHash,
        })
        continue
      }

      const idempotencyKey = `deposit:${tx.txHash}`
      billingPaymentsService.confirmPayment(match.id, tx.txHash, idempotencyKey)
      appState.processedInboundTxHashes.add(tx.txHash)
      confirmed += 1
    }

    return confirmed
  }

  sendWithdrawal(paymentId: number, idempotencyKey: string): string {
    const failuresLeft = this.withdrawalFailuresLeft.get(paymentId) ?? 0
    if (failuresLeft > 0) {
      this.withdrawalFailuresLeft.set(paymentId, failuresLeft - 1)
      throw new Error(`Simulated TON send failure for payment ${paymentId}`)
    }

    const txHash = `ton_${paymentId}_${Date.now()}`
    billingPaymentsService.confirmPayment(paymentId, txHash, idempotencyKey)
    return txHash
  }
}

export const tonIntegrationService = new TonIntegrationService()
