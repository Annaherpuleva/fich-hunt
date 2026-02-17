import { useEffect, useState } from 'react';
import {
  FALLBACK_COMMISSION_BPS,
  FALLBACK_MIN_DEPOSIT_ATOMIC,
  FALLBACK_MIN_FEED_ATOMIC,
} from '../constants';
import { loadRuntimeConfig } from '../../config/runtimeConfig';
import { fetchCompat } from '../../shared/api/compat';

export type GameRulesConfig = {
  minDepositAtomic: number;
  minFeedAtomic: number;
  commissionBps: number;
};

const DEFAULTS: GameRulesConfig = {
  minDepositAtomic: FALLBACK_MIN_DEPOSIT_ATOMIC,
  minFeedAtomic: FALLBACK_MIN_FEED_ATOMIC,
  commissionBps: FALLBACK_COMMISSION_BPS,
};

let cached: GameRulesConfig | null = null;
let inFlight: Promise<GameRulesConfig> | null = null;

const toPositiveInt = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export async function fetchGameRulesConfig(): Promise<GameRulesConfig> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const cfg = await loadRuntimeConfig();
      const base = (cfg.API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetchCompat(base, '/api/v1/config');
      if (!res.ok) return DEFAULTS;

      const body = await res.json();
      const data = body?.data || body;
      cached = {
        minDepositAtomic: toPositiveInt(data?.minDepositAtomic, DEFAULTS.minDepositAtomic),
        minFeedAtomic: toPositiveInt(data?.minFeedAtomic, DEFAULTS.minFeedAtomic),
        commissionBps: toPositiveInt(data?.commissionBps, DEFAULTS.commissionBps),
      };
      return cached;
    } catch {
      return DEFAULTS;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function useGameRulesConfig(): GameRulesConfig {
  const [config, setConfig] = useState<GameRulesConfig>(cached || DEFAULTS);

  useEffect(() => {
    let mounted = true;
    fetchGameRulesConfig().then((next) => {
      if (mounted) setConfig(next);
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  return config;
}
