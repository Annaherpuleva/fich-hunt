import assert from "node:assert/strict"
import { DOMAIN_CONSTANTS } from "../constants"
import { FishService } from "../services/fishService"
import { LedgerService } from "../services/ledgerService"
import { OceanService } from "../services/oceanService"

const oceanService = new OceanService()
const fishService = new FishService()
const ledgerService = new LedgerService()

const now = new Date("2026-01-01T00:00:00Z")
const ocean = oceanService.initialize(now)

assert.equal(ocean.feedingPercentageBps, DOMAIN_CONSTANTS.CALM_FEEDING_BPS)
assert.equal(ocean.totalFishCount, 0)
assert.throws(() => oceanService.rollover(ocean, 11_000, now), /Random BPS out of range/)

const { fish: createdFish } = fishService.createFish(
  ocean,
  {
    ownerUserId: 10,
    name: "Hunter Alpha",
    depositUnits: BigInt(20_000_000),
  },
  now,
)

assert.equal(createdFish.status, "alive")
assert.equal(createdFish.version, 1)
assert.ok(ocean.totalShares > BigInt(0))

const { updatedFish } = fishService.feedFish(
  createdFish,
  ocean,
  {
    fishId: createdFish.id,
    actorUserId: createdFish.ownerUserId,
    amountUnits: BigInt(10_000_000),
    expectedVersion: 1,
  },
  new Date("2026-01-01T01:00:00Z"),
)

assert.equal(updatedFish.version, 2)
assert.ok(updatedFish.share > createdFish.share)

assert.throws(
  () =>
    fishService.feedFish(updatedFish, ocean, {
      fishId: updatedFish.id,
      actorUserId: updatedFish.ownerUserId,
      amountUnits: BigInt(10_000_000),
      expectedVersion: 1,
    }),
  /Optimistic lock conflict/,
)

const { fish: preyFish } = fishService.createFish(
  ocean,
  {
    ownerUserId: 20,
    name: "Prey Beta",
    depositUnits: BigInt(25_000_000),
  },
  new Date("2026-01-01T02:00:00Z"),
)

const marked = fishService.placeHuntingMark(
  updatedFish,
  preyFish,
  {
    hunterFishId: updatedFish.id,
    preyFishId: preyFish.id,
    actorUserId: updatedFish.ownerUserId,
    expectedHunterVersion: 2,
    expectedPreyVersion: 1,
  },
  new Date("2026-01-01T02:05:00Z"),
)

assert.throws(
  () =>
    fishService.huntFish(
      {
        ...marked.hunter,
        canHuntAfter: new Date("2026-01-01T03:00:00Z"),
      },
      marked.prey,
      {
        hunterFishId: marked.hunter.id,
        preyFishId: marked.prey.id,
        actorUserId: marked.hunter.ownerUserId,
        expectedHunterVersion: 3,
        expectedPreyVersion: 2,
      },
      new Date("2026-01-01T02:10:00Z"),
    ),
  /Hunter is on cooldown/,
)

const hunted = fishService.huntFish(
  marked.hunter,
  marked.prey,
  {
    hunterFishId: marked.hunter.id,
    preyFishId: marked.prey.id,
    actorUserId: marked.hunter.ownerUserId,
    expectedHunterVersion: 3,
    expectedPreyVersion: 2,
  },
  new Date("2026-01-01T02:10:00Z"),
)

assert.ok(hunted.stolenShare > BigInt(0))
assert.equal(hunted.hunter.version, 4)
assert.equal(hunted.prey.version, 3)
assert.equal(hunted.prey.isProtected, true)

const remark = fishService.placeHuntingMark(
  hunted.hunter,
  hunted.prey,
  {
    hunterFishId: hunted.hunter.id,
    preyFishId: hunted.prey.id,
    actorUserId: hunted.hunter.ownerUserId,
    expectedHunterVersion: hunted.hunter.version,
    expectedPreyVersion: hunted.prey.version,
  },
  new Date("2026-01-01T02:20:00Z"),
)

assert.throws(
  () =>
    fishService.huntFish(
      remark.hunter,
      remark.prey,
      {
        hunterFishId: remark.hunter.id,
        preyFishId: remark.prey.id,
        actorUserId: remark.hunter.ownerUserId,
        expectedHunterVersion: remark.hunter.version,
        expectedPreyVersion: remark.prey.version,
      },
      new Date("2026-01-01T02:21:00Z"),
    ),
  /Hunter is on cooldown/,
)

const transferred = fishService.transferFish(hunted.hunter, {
  fishId: hunted.hunter.id,
  actorUserId: hunted.hunter.ownerUserId,
  newOwnerUserId: 11,
  expectedVersion: 4,
})

assert.equal(transferred.ownerUserId, 11)
assert.equal(transferred.version, 5)

const exited = fishService.exitFish(
  transferred,
  ocean,
  {
    fishId: transferred.id,
    actorUserId: 11,
    expectedVersion: 5,
  },
  new Date("2026-01-01T03:00:00Z"),
)

assert.equal(exited.fish.status, "exited")
assert.ok(exited.payoutUnits > BigInt(0))

const resurrected = fishService.resurrectFish(
  exited.fish,
  ocean,
  {
    fishId: exited.fish.id,
    actorUserId: 11,
    depositUnits: BigInt(30_000_000),
    expectedVersion: 6,
  },
  new Date("2026-01-01T03:30:00Z"),
)

assert.equal(resurrected.fish.status, "alive")
assert.equal(resurrected.fish.version, 7)

let entries = ledgerService.appendEntry([], { userId: 10, delta: BigInt(5_000_000), reason: "deposit" })
entries = ledgerService.appendEntry(entries, { userId: 10, delta: -BigInt(1_000_000), reason: "feed" })
entries = ledgerService.appendEntry(entries, { userId: 20, delta: BigInt(2_000_000), reason: "deposit" })

assert.equal(ledgerService.getBalance(entries, 10), BigInt(4_000_000))
assert.equal(ledgerService.getBalance(entries, 20), BigInt(2_000_000))
assert.throws(() => ledgerService.ensureSufficientBalance(entries, 10, BigInt(10_000_000)), /Insufficient ledger balance/)

const rolled = oceanService.rollover(ocean, 100, new Date("2026-01-02T00:00:00Z"))
assert.equal(rolled.mode, "storm")
assert.equal(rolled.feedingPercentageBps, DOMAIN_CONSTANTS.STORM_FEEDING_BPS)

console.log("domain-services.test.ts passed")
