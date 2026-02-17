import { DOMAIN_CONSTANTS } from "../constants"
import type { OceanState } from "../types"

export class OceanService {
  initialize(now = new Date()): OceanState {
    return {
      id: 1,
      totalFishCount: 0,
      totalShares: BigInt(0),
      balanceUnits: BigInt(0),
      mode: "calm",
      feedingPercentageBps: DOMAIN_CONSTANTS.CALM_FEEDING_BPS,
      stormProbabilityBps: DOMAIN_CONSTANTS.INITIAL_STORM_PROBABILITY_BPS,
      cycleStartTime: now,
      nextModeChangeTime: new Date(now.getTime() + DOMAIN_CONSTANTS.DAY_DURATION_SECONDS * 1000),
      updatedAt: now,
    }
  }

  rollover(current: OceanState, randomBps: number, now = new Date()): OceanState {
    if (randomBps < 0 || randomBps >= DOMAIN_CONSTANTS.BASIS_POINTS_DIVISOR) {
      throw new Error("Random BPS out of range")
    }

    const isStorm = randomBps < current.stormProbabilityBps
    const feedingPercentageBps = isStorm ? DOMAIN_CONSTANTS.STORM_FEEDING_BPS : DOMAIN_CONSTANTS.CALM_FEEDING_BPS

    return {
      ...current,
      mode: isStorm ? "storm" : "calm",
      feedingPercentageBps,
      cycleStartTime: now,
      nextModeChangeTime: new Date(now.getTime() + DOMAIN_CONSTANTS.DAY_DURATION_SECONDS * 1000),
      updatedAt: now,
    }
  }
}
