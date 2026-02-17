import { useCallback, useEffect, useState, useRef } from 'react';
import { useWallet } from '../../../wallet/tonWallet';
import { PublicKey } from '@/shims/solanaWeb3';
import { deriveFishPda } from '../api/pda';
import { useBlockchainNowSec } from '../../../core/hooks/useBlockchainNowSec';
import { loadRuntimeConfig } from '../../../config/runtimeConfig';
import type { FishEntity } from '../../../entities/fish/types';
import { getMyFish } from '../../../shared/api/fishApi';
import { fetchOceanSafe } from '../../ocean/api/ocean.api';
import { useGameRulesConfig } from '../../../core/hooks/useGameRulesConfig';

const FALLBACK_AVATAR = '/img/fish-image-7a550f.jpg';
const FEED_PERCENT_BPS_DEFAULT = 1000; // 10% fallback

export function useMyFish() {
  const { publicKey } = useWallet();
  const chainNowSec = useBlockchainNowSec();
  const { minFeedAtomic } = useGameRulesConfig();
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<FishEntity[]>([]);
  const [valueById, setValueById] = useState<Record<number, number>>({});
  const [feedCostById, setFeedCostById] = useState<Record<number, number>>({}); // lamports to pay including fee
  const [feedBaseById, setFeedBaseById] = useState<Record<number, number>>({}); // lamports without fee
  const [feedPercentBps, setFeedPercentBps] = useState<number>(FEED_PERCENT_BPS_DEFAULT);
  const [pdaById, setPdaById] = useState<Record<number, string>>({});
  const [avatarById, setAvatarById] = useState<Record<number, string>>({});
  const [earnings24hById, setEarnings24hById] = useState<Record<number, number>>({});
  const lastWalletRef = useRef<string | null>(null);

  const buildAvatarUrl = (base: string, file?: string | null) => {
    if (!file) return FALLBACK_AVATAR;
    return `${base}/static/avatars/thumbs/${String(file).replace(/\.[^.]+$/, '.webp')}`;
  };

  const reload = useCallback(async () => {
    if (!publicKey) {
      setItems([]);
      setValueById({});
      setFeedCostById({});
      setFeedBaseById({});
      setPdaById({});
      setAvatarById({});
      setEarnings24hById({});
      return;
    }
    setLoading(true);
    try {
      const cfg = await loadRuntimeConfig();
      const { API_BASE_URL, PROGRAM_ID } = cfg;
      if (!PROGRAM_ID) throw new Error('PROGRAM_ID missing');
      const programId = new PublicKey(PROGRAM_ID);
      const base = (API_BASE_URL || '').replace(/\/$/, '');
      const makeUrl = (path: string) => (base ? `${base}${path}` : path);

      // Получаем реальный процент кормления из океана
      let currentFeedPercentBps = FEED_PERCENT_BPS_DEFAULT;
      try {
        const ocean = await fetchOceanSafe();
        if (ocean?.feedingPercentage != null && Number.isFinite(ocean.feedingPercentage)) {
          currentFeedPercentBps = Number(ocean.feedingPercentage);
        }
      } catch (e) {
        // Если не удалось получить, используем дефолт
      }
      setFeedPercentBps(currentFeedPercentBps);

      const data: any = await getMyFish(publicKey.toBase58());
      const itemsAcc: any[] = Array.isArray(data?.data?.items)
        ? data.data.items
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
      // скрытые рыбы (hidden: true) не показываем в списке
      const arr = itemsAcc.filter((f) => !f?.hidden);

      const toSec = (v: any): number | undefined => {
        if (!v) return undefined;
        if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
        const ms = Date.parse(String(v));
        if (Number.isFinite(ms)) return Math.floor(ms / 1000);
        return undefined;
      };
      const mapped: FishEntity[] = arr.map((f) => ({
        id: Number(f.fishId),
        name: f.fishName || null,
        owner: f.owner,
        share: Number(f.shareStr || 0),
        poolLamports: Number(f.poolLamports || 0),
        huntLamports: Number(f.huntLamports || 0),
        valueLamports: Number(f.valueLamports || 0),
        protectionEndsAt: f.protectionEndsAt ? Math.floor(new Date(f.protectionEndsAt).getTime() / 1000) : undefined,
        canHuntAfter: toSec(f.canHuntAfter),
        lastFedAt: toSec(f.lastFedAt),
        alive: Boolean(f.alive),
        avatarFile: f.avatarFile || null,
        receivedFromHuntValue: Number(f.receivedFromHuntValue || 0),
        secondsUntilHunger: Number(f.secondsUntilHunger || 0),
        secondsUntilHunt: Number(f.secondsUntilHunt || 0),
        markExpiresAt: null,
        markPlacedAt: null,
        markedByHunterId: null,
      }));

      // Сортировка по value desc
      mapped.sort((a, b) => {
        const va = Number(a.valueLamports || 0);
        const vb = Number(b.valueLamports || 0);
        if (vb !== va) return vb - va;
        const sa = Number(a.share || 0);
        const sb = Number(b.share || 0);
        if (sb !== sa) return sb - sa;
        return a.id - b.id;
      });

      setItems(mapped);

      const valueMap: Record<number, number> = {};
      const costMap: Record<number, number> = {};
      const baseMap: Record<number, number> = {};
      const pdaMap: Record<number, string> = {};
      const avatarMap: Record<number, string> = {};
      for (const f of mapped) {
        valueMap[f.id] = Number(f.valueLamports || 0);
        const baseFeed = Math.max(
          Math.floor((Number(f.valueLamports || 0) * currentFeedPercentBps) / 10_000) - Number(f.receivedFromHuntValue || 0),
          minFeedAtomic
        );
        const fee = Math.floor(baseFeed / 10);
        baseMap[f.id] = baseFeed;
        costMap[f.id] = baseFeed + fee;
        try {
          if (f.owner) {
            const pda = deriveFishPda(programId, new PublicKey(f.owner), f.id);
            pdaMap[f.id] = pda.toBase58();
          }
        } catch {
          // ignore PDA errors
        }
        avatarMap[f.id] = buildAvatarUrl(base, f.avatarFile);
      }
      setValueById(valueMap);
      setFeedBaseById(baseMap);
      setFeedCostById(costMap);
      setPdaById(pdaMap);
      setAvatarById(avatarMap);
      const earningsMap: Record<number, number> = {};
      for (const f of arr) {
        const idNum = Number(f?.fishId);
        if (!Number.isFinite(idNum)) continue;
        const val = Number(f?.earnings24hLamports ?? 0);
        earningsMap[idNum] = Number.isFinite(val) ? val : 0;
      }
      setEarnings24hById(earningsMap);
    } catch (e) {
      setItems([]);
      setValueById({});
      setFeedCostById({});
      setFeedBaseById({});
      setPdaById({});
      setAvatarById({});
      setEarnings24hById({});
    } finally {
      setLoading(false);
    }
  }, [publicKey, minFeedAtomic]);

  useEffect(() => {
    let cancelled = false;
    const wallet = publicKey?.toBase58() || null;
    if (lastWalletRef.current === wallet) return () => { cancelled = true; };
    lastWalletRef.current = wallet;
    (async () => { if (!cancelled) await reload(); })();
    return () => { cancelled = true; };
  }, [publicKey, reload]);

  const optimisticFeedUpdate = useCallback((fishId: number, deltaLamports: number) => {
    const nowSec = chainNowSec;
    setItems((prev) =>
      prev.map((f) =>
        f.id === fishId
          ? { ...f, lastFedAt: nowSec, valueLamports: (f.valueLamports || 0) + deltaLamports }
          : f
      )
    );
    setValueById((prev) => {
      const nextVal = (prev[fishId] || 0) + deltaLamports;
      return { ...prev, [fishId]: nextVal };
    });
    setFeedBaseById((prev) => {
      const currentVal = (valueById[fishId] || 0) + deltaLamports;
      const recvFromHunt = items.find((x) => x.id === fishId)?.receivedFromHuntValue || 0;
      const baseFeed = Math.max(
        Math.floor((currentVal * feedPercentBps) / 10_000) - recvFromHunt,
        minFeedAtomic
      );
      return { ...prev, [fishId]: baseFeed };
    });
    setFeedCostById((prev) => {
      const currentVal = (valueById[fishId] || 0) + deltaLamports;
      const recvFromHunt = items.find((x) => x.id === fishId)?.receivedFromHuntValue || 0;
      const baseFeed = Math.max(
        Math.floor((currentVal * feedPercentBps) / 10_000) - recvFromHunt,
        minFeedAtomic
      );
      const fee = Math.floor(baseFeed / 10);
      return { ...prev, [fishId]: baseFeed + fee };
    });
  }, [chainNowSec, items, valueById, feedPercentBps, minFeedAtomic]);

  const refreshFishInfo = useCallback(
    async (fishId: number) => {
      if (!Number.isFinite(fishId)) return;
      try {
        const cfg = await loadRuntimeConfig();
        const { API_BASE_URL, PROGRAM_ID } = cfg;
        if (!PROGRAM_ID) return;
        const programId = new PublicKey(PROGRAM_ID);
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const makeUrl = (path: string) => (base ? `${base}${path}` : path);
        const res = await fetch(makeUrl(`/api/v1/fish/${fishId}/info`));
        if (!res.ok) return;
        const j = await res.json();
        const data = j?.data || j;
        if (!data) return;

        // const lastFedAtSec = data.lastFedAt ? Math.floor(new Date(data.lastFedAt).getTime() / 1000) : undefined;
        // const lastHuntAtSec = data.lastHuntAt ? Math.floor(new Date(data.lastHuntAt).getTime() / 1000) : undefined;
        // const canHuntAfterSec = data.canHuntAfter ? Math.floor(new Date(data.canHuntAfter).getTime() / 1000) : undefined;
        const valueLamportsNum = Number(data.valueLamports || data.valueLamportsStr || 0);
        const receivedFromHunt = Number(data.receivedFromHuntValue || 0);

        const baseFeed = Math.max(
          Math.floor((valueLamportsNum * feedPercentBps) / 10_000) - receivedFromHunt,
          minFeedAtomic
        );
        const fee = Math.floor(baseFeed / 10);

        let fishPda: string | undefined;
        try {
          fishPda = deriveFishPda(programId, new PublicKey(String(data.owner)), Number(data.fishId)).toBase58();
        } catch {
          // ignore PDA errors
        }

        setItems((prev) => {
          const idx = prev.findIndex((f) => Number(f.id) === Number(data.fishId));
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            // lastFedAt: lastFedAtSec,
            // lastHuntAt: lastHuntAtSec,
            // canHuntAfter: canHuntAfterSec,
            valueLamports: valueLamportsNum,
            avatarFile: data.avatarFile || next[idx].avatarFile,
            receivedFromHuntValue: receivedFromHunt,
          };
          return next;
        });
        setValueById((prev) => ({ ...prev, [fishId]: valueLamportsNum }));
        setFeedBaseById((prev) => ({ ...prev, [fishId]: baseFeed }));
        setFeedCostById((prev) => ({ ...prev, [fishId]: baseFeed + fee }));
        if (fishPda) setPdaById((prev) => ({ ...prev, [fishId]: fishPda }));
        setAvatarById((prev) => ({ ...prev, [fishId]: buildAvatarUrl(base, data.avatarFile || null) }));
      } catch (e) {
      }
    },
    []
  );

  return {
    loading,
    items,
    valueById,
    feedCostById,
    feedBaseById,
    feedPercentBps,
    pdaById,
    reload,
    avatarById,
    earnings24hById,
    refreshFishInfo,
    optimisticFeedUpdate
  };
}
// 