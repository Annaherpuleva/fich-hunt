import type { StoredPayment } from "../state"
import { appState } from "../state"
import { billingLedgerService } from "./ledger-service"

const WITHDRAWAL_IDEMPOTENCY_PREFIX = "withdraw-payment"

export class BillingPaymentsService {
  createWithdrawRequest(userId: number, amount: bigint): StoredPayment {
    billingLedgerService.ensureSufficientBalance(userId, amount)

    const payment: StoredPayment = {
      id: appState.nextPaymentId(),
      userId,
      direction: "withdraw",
      amount,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    appState.payments.set(payment.id, payment)
    this.enqueueWithdrawal(payment.id)
    return payment
  }

  createDepositIntent(userId: number, amount: bigint, memo: string): StoredPayment {
    const payment: StoredPayment = {
      id: appState.nextPaymentId(),
      userId,
      direction: "deposit",
      amount,
      memo,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    appState.payments.set(payment.id, payment)
    return payment
  }

  confirmPayment(paymentId: number, txHash: string, idempotencyKey?: string): StoredPayment {
    if (idempotencyKey && appState.consumedIdempotencyKeys.has(idempotencyKey)) {
      const knownPayment = appState.payments.get(paymentId)
      if (!knownPayment) throw new Error("Payment not found")
      return knownPayment
    }

    const payment = appState.payments.get(paymentId)
    if (!payment) throw new Error("Payment not found")
    if (payment.status === "confirmed") {
      if (idempotencyKey) appState.consumedIdempotencyKeys.add(idempotencyKey)
      return payment
    }

    payment.status = "confirmed"
    payment.txHash = txHash
    payment.updatedAt = new Date()

    const delta = payment.direction === "deposit" ? payment.amount : -payment.amount
    billingLedgerService.addEntry({
      userId: payment.userId,
      delta,
      reason: `${payment.direction}:confirmed`,
      refId: String(payment.id),
      createdAt: payment.updatedAt,
    })

    if (idempotencyKey) appState.consumedIdempotencyKeys.add(idempotencyKey)

    return payment
  }

  rejectWithdrawal(paymentId: number): StoredPayment {
    const payment = appState.payments.get(paymentId)
    if (!payment || payment.direction !== "withdraw") {
      throw new Error("Withdrawal not found")
    }
    if (payment.status !== "pending") throw new Error("Only pending withdrawals can be rejected")

    payment.status = "failed"
    payment.updatedAt = new Date()
    return payment
  }

  listUserPayments(userId: number): StoredPayment[] {
    return Array.from(appState.payments.values()).filter((p) => p.userId === userId)
  }

  getPendingWithdrawals(): StoredPayment[] {
    return Array.from(appState.payments.values()).filter((p) => p.direction === "withdraw" && p.status === "pending")
  }

  enqueueWithdrawal(paymentId: number, nextAttemptAtMs = Date.now()): void {
    const payment = appState.payments.get(paymentId)
    if (!payment || payment.direction !== "withdraw" || payment.status !== "pending") {
      throw new Error("Pending withdrawal not found")
    }

    if (appState.withdrawalQueue.some((item) => item.paymentId === paymentId)) {
      return
    }

    appState.withdrawalQueue.push({
      paymentId,
      nextAttemptAt: nextAttemptAtMs,
      attempts: 0,
      idempotencyKey: `${WITHDRAWAL_IDEMPOTENCY_PREFIX}:${paymentId}`,
    })
  }

  getReadyWithdrawalQueue(nowMs = Date.now()) {
    return appState.withdrawalQueue.filter((item) => item.nextAttemptAt <= nowMs)
  }

  removeQueuedWithdrawal(paymentId: number) {
    appState.withdrawalQueue = appState.withdrawalQueue.filter((item) => item.paymentId !== paymentId)
    appState.withdrawalDispatchLocks.delete(paymentId)
  }

  updateQueuedWithdrawalRetry(paymentId: number, attempts: number, nextAttemptAt: number, lastError: string) {
    const target = appState.withdrawalQueue.find((item) => item.paymentId === paymentId)
    if (!target) return

    target.attempts = attempts
    target.nextAttemptAt = nextAttemptAt
    target.lastError = lastError
    appState.withdrawalDispatchLocks.delete(paymentId)
  }

  lockWithdrawalDispatch(paymentId: number): boolean {
    if (appState.withdrawalDispatchLocks.has(paymentId)) return false
    appState.withdrawalDispatchLocks.add(paymentId)
    return true
  }

  getWithdrawalQueueSnapshot() {
    return appState.withdrawalQueue.map((item) => ({ ...item }))
  }
}

export const billingPaymentsService = new BillingPaymentsService()
