import { useCallback, useEffect, useState } from 'react';
import { getEvents } from '../../../shared/api/fishApi';
import { FishEvent } from './fish-events.types';
import { MIN_FEED_LAMPORTS } from '../../../core/constants';
import { useTimersConfig } from '../../../core/hooks/useTimersConfig';

export interface UseFishEventsOptions {
  limit?: number;
}

export function useFishEvents(fishId: number | null | undefined, options?: UseFishEventsOptions) {
  const { limit = 100 } = options || {};
  const { feedPeriodSec } = useTimersConfig();
  const [loading, setLoading] = useState<boolean>(true);
  const [events, setEvents] = useState<FishEvent[]>([]);
  const [feedTimesSec, setFeedTimesSec] = useState<number[]>([]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      if (!Number.isFinite(fishId ?? NaN)) {
        setEvents([]);
        setFeedTimesSec([]);
        return [];
      }

      const body: any = await getEvents(limit);
      const rawAll: FishEvent[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.items)
          ? body.items
          : Array.isArray(body?.data?.items)
            ? body.data.items
            : [];

      const rawItems = rawAll.filter((ev: any) => {
        const fishIds = Array.isArray(ev?.fishIds) ? ev.fishIds.map((x: any) => Number(x)) : [];
        const preyId = Number(ev?.prey?.id);
        const hunterId = Number(ev?.hunter?.id);
        const fishIdForAvatar = Number(ev?.fishIdForAvatar);
        const payloadFishId = Number(ev?.payloadDec?.fishId);
        return fishIds.includes(Number(fishId)) || preyId === Number(fishId) || hunterId === Number(fishId) || fishIdForAvatar === Number(fishId) || payloadFishId === Number(fishId);
      });

      const toSec = (v: any): number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const n = Number(v);
          if (Number.isFinite(n)) return n;
          const ms = Date.parse(v);
          if (Number.isFinite(ms)) return Math.floor(ms / 1000);
        }
        if (v instanceof Date) return Math.floor(v.getTime() / 1000);
        return 0;
      };

      const normalized = rawItems
        .filter((ev: any) => !ev.prey || ev.prey.id !== fishId)
        .map((ev: any) => ({ ...ev, blockTime: toSec(ev.blockTime || ev.createdAt) }));

      let lastFedAtSec: number | null = null;
      let lamportsValue = 0;
      let fillFeed = 0;
      let feedPercentBps = 500;

      const sortedAsc = [...normalized].sort((a: any, b: any) => Number(a.blockTime || 0) - Number(b.blockTime || 0)).map((ev: any) => {
        if (ev.eventType === 'OceanModeChanged') {
          feedPercentBps = Number(ev.newFeedingPercentage || feedPercentBps);
          return ev;
        }
        const tSec = Number(ev.blockTime || 0);
        if (ev.eventType === 'FishCreated' && lastFedAtSec == null) {
          lastFedAtSec = tSec;
          lamportsValue = Number(ev?.payloadDec?.deposit || 0);
        }
        if (ev.eventType === 'FishFed') {
          const remain = Math.max(0, feedPeriodSec - (tSec - (lastFedAtSec ?? tSec)));
          ev._remainBeforeSec = remain;
          lastFedAtSec = tSec;
          lamportsValue = Number(ev?.payloadDec?.newValue || lamportsValue);
          fillFeed = 0;
        }
        if (ev.eventType === 'FishHunted') {
          lastFedAtSec = tSec;
          const needToFeed = Math.max(Math.floor((lamportsValue * feedPercentBps) / 10_000), MIN_FEED_LAMPORTS);
          const received = Number(ev?.payloadDec?.receivedFromHuntValue || 0);
          lamportsValue += received;
          fillFeed += received;
          if (fillFeed >= needToFeed) {
            fillFeed = 0;
            ev._remainBeforeSec = Math.max(0, feedPeriodSec - (tSec - (lastFedAtSec ?? tSec)));
          }
        }
        return ev;
      }).filter((ev: any) => ev.eventType !== 'OceanModeChanged');

      const feedTimes = sortedAsc
        .filter((ev: any) => String(ev.eventType || '') === 'FishFed')
        .map((ev: any) => Number(ev.blockTime || 0))
        .filter((n: number) => Number.isFinite(n) && n > 0);

      const sortedDesc = sortedAsc.sort((a: any, b: any) => Number(b.blockTime || 0) - Number(a.blockTime || 0));
      setEvents(sortedDesc as FishEvent[]);
      setFeedTimesSec(feedTimes);
      return sortedDesc as FishEvent[];
    } catch {
      setEvents([]);
      setFeedTimesSec([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fishId, limit, feedPeriodSec]);

  useEffect(() => {
    reload();
  }, [fishId, limit]);

  return { loading, events, feedTimesSec, reload };
}
