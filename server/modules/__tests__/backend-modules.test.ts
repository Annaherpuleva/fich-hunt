import assert from "node:assert/strict"
import crypto from "node:crypto"

import { authService } from "../auth/service"
import { billingLedgerService } from "../billing/ledger-service"
import { billingPaymentsService } from "../billing/payments-service"
import { domainModuleService } from "../domain/service"
import { tonIntegrationService } from "../integrations/ton-service"
import { indexerWorkerService } from "../worker/indexer-service"
import { appState } from "../state"

function buildInitData(user: { id: number; username: string }, botToken: string): string {
  const auth_date = String(Math.floor(Date.now() / 1000))
  const params = new URLSearchParams({
    user: JSON.stringify(user),
    auth_date,
    query_id: "q1",
  })

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")
  params.append("hash", hash)
  return params.toString()
}

const botToken = process.env.TELEGRAM_BOT_TOKEN || "dev-bot-token"

const initData = buildInitData({ id: 101, username: "alice" }, botToken)
const login = authService.validateAndLogin(initData)
assert.ok(login.token.length > 10)
assert.equal(login.isNew, true)

assert.throws(() => authService.validateAndLogin(initData), /replay/)

const fish = domainModuleService.createFish(login.user.id, "alpha", BigInt(20_000_000))
assert.equal(fish.version, 1)

const fed = domainModuleService.feedFish(fish.id, login.user.id, BigInt(10_000_000), 1)
assert.equal(fed.version, 2)
assert.throws(() => domainModuleService.feedFish(fish.id, login.user.id, BigInt(10_000_000), 1), /Optimistic lock conflict/)

billingLedgerService.addEntry({ userId: login.user.id, delta: BigInt(1000), reason: "seed" })

const deposit = billingPaymentsService.createDepositIntent(login.user.id, BigInt(500), "memo-1")
tonIntegrationService.pushInboundTransfer("tx-dep-1", BigInt(500), "memo-1")
tonIntegrationService.pushInboundTransfer("tx-dep-1", BigInt(500), "memo-1")
tonIntegrationService.pushInboundTransfer("tx-dep-unmatched", BigInt(700), "memo-x")

const depositCycleResult = indexerWorkerService.runCycle()
assert.equal(depositCycleResult.confirmedDeposits, 1)
assert.equal(depositCycleResult.alertsRaised, 1)

const confirmedDeposit = appState.payments.get(deposit.id)
assert.equal(confirmedDeposit?.status, "confirmed")
const depositLedgerEntries = billingLedgerService.getUserLedger(login.user.id).filter((entry) => entry.refId === String(deposit.id))
assert.equal(depositLedgerEntries.length, 1)

const withdraw = billingPaymentsService.createWithdrawRequest(login.user.id, BigInt(200))
tonIntegrationService.setWithdrawalFailures(withdraw.id, 1)

const withdrawRetryCycle = indexerWorkerService.runCycle()
assert.equal(withdrawRetryCycle.retriedWithdrawals, 1)
assert.equal(withdrawRetryCycle.processedWithdrawals, 0)

const queueAfterRetry = billingPaymentsService.getWithdrawalQueueSnapshot()
assert.equal(queueAfterRetry.length, 1)
assert.equal(queueAfterRetry[0].attempts, 1)

const withdrawProcessCycle = indexerWorkerService.runCycle(queueAfterRetry[0].nextAttemptAt)
assert.equal(withdrawProcessCycle.processedWithdrawals, 1)

const userPayments = billingPaymentsService.listUserPayments(login.user.id)
assert.ok(userPayments.some((payment) => payment.id === deposit.id && payment.status === "confirmed"))
assert.ok(userPayments.some((payment) => payment.id === withdraw.id && payment.status === "confirmed"))

const withdrawLedgerEntries = billingLedgerService.getUserLedger(login.user.id).filter((entry) => entry.refId === String(withdraw.id))
assert.equal(withdrawLedgerEntries.length, 1)

const balance = billingLedgerService.getUserBalance(login.user.id)
assert.equal(balance, BigInt(1300))

assert.equal(appState.users.size >= 1, true)
assert.equal(appState.workerAlerts.some((alert) => alert.type === "deposit_unmatched"), true)
assert.equal(appState.workerAlerts.some((alert) => alert.type === "withdrawal_retry"), true)

const createEvent = appState.gameEvents.find((event) => event.eventType === "fish_created")
assert.ok(createEvent)
assert.match(createEvent!.comment, /create fish/i)

const depositEvent = appState.gameEvents.find((event) => event.eventType === "ton_deposit_confirmed")
assert.ok(depositEvent)
assert.match(depositEvent!.comment, /deposit confirmed/i)

const withdrawEvent = appState.gameEvents.find((event) => event.eventType === "ton_withdrawal_sent")
assert.ok(withdrawEvent)
assert.match(withdrawEvent!.comment, /withdrawal sent/i)
console.log("backend-modules.test.ts: ok")
