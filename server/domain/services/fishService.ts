import { DOMAIN_CONSTANTS } from "../constants"
import type {
  CreateFishInput,
  ExitFishInput,
  FeedFishInput,
  Fish,
  HuntFishInput,
  OceanState,
  PlaceMarkInput,
  ResurrectFishInput,
  TransferFishInput,
} from "../types"

function assertAlive(fish: Fish, label: string): void {
  if (fish.status !== "alive") {
    throw new Error(`${label} fish is not alive`)
  }
}

function assertVersion(fish: Fish, expectedVersion: number): void {
  if (fish.version !== expectedVersion) {
    throw new Error("Optimistic lock conflict")
  }
}


function assertOwner(fish: Fish, actorUserId: number, action: string): void {
  if (fish.ownerUserId !== actorUserId) {
    throw new Error(`Only fish owner can ${action}`)
  }
}

function assertNotSameOwner(currentOwnerUserId: number, newOwnerUserId: number): void {
  if (currentOwnerUserId === newOwnerUserId) {
    throw new Error("Fish already belongs to target owner")
  }
}

export class FishService {
  createFish(ocean: OceanState, input: CreateFishInput, now = new Date()): { fish: Fish; creationFeeUnits: bigint } {
    if (input.depositUnits < DOMAIN_CONSTANTS.MIN_DEPOSIT_UNITS) {
      throw new Error("Deposit is lower than minimum")
    }

    const creationFeeUnits = input.depositUnits / DOMAIN_CONSTANTS.CREATION_FEE_DIVISOR
    const share = input.depositUnits - creationFeeUnits

    const fish: Fish = {
      id: 0,
      ownerUserId: input.ownerUserId,
      name: input.name,
      share,
      createdAt: now,
      lastFedAt: null,
      lastHuntAt: null,
      canHuntAfter: null,
      isProtected: false,
      protectionEndsAt: null,
      markedByFishId: null,
      markExpiresAt: null,
      status: "alive",
      version: 1,
    }

    ocean.totalFishCount += 1
    ocean.totalShares += share
    ocean.balanceUnits += share
    ocean.updatedAt = now

    return { fish, creationFeeUnits }
  }

  feedFish(fish: Fish, ocean: OceanState, input: FeedFishInput, now = new Date()): { updatedFish: Fish; commissionUnits: bigint } {
    if (input.amountUnits < DOMAIN_CONSTANTS.MIN_FEED_UNITS) {
      throw new Error("Feed amount is lower than minimum")
    }
    assertAlive(fish, "Target")
    assertOwner(fish, input.actorUserId, "feed")
    assertVersion(fish, input.expectedVersion)

    const commissionUnits = input.amountUnits / DOMAIN_CONSTANTS.FEED_COMMISSION_DIVISOR
    const netFeed = input.amountUnits - commissionUnits
    const reward = (netFeed * BigInt(ocean.feedingPercentageBps)) / BigInt(DOMAIN_CONSTANTS.BASIS_POINTS_DIVISOR)

    const updatedFish: Fish = {
      ...fish,
      share: fish.share + reward,
      lastFedAt: now,
      version: fish.version + 1,
    }

    ocean.totalShares += reward
    ocean.balanceUnits += reward
    ocean.updatedAt = now

    return { updatedFish, commissionUnits }
  }

  placeHuntingMark(hunter: Fish, prey: Fish, input: PlaceMarkInput, now = new Date()): { hunter: Fish; prey: Fish } {
    assertAlive(hunter, "Hunter")
    assertAlive(prey, "Prey")
    assertVersion(hunter, input.expectedHunterVersion)
    assertVersion(prey, input.expectedPreyVersion)

    assertOwner(hunter, input.actorUserId, "place mark")

    const markExpiresAt = new Date(now.getTime() + DOMAIN_CONSTANTS.MARK_EXCLUSIVITY_SECONDS * 1000)

    return {
      hunter: {
        ...hunter,
        version: hunter.version + 1,
      },
      prey: {
        ...prey,
        markedByFishId: hunter.id,
        markExpiresAt,
        version: prey.version + 1,
      },
    }
  }

