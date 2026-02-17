import { FishService } from "../../domain/services/fishService"
import { OceanService } from "../../domain/services/oceanService"
import type { Fish } from "../../domain/types"
import { appState } from "../state"
import { gameEventsService } from "../events/service"

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
    gameEventsService.record({
      eventType: "fish_created",
      fishId: persisted.id,
      actorUserId: ownerUserId,
      payload: { name, depositUnits: depositUnits.toString() },
    })
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

  searchPrey(filters: { hunterUserId?: number; victimWalletAddress?: string; victimName?: string }): Fish[] {
    const walletFilter = filters.victimWalletAddress?.trim().toLowerCase()
    const nameFilter = filters.victimName?.trim().toLowerCase()

    return Array.from(appState.fish.values()).filter((fish) => {
      if (fish.status !== "alive") return false
      if (filters.hunterUserId && fish.ownerUserId === filters.hunterUserId) return false

      if (walletFilter) {
        const ownerWallet = appState.userWalletAddressByUserId.get(fish.ownerUserId)
        if (!ownerWallet || ownerWallet.toLowerCase() !== walletFilter) return false
      }

      if (nameFilter && !fish.name.toLowerCase().includes(nameFilter)) return false

      return true
    })
  }

  saveFish(fish: Fish) {
    appState.fish.set(fish.id, fish)
  }

  feedFish(fishId: number, actorUserId: number, amountUnits: bigint, expectedVersion: number) {
    const fish = this.getFish(fishId)
    const { updatedFish } = this.fishService.feedFish(fish, appState.ocean, { fishId, actorUserId, amountUnits, expectedVersion }, new Date())
    this.saveFish(updatedFish)
    gameEventsService.record({
      eventType: "fish_fed",
      fishId,
      actorUserId,
      payload: { amountUnits: amountUnits.toString() },
    })
    return updatedFish
  }

  placeMark(hunterFishId: number, preyFishId: number, actorUserId: number, expectedHunterVersion: number, expectedPreyVersion: number) {
    const hunter = this.getFish(hunterFishId)
    const prey = this.getFish(preyFishId)
    const result = this.fishService.placeHuntingMark(hunter, prey, { hunterFishId, preyFishId, actorUserId, expectedHunterVersion, expectedPreyVersion }, new Date())
    this.saveFish(result.hunter)
    this.saveFish(result.prey)
    gameEventsService.record({
      eventType: "hunting_mark_placed",
      fishId: hunterFishId,
      actorUserId,
      payload: { preyFishId },
    })
    return result
  }

  huntFish(hunterFishId: number, preyFishId: number, actorUserId: number, expectedHunterVersion: number, expectedPreyVersion: number) {
    const hunter = this.getFish(hunterFishId)
    const prey = this.getFish(preyFishId)
    const result = this.fishService.huntFish(hunter, prey, { hunterFishId, preyFishId, actorUserId, expectedHunterVersion, expectedPreyVersion }, new Date())
    this.saveFish(result.hunter)
    this.saveFish(result.prey)
    gameEventsService.record({
      eventType: "fish_hunted",
      fishId: hunterFishId,
      actorUserId,
      payload: { preyFishId, stolenShare: result.stolenShare.toString() },
    })
    return result
  }

  resurrectFish(fishId: number, actorUserId: number, expectedVersion: number, depositUnits: bigint) {
    const fish = this.getFish(fishId)
    const result = this.fishService.resurrectFish(fish, appState.ocean, { fishId, actorUserId, expectedVersion, depositUnits }, new Date())
    this.saveFish(result.fish)
    gameEventsService.record({
      eventType: "fish_resurrected",
      fishId,
      actorUserId,
      payload: { depositUnits: depositUnits.toString() },
    })
    return result.fish
  }

  exitFish(fishId: number, actorUserId: number, expectedVersion: number) {
    const fish = this.getFish(fishId)
    const result = this.fishService.exitFish(fish, appState.ocean, { fishId, actorUserId, expectedVersion }, new Date())
    this.saveFish(result.fish)
    gameEventsService.record({
      eventType: "fish_exited",
      fishId,
      actorUserId,
      payload: { payoutUnits: result.payoutUnits.toString(), feeUnits: result.feeUnits.toString() },
    })
    return result
  }

  transferFish(fishId: number, actorUserId: number, expectedVersion: number, newOwnerUserId: number) {
    const fish = this.getFish(fishId)
    const result = this.fishService.transferFish(fish, { fishId, actorUserId, expectedVersion, newOwnerUserId })
    this.saveFish(result)
    gameEventsService.record({
      eventType: "fish_transferred",
      fishId,
      actorUserId,
      payload: { newOwnerUserId },
    })
    return result
  }
}

export const domainModuleService = new DomainModuleService()
