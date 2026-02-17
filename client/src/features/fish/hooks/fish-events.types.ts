type FishCreatedPayload = {
    fishId: number;
    owner: number;
    share: number;
    deposit: number;
    adminFee: number;
    poolFee: number;
    name: number;
  };
  
type FishResurrectedPayload = {
    oldFishId: number;
    newFishId: number;
    owner: number;
    name: number;
    share: number;
    deposit: number;
    adminFee: number;
    poolFee: number;
  };
  
type FishExitedPayload = {
    fishId: number;
    owner: number;
    exitedShare: number;
    payout: number;
    adminFee: number;
    poolFee: number;
    toPlayer: number;
    newBalance: number;
  };
  
type FishFedPayload = {
    fishId: number;
    owner: number;
    addedShare: number;
    baseCost: number;
    adminFee: number;
    poolFee: number;
    newShare: number;
    newValue: number;
  };
  
type FishHuntedPayload = {
    hunterId: number;
    preyId: number;
    hunterOwner: number;
    preyOwner: number;
    biteShare: number;
    toHunter: number;
    toPool: number;
    toAdmin: number;
    enhanced: number;
    hunterNewShare: number;
    preyNewShare: number;
    receivedFromHuntValue: number;
    toAdminValue: number;
    toPoolValue: number;
    bitePercent: number;
    biteFeePercent: number;
    biteFee: number;
  };

  type HuntingMarkPlacedPayload = {
    markId: number
    hunterId: number
    preyId: number
    hunterOwner: number
    cost: number
    expiresAt: number
    timeUntilHungry: number
    costPercent: number
};

  interface BaseFishEvent {
    id: string;
    fishIds?: string[];
    blockTime: number;
    payload?: Record<string, unknown>;
    _remainBeforeSec?: number;
    [key: string]: any;
  }

export enum FishEventType {
    FishCreated = 'FishCreated',
    FishResurrected = 'FishResurrected',
    FishExited = 'FishExited',
    FishFed = 'FishFed',
    FishHunted = 'FishHunted',
    HuntingMarkPlaced = 'HuntingMarkPlaced',
  }
  
export type FishEvent =
  | {
      eventType: FishEventType.FishCreated;
      payloadDec: FishCreatedPayload;
    } & BaseFishEvent
  | {
      eventType: FishEventType.FishResurrected;
      payloadDec: FishResurrectedPayload;
    } & BaseFishEvent
  | {
      eventType: FishEventType.FishExited;
      payloadDec: FishExitedPayload;
    } & BaseFishEvent
  | {
      eventType: FishEventType.FishFed;
      payloadDec: FishFedPayload;
    } & BaseFishEvent
  | {
      eventType: FishEventType.FishHunted;
      payloadDec: FishHuntedPayload;
    } & BaseFishEvent
    | {
      eventType: FishEventType.HuntingMarkPlaced;
      payloadDec: HuntingMarkPlacedPayload;
    } & BaseFishEvent 
    | { eventType: "OceanModeChanged"; newFeedingPercentage: number } & BaseFishEvent;
