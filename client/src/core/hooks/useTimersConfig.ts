import { useEffect, useState } from 'react';
import { loadRuntimeConfig } from '../../config/runtimeConfig';
import { fetchCompat } from '../../shared/api/compat';
import {
  DEFAULT_FEED_PERIOD,
  DEFAULT_HIGH_RATE_THRESHOLD_SECONDS,
  DEFAULT_MARK_EXCLUSIVITY_SECONDS,
  DEFAULT_MARK_PLACEMENT_WINDOW_SECONDS,
} from '../../config/timers';

export type TimersConfig = {
  feedPeriodSec: number;
  markPlacementWindowSec: number;
  markExclusivitySec: number;
  highRateThresholdSec: number;
};

const DEFAULTS: TimersConfig = {
  feedPeriodSec: DEFAULT_FEED_PERIOD,
  markPlacementWindowSec: DEFAULT_MARK_PLACEMENT_WINDOW_SECONDS,
  markExclusivitySec: DEFAULT_MARK_EXCLUSIVITY_SECONDS,
  highRateThresholdSec: DEFAULT_HIGH_RATE_THRESHOLD_SECONDS,
};

let cached: TimersConfig | null = null;
let inFlight: Promise<TimersConfig> | null = null;

const toSec = (v: any, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export async function fetchTimersConfig(): Promise<TimersConfig> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const cfg = await loadRuntimeConfig();
      const base = (cfg.API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetchCompat(base, '/api/v1/config/timers');
      if (!res.ok) {
        cached = DEFAULTS;
        return cached;
      }
      const body = await res.json();
      const data = body?.data || body;
      cached = {
        feedPeriodSec: toSec(data?.feedPeriodSec, DEFAULTS.feedPeriodSec),
        markPlacementWindowSec: toSec(
          data?.markPlacementWindowSec,
          DEFAULTS.markPlacementWindowSec
        ),
        markExclusivitySec: toSec(
          data?.markExclusivitySec,
          DEFAULTS.markExclusivitySec
        ),
        highRateThresholdSec: toSec(
          data?.highRateThresholdSec,
          DEFAULTS.highRateThresholdSec
        ),
      };
      return cached;
    } catch {
      cached = DEFAULTS;
      return cached;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export function useTimersConfig(): TimersConfig {
  const [config, setConfig] = useState<TimersConfig>(() => cached || DEFAULTS);

  useEffect(() => {
    let mounted = true;
    fetchTimersConfig()
      .then((data) => {
        if (mounted) setConfig(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return config;
}
