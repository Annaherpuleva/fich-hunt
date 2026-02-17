import { billingPaymentsService } from "../billing/payments-service"
import { telegramIntegrationService } from "../integrations/telegram-service"
import { tonIntegrationService } from "../integrations/ton-service"
import { appState } from "../state"

const MAX_WITHDRAW_RETRIES = 3
const BACKOFF_BASE_MS = 1_000

export type WorkerCycleResult = {
  confirmedDeposits: number
  processedWithdrawals: number
  retriedWithdrawals: number
  failedWithdrawals: number
  alertsRaised: number
}

export class IndexerWorkerService {
  runCycle(nowMs = Date.now()): WorkerCycleResult {
    const alertStart = appState.workerAlerts.length
    const confirmedDeposits = tonIntegrationService.syncDeposits()
    const readyQueue = billingPaymentsService.getReadyWithdrawalQueue(nowMs)

    let processedWithdrawals = 0
    let retriedWithdrawals = 0
    let failedWithdrawals = 0

    for (const queueItem of readyQueue) {
      const payment = appState.payments.get(queueItem.paymentId)
      if (!payment || payment.direction !== "withdraw" || payment.status !== "pending") {
        billingPaymentsService.removeQueuedWithdrawal(queueItem.paymentId)
        continue
      }

      if (!billingPaymentsService.lockWithdrawalDispatch(queueItem.paymentId)) {
        continue
      }

      try {
        const txHash = tonIntegrationService.sendWithdrawal(queueItem.paymentId, queueItem.idempotencyKey)
        telegramIntegrationService.notify(payment.userId, `Withdrawal ${payment.id} confirmed: ${txHash}`)
        billingPaymentsService.removeQueuedWithdrawal(queueItem.paymentId)
        processedWithdrawals += 1
      } catch (error) {
        const nextAttempts = queueItem.attempts + 1
        const reason = error instanceof Error ? error.message : "Unknown withdraw dispatch error"

        if (nextAttempts >= MAX_WITHDRAW_RETRIES) {
          payment.status = "failed"
          payment.updatedAt = new Date()
          appState.workerAlerts.push({
            type: "withdrawal_failed",
            message: `Withdrawal ${payment.id} failed after ${nextAttempts} attempts: ${reason}`,
            createdAt: new Date(),
            paymentId: payment.id,
          })
          billingPaymentsService.removeQueuedWithdrawal(payment.id)
          failedWithdrawals += 1
          continue
        }

        const backoffMs = BACKOFF_BASE_MS * 2 ** (nextAttempts - 1)
        billingPaymentsService.updateQueuedWithdrawalRetry(payment.id, nextAttempts, nowMs + backoffMs, reason)
        appState.workerAlerts.push({
          type: "withdrawal_retry",
          message: `Withdrawal ${payment.id} retry ${nextAttempts}/${MAX_WITHDRAW_RETRIES - 1}: ${reason}`,
          createdAt: new Date(),
          paymentId: payment.id,
        })
        retriedWithdrawals += 1
      }
    }

    return {
      confirmedDeposits,
      processedWithdrawals,
      retriedWithdrawals,
      failedWithdrawals,
      alertsRaised: appState.workerAlerts.length - alertStart,
    }
  }
}

export const indexerWorkerService = new IndexerWorkerService()
