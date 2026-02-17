import { FALLBACK_MIN_DEPOSIT_ATOMIC } from '../../../core/constants';

type MarkCostParams = {
  valueLamports?: number | null;
  lastFedAtSec?: number | null;
  chainNowSec: number;
  feedPeriodSec: number;
  markPlacementWindowSec: number;
  highRateThresholdSec: number;
  minDepositAtomic?: number;
};

export const getMarkCostLamports = ({
  valueLamports,
  lastFedAtSec,
  chainNowSec,
  feedPeriodSec,
  markPlacementWindowSec,
  highRateThresholdSec,
  minDepositAtomic = FALLBACK_MIN_DEPOSIT_ATOMIC,
}: MarkCostParams): number => {
  const value = Math.max(0, Math.floor(Number(valueLamports || 0)));
  const lastFed = Number(lastFedAtSec || 0);
  if (!value || !lastFed) return 0;

  const timeUntilVictim = (lastFed + feedPeriodSec) - chainNowSec;
  if (timeUntilVictim <= 0 || timeUntilVictim > markPlacementWindowSec) {
    return 0;
  }

  const bps = timeUntilVictim <= highRateThresholdSec ? 1000 : 500;
  const raw = Math.floor((value * bps) / 10_000);
  return Math.max(raw, minDepositAtomic);
};
