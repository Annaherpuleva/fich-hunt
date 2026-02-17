import { useEffect, useState } from 'react';
import { loadRuntimeConfig } from '../../../config/runtimeConfig';
import { fetchCompat } from '../../../shared/api/compat';
import { formatGameAmount } from '../../../core/utils/format';
export type TopFishItem = {
  rank: number;
  fishId: number;
  fishName?: string | null;
  owner: string;
  share: string; // decimal string
  avatarUrl?: string; // resolved absolute url
  socials?: { x?: string; telegram?: string; discord?: string };
  secondsUntilHunger: number | null;
  valueLamports?: number;
  valueText?: string; // formatted SOL
};

export type LeaderboardPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function useTopLeaderboard(page: number, limit: number, search?: string) {
  const [items, setItems] = useState<TopFishItem[]>([]);
  const [pagination, setPagination] = useState<LeaderboardPagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const searchTrimmed = search?.trim();
        if (searchTrimmed) params.set('search', searchTrimmed);
        const r = await fetchCompat(base, `/api/v1/leaderboards/top-fish?${params}`);
        if (!r.ok) throw new Error('Failed to load leaderboard');
        const j = await r.json();
        const raw = Array.isArray(j.data.items) ? j.data.items : [];
        
        const mapped: TopFishItem[] = raw.map((it: any, idx: number) => {
          const avatarUrl = it.avatarFile
            ? `${base}/static/avatars/thumbs/${String(it.avatarFile).replace(/\.[^.]+$/, '.webp')}`
            : '/img/fish-image-7a550f.jpg';
          const shareStr = String(it.shareStr ?? it.share ?? '0');
          const totalLamports = Number(String(it.valueLamports ?? it.totalLamports ?? 0));
          const valueText = formatGameAmount(totalLamports, 2);
          const lastFedAtSec = (() => {
            if (!it.lastFedAt) return undefined;
            const ts = Date.parse(it.lastFedAt);
            return Number.isFinite(ts) ? Math.floor(ts / 1000) : undefined;
          })();
          return {
            rank: Number(it.rank) || idx + 1,
            fishId: Number(it.fishId) || 0,
            fishName: it.fishName || null,
            owner: String(it.owner || ''),
            share: shareStr,
            socials: it.socials || {},
            avatarUrl,
            valueText,
            valueLamports: totalLamports,
            secondsUntilHunger: it.secondsUntilHunger ?? null,
            lastFedAtSec,
          };
        });
        const pag = j?.data.pagination;
        if (!cancelled) {
          setItems(mapped);
          setPagination(
            pag && typeof pag.page === 'number' && typeof pag.limit === 'number'
              ? {
                page: pag.page,
                limit: pag.limit,
                total: Number(pag.total ?? 0),
                totalPages: Math.max(1, Number(pag.totalPages ?? 1)),
              }
              : { page, limit, total: mapped.length, totalPages: 1 }
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Unknown error');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, limit, search]);

  return { items, pagination, loading, error } as const;
}
