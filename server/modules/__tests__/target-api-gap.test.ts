import assert from "node:assert/strict"
import { once } from "node:events"

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret"

const { registerRoutes } = await import("../../routes/index")
const { generateAccessToken } = await import("../../jwt")
const { appState } = await import("../state")
const { billingLedgerService } = await import("../billing/ledger-service")
const { billingPaymentsService } = await import("../billing/payments-service")
const {
  adminApproveContract,
  adminRejectContract,
  exitResultContract,
  fishContract,
  huntResultContract,
  meLedgerContract,
  oceanStateContract,
  paymentsContract,
  tonManifestContract,
  depositIntentContract,
} = await import("../contracts/target-api-contracts")

function resetState() {
  appState.users.clear()
  appState.usersByTelegramId.clear()
  appState.sessions.clear()
  appState.consumedInitDataHashes.clear()
  appState.fish.clear()
  appState.ledgerEntries = []
  appState.payments.clear()
  appState.inboundTonTransfers = []
  appState.processedInboundTxHashes.clear()
  appState.consumedIdempotencyKeys.clear()
  appState.withdrawalQueue = []
  appState.withdrawalDispatchLocks.clear()
  appState.workerAlerts = []
}

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, init)
  const body = await response.json()
  return { response, body }
}

resetState()

const app = (await import("express")).default()
app.use((await import("express")).default.json())
const server = await registerRoutes(app)
server.listen(0, "127.0.0.1")
await once(server, "listening")
const address = server.address()
if (!address || typeof address === "string") throw new Error("Cannot resolve test server port")
const baseUrl = `http://127.0.0.1:${address.port}`

const userToken = generateAccessToken({ sub: 10, telegramId: 10010, username: "user", role: "user" })
const adminToken = generateAccessToken({ sub: 1, telegramId: 10001, username: "admin", role: "admin" })
const authUser = { Authorization: `Bearer ${userToken}`, "Content-Type": "application/json" }
const authAdmin = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }

billingLedgerService.addEntry({ userId: 10, delta: BigInt(5_000_000), reason: "seed" })

try {
  const ocean = await request(`${baseUrl}/api/ocean/state`)
  assert.equal(ocean.response.status, 200)
  oceanStateContract.parse(ocean.body)

  const created = await request(`${baseUrl}/api/fish/create`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ name: "beta", depositUnits: "20000000" }),
  })
  assert.equal(created.response.status, 201)
  const createdFish = fishContract.parse(created.body)

  const fishById = await request(`${baseUrl}/api/fish/${createdFish.id}`)
  fishContract.parse(fishById.body)

  const myFish = await request(`${baseUrl}/api/me/fish`, { headers: authUser })
  assert.equal(myFish.response.status, 200)
  assert.equal(Array.isArray(myFish.body), true)
  myFish.body.forEach((item: unknown) => fishContract.parse(item))

  const fed = await request(`${baseUrl}/api/fish/${createdFish.id}/feed`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ amountUnits: "10000000", expectedVersion: 1 }),
  })
  const fishAfterFeed = fishContract.parse(fed.body)

  const prey = await request(`${baseUrl}/api/fish/create`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ name: "prey", depositUnits: "20000000" }),
  })
  const preyFish = fishContract.parse(prey.body)

  const placeMark = await request(`${baseUrl}/api/fish/${fishAfterFeed.id}/place-mark`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ preyFishId: preyFish.id, expectedHunterVersion: fishAfterFeed.version, expectedPreyVersion: preyFish.version }),
  })
  const marked = huntResultContract.parse(placeMark.body)

  const hunted = await request(`${baseUrl}/api/fish/${fishAfterFeed.id}/hunt`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ preyFishId: preyFish.id, expectedHunterVersion: marked.hunter.version, expectedPreyVersion: marked.prey.version }),
  })
  const huntedResult = huntResultContract.parse(hunted.body)

  const preyExited = await request(`${baseUrl}/api/fish/${preyFish.id}/exit`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ expectedVersion: huntedResult.prey.version }),
  })
  const preyExit = exitResultContract.parse(preyExited.body)

  const resurrect = await request(`${baseUrl}/api/fish/${preyFish.id}/resurrect`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ depositUnits: "12000000", expectedVersion: preyExit.fish.version }),
  })
  const resurrected = fishContract.parse(resurrect.body)

  const transferred = await request(`${baseUrl}/api/fish/${resurrected.id}/transfer`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ newOwnerUserId: 11, expectedVersion: resurrected.version }),
  })
  fishContract.parse(transferred.body)

  const exited = await request(`${baseUrl}/api/fish/${createdFish.id}/exit`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ expectedVersion: 4 }),
  })
  exitResultContract.parse(exited.body)

  const depositIntentResponse = await request(`${baseUrl}/api/payments/deposit-intent`, {
    method: "POST",
    headers: authUser,
    body: JSON.stringify({ amount: "500", memo: "memo-gap-api" }),
  })
  assert.equal(depositIntentResponse.response.status, 201)
  const parsedDepositIntent = depositIntentContract.parse(depositIntentResponse.body)
  assert.equal(parsedDepositIntent.asset, "USDT_TON")
  assert.ok(parsedDepositIntent.depositAddress.length >= 10)

  const depositIntent = billingPaymentsService.createDepositIntent(10, BigInt(500), "memo-gap")

  const inbound = await request(`${baseUrl}/api/integrations/ton/inbound`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txHash: "tx-gap-1", amount: "500", memo: "memo-gap", confirmations: 1 }),
  })
  assert.equal(inbound.response.status, 202)

  await request(`${baseUrl}/api/integrations/ton/sync`, { method: "POST" })

  const ledger = await request(`${baseUrl}/api/me/ledger`, { headers: authUser })
  meLedgerContract.parse(ledger.body)

  const payments = await request(`${baseUrl}/api/me/payments`, { headers: authUser })
  const parsedPayments = paymentsContract.parse(payments.body)
  assert.ok(parsedPayments.some((payment: { id: number; direction: string; status: string }) => payment.id === depositIntent.id && payment.direction === "deposit" && payment.status === "confirmed"))

  const withdrawalId = billingPaymentsService.createWithdrawRequest(10, BigInt(100)).id

  const approve = await request(`${baseUrl}/api/admin/withdraw/${withdrawalId}/approve`, {
    method: "POST",
    headers: authAdmin,
  })
  adminApproveContract.parse(approve.body)

  const withdrawalId2 = billingPaymentsService.createWithdrawRequest(10, BigInt(100)).id
  const reject = await request(`${baseUrl}/api/admin/withdraw/${withdrawalId2}/reject`, {
    method: "POST",
    headers: authAdmin,
  })
  adminRejectContract.parse(reject.body)

  const initOcean = await request(`${baseUrl}/api/admin/ocean/init`, { method: "POST", headers: authAdmin })
  oceanStateContract.parse(initOcean.body)

  const rolloverOcean = await request(`${baseUrl}/api/admin/ocean/rollover`, {
    method: "POST",
    headers: authAdmin,
    body: JSON.stringify({ randomBps: 1234 }),
  })
  oceanStateContract.parse(rolloverOcean.body)

  const manifestApi = await request(`${baseUrl}/api/integrations/ton/manifest`)
  tonManifestContract.parse(manifestApi.body)

  const manifestWellKnown = await request(`${baseUrl}/.well-known/tonconnect-manifest.json`)
  tonManifestContract.parse(manifestWellKnown.body)

  console.log("target-api-gap.test.ts: ok")
} finally {
  server.close()
}
