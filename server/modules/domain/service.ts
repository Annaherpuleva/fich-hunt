import { FishService } from "../../domain/services/fishService"
import { OceanService } from "../../domain/services/oceanService"
import type { Fish } from "../../domain/types"
import { appState } from "../state"

export class DomainModuleService {
  private fishService = new FishService()
  private oceanService = new OceanService()

  getOceanState() {
    return appState.ocean
  }

  initOcean() {
    appState.ocean = this.oceanService.initialize(new Date())
    return appState.ocean
  }

  rollover(randomBps: number) {
    appState.ocean = this.oceanService.rollover(appState.ocean, randomBps, new Date())
    return appState.ocean
  }

  createFish(ownerUserId: number, name: string, depositUnits: bigint) {
    const { fish } = this.fishService.createFish(appState.ocean, { ownerUserId, name, depositUnits }, new Date())
    const id = appState.nextFishId()
    const persisted: Fish = { ...fish, id }
    appState.fish.set(id, persisted)
    return persisted
  }

  getFish(id: number): Fish {
    const fish = appState.fish.get(id)
    if (!fish) throw new Error("Fish not found")
    return fish
  }

  listFishByOwner(ownerUserId: number): Fish[] {
    return Array.from(appState.fish.values()).filter((fish) => fish.ownerUserId === ownerUserId)
  }

  saveFish(fish: Fish) {
    appState.fish.set(fish.id, fish)
  }

  feedFish(fishId: number, actorUserId: number, amountUnits: bigint, expectedVersion: number) {
    const fish = this.getFish(fishId)
    const { updatedFish } = this.fishService.feedFish(fish, appState.ocean, { fishId, actorUserId, amountUnits, expectedVersion }, new Date())
    this.saveFish(updatedFish)
    return updatedFish
  }

  placeMark(hunterFishId: number, preyFishId: number, actorUserId: number, expectedHunterVersion: number, expectedPreyVersion: number) {
    const hunter = this.getFish(hunterFishId)
    const prey = this.getFish(preyFishId)
    const result = this.fishService.placeHuntingMark(hunter, prey, { hunterFishId, preyFishId, actorUserId, expectedHunterVersion, expectedPreyVersion }, new Date())
    this.saveFish(result.hunter)
    this.saveFish(result.prey)
    return result
  }

  huntFish(hunterFishId: number, preyFishId: number, actorUserId: number, expectedHunterVersion: number, expectedPreyVersion: number) {
    const hunter = this.getFish(hunterFishId)
    const prey = this.getFish(preyFishId)
    const result = this.fishService.huntFish(hunter, prey, { hunterFishId, preyFishId, actorUserId, expectedHunterVersion, expectedPreyVersion }, new Date())
    this.saveFish(result.hunter)
    this.saveFish(result.prey)
    return result
  }

  resurrectFish(fishId: number, actorUserId: number, expectedVersion: number, depositUnits: bigint) {
    const fish = this.getFish(fishId)
    const result = this.fishService.resurrectFish(fish, appState.ocean, { fishId, actorUserId, expectedVersion, depositUnits }, new Date())
    this.saveFish(result.fish)
    return result.fish
  }

  exitFish(fishId: number, actorUserId: number, expectedVersion: number) {
    const fish = this.getFish(fishId)
    const result = this.fishService.exitFish(fish, appState.ocean, { fishId, actorUserId, expectedVersion }, new Date())
    this.saveFish(result.fish)
    return result
  }

  transferFish(fishId: number, actorUserId: number, expectedVersion: number, newOwnerUserId: number) {
    const fish = this.getFish(fishId)
    const result = this.fishService.transferFish(fish, { fishId, actorUserId, expectedVersion, newOwnerUserId })
    this.saveFish(result)
    return result
  }
}

export const domainModuleService = new DomainModuleService()
