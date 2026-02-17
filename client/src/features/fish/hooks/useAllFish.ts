import { useCallback, useEffect, useRef, useState } from 'react';
import { FishEntity } from '../../../entities/fish/types';
import { getServiceId } from '../../../config/runtimeGame';
import { deriveFishPda } from '../api/pda';
import { PublicKey } from '@/shims/solanaWeb3';
import { getPrey } from '../../../shared/api/fishApi';

const FALLBACK_AVATAR = '/img/fish-image-7a550f.jpg';

export function useAllFish(hunterId?: number) {
  const [heavierCount, setHeavierCount] = useState(0);
  const [items, setItems] = useState<FishEntity[]>([]);
  const [valueById, setValueById] = useState<Record<number, number>>({});
  const [pdaById, setPdaById] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarById, setAvatarById] = useState<Record<number, string>>({});
  const lastKeyRef = useRef<string | null>(null);

  const reload = useCallback(async (clearData: boolean = true) => {
    if (clearData && !Number.isFinite(hunterId)) {
      setItems([]);
      setValueById({});
      setAvatarById({});
      setPdaById({});
      return;
    }

    setLoading(true);
    try {
      const j: any = await getPrey(true);
      const arr = Array.isArray(j?.data?.items)
        ? j.data.items
        : Array.isArray(j?.items)
          ? j.items
          : Array.isArray(j?.data)
            ? j.data
            : [];

      if (typeof j?.data?.heavierCount === 'number') {
        setHeavierCount(j.data.heavierCount);
      }

      const list: FishEntity[] = arr.map((f: any) => ({
        id: Number(f.fishId ?? f.id),
        name: f.fishName ?? f.name ?? null,
        owner: f.owner,
        share: Number(f.shareStr ?? f.share ?? 0),
        lastFedAt: f.lastFedAt ? Math.floor(new Date(f.lastFedAt).getTime() / 1000) : null,
        canHuntAfter: f.canHuntAfter ? Math.floor(new Date(f.canHuntAfter).getTime() / 1000) : null,
        alive: f.alive ?? true,
        valueLamports: Number(f.valueLamports || 0),
        markExpiresAt: f.markExpiresAt ? Math.floor(new Date(f.markExpiresAt).getTime() / 1000) : null,
        markPlacedAt: f.markPlacedAt ? Math.floor(new Date(f.markPlacedAt).getTime() / 1000) : null,
        markedByHunterId: f.markedByHunterId,
        secondsUntilHunger: Number(f.secondsUntilHunger || 0),
        avatarFile: f.avatarFile || null,
      }));

      setItems(list);
      const valueMap: Record<number, number> = {};
      const avatarMap: Record<number, string> = {};

      list.forEach((f, idx) => {
        valueMap[f.id] = Number(f.valueLamports || 0);
        const file = arr[idx]?.avatarFile as string | undefined;
        avatarMap[f.id] = file
          ? `${window.location.origin}/static/avatars/thumbs/${String(file).replace(/\.[^.]+$/, '.webp')}`
          : FALLBACK_AVATAR;
      });

      const pdaMap: Record<number, string> = {};
      const programId = await getServiceId();
      for (const f of list) {
        try {
          if (f.owner) pdaMap[f.id] = deriveFishPda(programId, new PublicKey(f.owner), f.id).toBase58();
        } catch {}
      }

      setPdaById(pdaMap);
      setValueById(valueMap);
      setAvatarById(avatarMap);
      return list;
    } catch {
      setItems([]);
      setValueById({});
      setAvatarById({});
      setPdaById({});
    } finally {
      setLoading(false);
    }
  }, [hunterId]);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(hunterId)) {
      lastKeyRef.current = null;
      setItems([]);
      setValueById({});
      setAvatarById({});
      setPdaById({});
      setLoading(false);
      return () => { cancelled = true; };
    }
    const key = `hunter:${hunterId}`;
    if (lastKeyRef.current === key) return () => { cancelled = true; };
    lastKeyRef.current = key;
    (async () => { if (!cancelled) await reload(); })();
    return () => { cancelled = true; };
  }, [hunterId, reload]);

  return { loading, items, valueById, pdaById, reload, avatarById, heavierCount };
}
