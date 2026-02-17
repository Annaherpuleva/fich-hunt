import { useEffect, useState } from 'react';
import { fetchOceanSafe } from '../../features/ocean/api/ocean.api';

const RESYNC_MS = 30_000;
const STALE_MS = 20_000;

let cachedNowSec: number | null = null;
let lastSyncMs = 0;
let syncPromise: Promise<void> | null = null;
let tickId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(v: number) => void>();

const notify = () => {
  if (cachedNowSec == null) return;
  listeners.forEach((fn) => fn(cachedNowSec as number));
};

const syncNow = async () => {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    try {
      const ocean: any = await fetchOceanSafe();
      const next = Number(ocean?.blockchainNowSec ?? 0);
      const base = Number.isFinite(next) && next > 0
        ? Math.floor(next)
        : Math.floor(Date.now() / 1000);
      cachedNowSec = base;
      lastSyncMs = Date.now();
      notify();
    } finally {
      syncPromise = null;
    }
  })();
  return syncPromise;
};

const ensureTicker = () => {
  if (tickId) return;
  tickId = setInterval(() => {
    if (cachedNowSec == null) return;
    cachedNowSec += 1;
    notify();
    if (Date.now() - lastSyncMs > RESYNC_MS) {
      syncNow().catch(() => {});
    }
  }, 1000);
};

export function useBlockchainNowSec() {
  const [nowSec, setNowSec] = useState<number>(() => {
    if (cachedNowSec != null) return cachedNowSec;
    return Math.floor(Date.now() / 1000);
  });

  useEffect(() => {
    const handler = (v: number) => setNowSec(v);
    listeners.add(handler);
    ensureTicker();
    if (cachedNowSec == null || Date.now() - lastSyncMs > STALE_MS) {
      syncNow().catch(() => {});
    }
    return () => {
      listeners.delete(handler);
      if (listeners.size === 0 && tickId) {
        clearInterval(tickId);
        tickId = null;
      }
    };
  }, []);

  return nowSec;
}
