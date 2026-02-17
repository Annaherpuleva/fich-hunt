import { buildEventComment } from "./build-event-comment"
import { appState, type StoredGameEvent } from "../state"

export type RecordGameEventInput = {
  eventType: string
  fishId?: number
  actorUserId?: number
  payload?: Record<string, unknown>
  txHash?: string
}

class GameEventsService {
  record(input: RecordGameEventInput): StoredGameEvent {
    const event: StoredGameEvent = {
      id: appState.nextGameEventId(),
      eventType: input.eventType,
      fishId: input.fishId,
      actorUserId: input.actorUserId,
      payload: input.payload,
      comment: buildEventComment({
        eventType: input.eventType,
        fishId: input.fishId,
        actorUserId: input.actorUserId,
        txHash: input.txHash,
      }),
      createdAt: new Date(),
    }

    appState.gameEvents.unshift(event)
    return event
  }
}

export const gameEventsService = new GameEventsService()
