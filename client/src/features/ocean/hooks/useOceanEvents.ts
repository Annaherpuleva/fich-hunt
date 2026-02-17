import { useEffect, useState } from 'react';
import { getEvents } from '../../../shared/api/fishApi';
import { useOcean } from '../OceanContext';

export type EnrichedOceanEvent = {
  id: string;
  eventType: string;
  title: string;
  eventCode?: string;
  avatarUrl?: string;
  yourShareLamports?: number;
  fishIdForAvatar?: number;
  hunter?: { id: number; name?: string; avatarUrl?: string };
  prey?: { id: number; name?: string; avatarUrl?: string };
};

export function useOceanEvents(_wallet?: string | null, limit: number = 20, _connected?: boolean, _connecting?: boolean) {
  const { selectedOcean } = useOcean();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EnrichedOceanEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response: any = await getEvents(limit);
        const data: any[] = Array.isArray(response?.data?.items)
          ? response.data.items
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [];
        if (!cancelled) {
          setItems(data.map((ev, i) => ({ ...ev, id: ev.id || String(i), eventType: String(ev.eventType || ev.eventCode || ev.op || 'Unknown'), title: String(ev.title || `${ev.owner || '-'} · ${ev.eventCode || ev.op || 'event'}`) })));
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedOcean, limit]);

  return { loading, items };
}