  huntFish(hunter: Fish, prey: Fish, input: HuntFishInput, now = new Date()): { hunter: Fish; prey: Fish; stolenShare: bigint } {
    assertAlive(hunter, "Hunter")
    assertAlive(prey, "Prey")
    assertVersion(hunter, input.expectedHunterVersion)
    assertVersion(prey, input.expectedPreyVersion)

    assertOwner(hunter, input.actorUserId, "hunt")

    if (hunter.canHuntAfter && hunter.canHuntAfter > now) {
      throw new Error("Hunter is on cooldown")
    }

    if (prey.isProtected && prey.protectionEndsAt && prey.protectionEndsAt > now) {
      throw new Error("Prey is protected")
    }

    if (prey.markedByFishId === null || prey.markedByFishId !== hunter.id || !prey.markExpiresAt || prey.markExpiresAt < now) {
      throw new Error("Prey is not marked by hunter")
    }

    const stolenShare = prey.share / BigInt(10)
    if (stolenShare <= BigInt(0)) {
      throw new Error("Prey has no share to hunt")
    }

    return {
      hunter: {
        ...hunter,
        share: hunter.share + stolenShare,
        lastHuntAt: now,
        canHuntAfter: new Date(now.getTime() + DOMAIN_CONSTANTS.MARK_EXCLUSIVITY_SECONDS * 1000),
        version: hunter.version + 1,
      },
      prey: {
        ...prey,
        share: prey.share - stolenShare,
        isProtected: true,
        protectionEndsAt: new Date(now.getTime() + DOMAIN_CONSTANTS.MARK_EXCLUSIVITY_SECONDS * 1000),
        markedByFishId: null,
        markExpiresAt: null,
        version: prey.version + 1,
      },
      stolenShare,
    }
  }


  transferFish(fish: Fish, input: TransferFishInput): Fish {
    assertAlive(fish, "Target")
    assertVersion(fish, input.expectedVersion)
    assertOwner(fish, input.actorUserId, "transfer")
    assertNotSameOwner(fish.ownerUserId, input.newOwnerUserId)

    return {
      ...fish,
      ownerUserId: input.newOwnerUserId,
      markedByFishId: null,
      markExpiresAt: null,
      version: fish.version + 1,
    }
  }

  exitFish(fish: Fish, ocean: OceanState, input: ExitFishInput, now = new Date()): { fish: Fish; payoutUnits: bigint; feeUnits: bigint } {
    assertAlive(fish, "Target")
    assertVersion(fish, input.expectedVersion)
    assertOwner(fish, input.actorUserId, "exit")

    const feeUnits = (fish.share * DOMAIN_CONSTANTS.EXIT_FEE_BPS) / BigInt(DOMAIN_CONSTANTS.BASIS_POINTS_DIVISOR)
    const payoutUnits = fish.share - feeUnits

    ocean.totalFishCount = Math.max(0, ocean.totalFishCount - 1)
    ocean.totalShares -= fish.share
    ocean.balanceUnits -= payoutUnits
    ocean.updatedAt = now

    return {
      fish: {
        ...fish,
        share: BigInt(0),
        status: "exited",
        markedByFishId: null,
        markExpiresAt: null,
        version: fish.version + 1,
      },
      payoutUnits,
      feeUnits,
    }
  }

  resurrectFish(fish: Fish, ocean: OceanState, input: ResurrectFishInput, now = new Date()): { fish: Fish; creationFeeUnits: bigint } {
    if (fish.status !== "dead" && fish.status !== "exited") {
      throw new Error("Only dead or exited fish can be resurrected")
    }

    assertVersion(fish, input.expectedVersion)
    assertOwner(fish, input.actorUserId, "resurrect")

    if (input.depositUnits < DOMAIN_CONSTANTS.MIN_DEPOSIT_UNITS) {
      throw new Error("Deposit is lower than minimum")
    }

    const creationFeeUnits = input.depositUnits / DOMAIN_CONSTANTS.CREATION_FEE_DIVISOR
    const restoredShare = input.depositUnits - creationFeeUnits

    ocean.totalFishCount += 1
    ocean.totalShares += restoredShare
    ocean.balanceUnits += restoredShare
    ocean.updatedAt = now

    return {
      fish: {
        ...fish,
        share: restoredShare,
        status: "alive",
        createdAt: now,
        lastFedAt: null,
        lastHuntAt: null,
        canHuntAfter: now,
        isProtected: false,
        protectionEndsAt: null,
        markedByFishId: null,
        markExpiresAt: null,
        version: fish.version + 1,
      },
      creationFeeUnits,
    }
  }

}
