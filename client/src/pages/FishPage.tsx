import cn from "clsx";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HintCard from '../features/fish/components/HintCard';
import FishHuntCard from '../features/fish/components/FishHuntCard';
import SkeletonFishCard from '../features/fish/components/SkeletonFishCard';
import SkeletonFishMain from '../features/fish/components/SkeletonFishMain';
import FishActionModal, { FishActionSellChildren } from '../features/fish/components/FishActionModal';
import PriceControl from '../features/fish/components/PriceControl';
import DeadFishForm from '../features/fish/components/DeadFishForm';
import ShareModal from '../features/fish/components/ShareModal';
import { useFishActions } from '../features/fish/hooks/useFishActions';
import { useAllFish } from '../features/fish/hooks/useAllFish';
import { deriveFishPda } from '../features/fish/api/pda';
import { useMyFish } from '../features/fish/hooks/useMyFish';
import { useWallet } from '../wallet/tonWallet';
import { useTx } from '../components/TxOverlay';
import * as anchor from '@/shims/anchor';
import { PublicKey, SystemProgram } from '@/shims/solanaWeb3';
import { getProgram } from '../config/contract';
import { useLanguage } from '../contexts/LanguageContext';
import { solToLamports } from '../core/utils/format';
import { LAMPORTS_PER_SOL, MIN_FEED_LAMPORTS } from '../core/constants';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { fetchCompat } from '../shared/api/compat';
import { Buffer } from 'buffer';
import FishEventRow from '../features/fish/components/FishEventRow';
import HungerBar from '../features/fish/components/HungerBar';
import { useFishEvents } from '../features/fish/hooks/useFishEvents';
import { useOceanStatus } from '../features/ocean/hooks/useOceanStatus';
import { fetchOceanSafe } from '../features/ocean/api/ocean.api';
import { sendTransactionWithWallet } from '../utils/sendTransactionWithWallet';
// Right column widgets removed for this page version
import Paginator from '../features/fish/components/Paginator';
import { Socials, SocialsType } from "../features/fish/components/TopOceanBlock";
import { waitingForResult } from "../helpers/wait-for-result";
import { renderTextToken } from "../helpers/render-text-token";
import { useBlockchainNowSec } from "../core/hooks/useBlockchainNowSec";
import { useTimersConfig } from "../core/hooks/useTimersConfig";
import { FishEntity } from "../entities/fish/types";
import { useWindowWidth } from "../helpers/useWindowWidth";
import { getMarkCostLamports } from '../features/fish/utils/markCost';
import { ArrowLeft } from 'lucide-react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);
export type FishInfoType = {
  alive: boolean;
  feedValueLamports: number;
  valueLamports: number;
  lastFedAt: number | null;
  canHuntAfter: number | null;
  receivedFromHuntValue: number;
  ocean: OceanType;
  markedByHunterId: number | null;
  markPlacedAt: number | null;
  markExpiresAt: number | null;
  socials: SocialsType | null;
  secondsUntilHunger: number
};
export type OceanType = {
  accScaled: string;
  totalShares: string;
  balanceLamports: string;
  totalFishCount: string;

  isStorm: boolean;
  feedingPercentage: number;
  stormProbabilityBps: number;
  lastCycleMode: number;

  cycleStartTime: number;
  nextModeChangeTime: number;
  lastModeChangeAt: number;

  updatedAt: string; // ISO date
  slot: number;
};

const calcSellAmount = (vLamports: number) => {
  const value = vLamports / 1_000_000_000;
  const payout = value > 0 ? value * 0.9 : 0; // 10% total fee
  const amount = payout > 0 ? `${payout.toFixed(4)} TON` : '';
  return  amount;
};

const useInViewSection = ({ threshold = 0 }: { threshold?: number }) => {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([nextEntry]) => {
        if (!nextEntry) return;
        setEntry(nextEntry);
        setInView(nextEntry.isIntersecting);
      },
      { threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref: targetRef, inView, entry };
};

const FishPage: React.FC = () => {
  const isWindowWidth = useWindowWidth();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fishId = Number(id);
  const { items, valueById, pdaById, reload: victimsReload, loading, avatarById, heavierCount } = useAllFish(fishId);
  const { earnings24hById } = useMyFish();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { runTx } = useTx();
  const { t, language } = useLanguage();
  const { feedFish, placeMark: placeMarkAction, exitFish, transferFish, huntFish } = useFishActions();
  
  const { isStorm } = useOceanStatus();
  const chainNowSec = useBlockchainNowSec();
  const {
    feedPeriodSec,
    markPlacementWindowSec,
    highRateThresholdSec,
  } = useTimersConfig();
  const [searchParams] = useSearchParams();
  const huntPageParam = searchParams.get('huntPage');
  const hasHuntQuery = searchParams.get('hunt') === '1';
  const huntPage = Math.max(1, parseInt(huntPageParam ?? '1', 10) || 1);

  const buildSearch = (next?: { huntPage?: number; hunt?: boolean }) => {
    const params = new URLSearchParams(searchParams);
    if (next?.huntPage !== undefined) {
      const clamped = Math.max(1, next.huntPage);
      if (clamped === 1) params.delete('huntPage');
      else params.set('huntPage', String(clamped));
    }
    if (next?.hunt !== undefined) {
      if (next.hunt) params.set('hunt', '1');
      else params.delete('hunt');
    }
    return params.toString();
  };

  const setHuntPage = (next: number | ((prev: number) => number)) => {
    const value = typeof next === 'function' ? next(huntPage) : next;
    const clamped = Math.max(1, value);
    navigate({search: buildSearch({ huntPage: clamped })}, {replace: true});
  };

  const [fishInfo, setFishInfo] = useState<FishInfoType | null>(null);
  const huntPageSize = 8;
  const [hideMarkedFish, setHideMarkedFish] = useState<boolean>(false);
  const [showPreyMinValue, setShowPreyMinValue] = useState<boolean>(false);
  const [preySearchQuery, setPreySearchQuery] = useState<string>('');
  const [preyMinLamports, setPreyMinLamports] = useState<number>(10_000_000); // 0.5 TON
  const [preyMinValueRaw, setPreyMinValueRaw] = useState<string>('0.01');
  // const fishPda = React.useMemo(() => {
  //   const raw = pdaById?.[fishId];
  //   if (typeof raw === 'string' && raw.length > 0) return raw;
  //   return null;
  // }, [pdaById, fishId]);
  const [mainFishName, setMainFishName] = useState<string>('');
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [markPreyId, setMarkPreyId] = useState<number | null>(null);
  const [showMarkModal, setShowMarkModal] = useState<boolean>(false);
  const [showSellModal, setShowSellModal] = useState<boolean>(false);
  const [showGiftModal, setShowGiftModal] = useState<boolean>(false);
  const [showFeedConfirmModal, setShowFeedConfirmModal] = useState<boolean>(false);
  const [giftAddress, setGiftAddress] = useState<string>('');
  const [earn24hLamports, setEarn24hLamports] = useState<number | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [oceanState, setOceanState] = useState<{ balanceFishes: bigint; totalShares: bigint } | null>(null);
  const [hunterCanHuntAfterSec, setHunterCanHuntAfterSec] = useState<number | null>(null);
  const [feeding, setFeeding] = useState(false);
  const [showGrowthChart, setShowGrowthChart] = useState<boolean>(false);

  const handlePreyMinValueRawChange = (raw: string) => {
    let val = raw.replace(',', '.');
    if (val === '') {
      setPreyMinValueRaw(val);
      setPreyMinLamports(0);
      return;
    }
    const parsed = parseFloat(val);
    if (!/^\d*\.?\d{0,3}$/.test(val) || isNaN(parsed) || !fishInfo?.valueLamports) return;
    const parsedLamports = parsed *  LAMPORTS_PER_SOL;
    if (parsedLamports > fishInfo.valueLamports) return;
    setPreyMinValueRaw(val);
    setPreyMinLamports(parsedLamports);
    setHuntPage(1);
  };
  const toSec = (v: any): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return null;
      // если пришло в миллисекундах — приводим к секундам
      return v > 1_000_000_000_000 ? Math.floor(v / 1000) : Math.floor(v);
    }
    const ts = Date.parse(String(v));
    if (!Number.isFinite(ts)) return null;
    return Math.floor(ts / 1000);
  };

  const fishNameDisplay = React.useMemo(() => {
    const f = items.find(x => x.id === fishId);
    return f?.name || mainFishName || (Number.isFinite(fishId) ? `Fish #${fishId}` : 'Fish');
  }, [items, fishId, mainFishName]);

  const reloadFishInfo = useCallback(async () => {
    try {
      if (!Number.isFinite(fishId)) return;
      const { API_BASE_URL } = await loadRuntimeConfig();
      const base = (API_BASE_URL || '').replace(/\/$/, '');
      const r = await fetchCompat(base, `/api/v1/fish/${fishId}/info`, { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      const data = j?.data || j;
      const file = data?.avatarFile as string | undefined;
      if (file) {
        const webp = String(file).replace(/\.[^.]+$/, '.webp');
        setAvatarOverride(`${base}/static/avatars/${webp}`);
      }
      if (data?.fishName) setMainFishName((prev) => prev || data.fishName);
      if (data?.owner) setOwnerAddress(String(data.owner));
      if (!data) return null;

      const secondsUntilHunger = (() => {
        try {
          if (typeof data.secondsUntilHunger === 'number' && Number.isFinite(data.secondsUntilHunger)) {
            return data.secondsUntilHunger;
          }
          if (typeof data.lastFedAt === 'string') {
            const lastFedAtSec = new Date(data.lastFedAt).getTime() / 1000;
            const nowSec = chainNowSec;
            const elapsed = Math.max(0, nowSec - lastFedAtSec);
            return Math.max(0, feedPeriodSec - elapsed);
          }
          return 0;
        } catch {
          return 0;
        }
      })();
      const fishInfoNext: FishInfoType = {
        alive: data.alive,
        feedValueLamports: Number(data.feedValueLamports ?? 0),
        valueLamports: Number(data.valueLamports ?? 0),
        lastFedAt: toSec(data.lastFedAt),
        canHuntAfter: toSec(data.canHuntAfter),
        receivedFromHuntValue: Number(data.receivedFromHuntValue || 0),
        ocean: data.ocean || null,
        markedByHunterId: Number(data.markedByHunterId) ?? null,
        markPlacedAt: toSec(data.markPlacedAt),
        markExpiresAt: toSec(data.markExpiresAt),
        socials: data.socials || null,
        secondsUntilHunger,
      };
      setFishInfo(fishInfoNext);
      const ocean = fishInfoNext.ocean;
      if (ocean && ocean.balanceLamports !== undefined && ocean.totalShares !== undefined) {
        setOceanState({
          balanceFishes: BigInt(ocean.balanceLamports || 0),
          totalShares: BigInt(ocean.totalShares || 0)
        });
      }
      return fishInfoNext;
    } catch {}
  }, [fishId]);

  useEffect(() => {
    if (items.length && fishInfo) {
      firstScrollRef.current = true;

      return () => {
        firstScrollRef.current = null;
      };
    }
  }, [items.length, fishInfo]);

  useEffect(() => {
    // При смене fishId сразу сбрасываем локальные кэши имени/владельца,
    // чтобы при возврате "назад" не отображалось имя предыдущей жертвы.
    setMainFishName('');
    setOwnerAddress(null);
    reloadFishInfo();
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
    return () => {
      setFishInfo(null);
    };
  }, [fishId]);

  // Без RPC: кулдаун охоты и минимальная кормёжка из fishInfo (бэкенд)
  useEffect(() => {
    if (!Number.isFinite(fishId)) return;
    if (fishInfo?.canHuntAfter != null) {
      const ts = toSec(fishInfo.canHuntAfter);
      if (ts != null) setHunterCanHuntAfterSec(ts);
    }
    if (fishInfo?.valueLamports != null) {
      const val = Number(fishInfo.valueLamports || 0);
      if (val < preyMinLamports) {
        setPreyMinLamports(val);
        setPreyMinValueRaw((val / LAMPORTS_PER_SOL).toFixed(3));
      }
      (async () => {
        const val = Number(fishInfo.valueLamports || 0);
        const recv = Number(fishInfo.receivedFromHuntValue || 0);
        // Получаем реальный процент кормления из океана
        let percentBps = 1000; // 10% дефолт (fallback)
        try {
          const ocean = await fetchOceanSafe();
          if (ocean?.feedingPercentage != null && Number.isFinite(ocean.feedingPercentage)) {
            percentBps = Number(ocean.feedingPercentage);
          }
        } catch (e) {
          // Если не удалось получить, используем дефолт
        }
        let base = Math.max(0, Math.floor((val * percentBps) / 10_000) - recv);
        if (base < MIN_FEED_LAMPORTS) base = MIN_FEED_LAMPORTS;
        const fee = Math.floor(base / 10);
        setMinFeedLamports((prev) => (prev !== base ? base : prev));
        setGrowPrice((prev) => {
          const prevLamports = solToLamports(prev);
          const target = (base + fee) / LAMPORTS_PER_SOL;
          return prevLamports < base ? Number(target.toFixed(2)) : prev;
        });
      })();
    }
  }, [fishId, fishInfo]);

  useEffect(() => {
    (async () => {
      try {
        if (!Number.isFinite(fishId)) return;
        const exists = items.find(x => x.id === fishId) as any;
        if (exists) {
          if (exists.name) setMainFishName(exists.name);
          if (exists.owner && typeof exists.owner === 'string') setOwnerAddress(exists.owner);
        }
      } catch {
        // ignore fetch errors
      }
    })();
  }, [fishId, items]);

  const fishValueDisplay = React.useMemo(() => {
    const v = (fishInfo?.valueLamports ?? valueById[fishId] ?? 0) as number;
    return v > 0 ? `${(v / LAMPORTS_PER_SOL).toFixed(2)} TON` : '—';
  }, [fishInfo, valueById, fishId]);
  const fishValueDisplayPrecise = React.useMemo(() => {
    const v = (fishInfo?.valueLamports ?? valueById[fishId] ?? 0) as number;
    return v > 0 ? `${(v / LAMPORTS_PER_SOL).toFixed(6)} TON` : '—';
  }, [fishInfo, valueById, fishId]);
  const currentValueLamports = React.useMemo(() => {
    const raw = fishInfo?.valueLamports ?? valueById?.[fishId];
    return Number.isFinite(Number(raw)) ? Number(raw) : 0;
  }, [fishInfo, valueById, fishId]);
  // Основной аватар (может быть карточкой/большим изображением)
  const mainAvatarUrl = React.useMemo(() => {
    const v = avatarOverride || (avatarById?.[fishId]);
    return v && v.length > 0 ? v : '/img/fish-img-1.png';
  }, [avatarOverride, avatarById, fishId]);

  // Тумбик из /thumbs — используем в модалках, как в списке "Мои рыбы"
  const thumbAvatarUrl = React.useMemo(() => {
    const v = avatarById?.[fishId];
    if (v && v.length > 0) return v;
    // если есть только основной аватар из /static/avatars/, конвертируем в путь к тумбсу
    if (mainAvatarUrl.includes('/static/avatars/')) {
      const withThumb = mainAvatarUrl.replace('/static/avatars/', '/static/avatars/thumbs/');
      return withThumb.replace(/\.[^.?#]+(?=($|[?#]))/, '.webp');
    }
    return mainAvatarUrl;
  }, [avatarById, fishId, mainAvatarUrl]);
  const isDead = React.useMemo(() => {
    const v = (fishInfo?.valueLamports ?? valueById[fishId] ?? 0);
    return !v || v <= 0;
  }, [fishInfo, valueById, fishId]);
  const isOwner = React.useMemo(() => {
    if (!publicKey || !ownerAddress) return false;
    try { return publicKey.toBase58() === ownerAddress; } catch { return false; }
  }, [publicKey, ownerAddress]);
  const ownerAddressShort = React.useMemo(() => {
    if (!ownerAddress) return '';
    const s = String(ownerAddress);
    if (s.length <= 12) return s;
    return `${s.slice(0, 6)}...${s.slice(-4)}`;
  }, [ownerAddress]);
  const showHuntSection = isOwner && !isDead;
  const isStormNow = isStorm === null ? false : isStorm;

  const firstScrollRef = useRef<boolean | null>(null); //  null - ждём загрузку fishInfo и victims, true - скроллим в нужную секцию, false - ничего не делаем
  const huntSectionRef = useRef<HTMLDivElement>(null); // якорь секции для скролла
  const { ref, inView, entry } = useInViewSection({ threshold: 0.3 });
  useEffect(() => {
    if (firstScrollRef.current !== false || isWindowWidth === 'sm') return;

    // отслеживаем, что мы в секции охоты для правильного поведения "Назад" (десктоп)
    const goToHuntSection = Boolean(inView && showHuntSection && items.length);
    if (goToHuntSection === hasHuntQuery) return;
    navigate({ search: buildSearch({ hunt: goToHuntSection }) }, { replace: true });
  }, [inView, entry, firstScrollRef.current, showHuntSection, hasHuntQuery]);
  
  const scrollToHuntSection = () => {
    if (huntSectionRef.current) {
      huntSectionRef.current.scrollIntoView({ block: "start", behavior: firstScrollRef.current ? "instant" : "smooth" });
    } else {
      window.scrollTo({top: 0});
    }
  };

  useEffect(() => {
    if (!firstScrollRef.current) return;
    
    if (isWindowWidth !== 'sm' && hasHuntQuery && showHuntSection && items.length) {
      scrollToHuntSection();
    } else {
      window.scrollTo({ top: 0 });
    }
    firstScrollRef.current = false;
  }, [hasHuntQuery, showHuntSection, firstScrollRef.current]);

  const openMarkModal = (preyId: number) => {
    setMarkPreyId(preyId);
    setShowMarkModal(true);
  };
  const closeMarkModal = () => {
    setShowMarkModal(false);
    setMarkPreyId(null);
  };
  const confirmMark = async () => {
    if (markPreyId == null) return;
    try {
      const vLamports = valueById[markPreyId] || 0;
      const valueText = vLamports > 0 ? `${(vLamports / LAMPORTS_PER_SOL).toFixed(4)} TON` : '—';
      const preyItem = items.find((it) => Number(it.id) === markPreyId);
      const markCostLamports = getMarkCostLamports({
        valueLamports: vLamports,
        lastFedAtSec: preyItem?.lastFedAt ?? null,
        chainNowSec,
        feedPeriodSec,
        markPlacementWindowSec,
        highRateThresholdSec,
      });
      const params = {
        hunterId: fishId,
        preyId: markPreyId,
        markCostLamports,
        processingText: t.mark.processing,
        actionText: `${t.mark.actionPrefix} ${preyItem?.name ? `"${preyItem?.name}"` : `#${markPreyId}`}`,
        entity: {
          fishId: markPreyId,
          name: preyItem?.name || (language === 'ru' ? `Житель #${markPreyId}` : `Fish #${markPreyId}`),
          valueText,
          avatarUrl: avatarById?.[markPreyId],
        },
        waitingForCloseTx: async () => {
          const req = async ()  => {
            // дожидаемся информации об установке метки на жителя
            const victims = await victimsReload();
            const result = Boolean(victims?.some(f => Number(f.id) === markPreyId && f.markedByHunterId && Number(f.markedByHunterId) === Number(fishId)));
            if (result) {
              // при успешном результате, переключаем на 1 страницу
              setHuntPage(1);
            }
            return result;
          };
          await waitingForResult(req);
        },
      };
      await placeMarkAction(params);
    } finally {
      closeMarkModal();
    }
  };

  // Sell modal handlers (UI only for now; hook blockchain when ready)
  const openSellModal = () => setShowSellModal(true);
  const closeSellModal = () => setShowSellModal(false);

  // Feed confirm modal handlers
  const openFeedConfirmModal = () => setShowFeedConfirmModal(true);
  const closeFeedConfirmModal = () => setShowFeedConfirmModal(false);
  const confirmSell = async () => {
    try {
      const preyId = Number(id);
      if (!Number.isFinite(preyId)) return;
      const valueSol = currentValueLamports / LAMPORTS_PER_SOL;
      const payoutSol = valueSol > 0 ? valueSol * 0.9 : 0;
      await exitFish({
        fishId: preyId,
        processingText: t.sell.processing,
        actionText: `${t.sell.modalConfirmPrefix} ${fishValueDisplay}`,
        entity: {
          fishId: preyId,
          name: fishNameDisplay,
          valueText: fishValueDisplayPrecise,
          avatarUrl: thumbAvatarUrl,
          payoutSol,
        },
        waitingForCloseTx: async () => {
          // дожидаемся пока рыба сдохнет
          const req = async ()  => {
            const fishInfo = await reloadFishInfo();
            return fishInfo?.alive === false;
          };
          await waitingForResult(req);
          await reloadEvents();
        },
      });
      
    } catch (e) {
    } finally {
      closeSellModal();
    }
  };

  const confirmFeed = async () => {
    if (feeding) return;
    setFeeding(true);
    try {
      const lamports = solToLamports(growPrice);
      const minLamports = Math.max(minFeedLamports, MIN_FEED_LAMPORTS);
      if (lamports < minLamports) {
        const minSolDisplay = (minLamports / LAMPORTS_PER_SOL).toFixed(3);
        const template = (t.feed as any)?.minAmountError;
        let message: string;
        if (typeof template === 'string' && template.length > 0) {
          message = template.includes('0.01')
            ? template.replace(/0\.01/g, minSolDisplay)
            : `${template} ${minSolDisplay} TON`;
        } else {
          message = `${language === 'ru' ? 'Минимальный депозит' : 'Minimum amount is'} ${minSolDisplay} TON`;
        }
        toast.error(message);
        return;
      }
      const preyId = Number(id);
      if (!Number.isFinite(preyId)) return;
      const currentValueLamports = fishInfo?.valueLamports || 0;
      const newValueLamports = currentValueLamports + lamports;
      let valueText = `${(currentValueLamports / LAMPORTS_PER_SOL).toFixed(6)} TON`;
      const entity = {
        fishId: preyId,
        name: fishNameDisplay,
        valueText,
        avatarUrl: mainAvatarUrl,
        feedDeltaSol: lamports / LAMPORTS_PER_SOL,
        feedPercent: (isStorm ? 1000 : 500) / 100,
      };
      await feedFish({
        fishId: preyId,
        amountLamports: lamports,
        processingText: t.feed.processing,
        actionText: `${t.feed.actionPrefix} "${fishNameDisplay}"`,
        entity,
        waitingForCloseTx: async () => {
          // дожидаемся пока вес рыбы не станет равным (или больше) ожидаемого после успешного кормления
          let valueLamports = 0;
          const req = async ()  => {
            const newFishInfo = await reloadFishInfo();
            valueLamports = newFishInfo?.valueLamports || 0;
            if (valueLamports >= newValueLamports) {
              valueText = `${(valueLamports / 1_000_000_000).toFixed(6)} TON`;
              return true;
            }
            return false;
          };
          await waitingForResult(req);
          await Promise.all([
            victimsReload(),
            reloadEvents(),
            reloadEarnings(),
          ]);
          if (!valueLamports) return {
            valueText: `${(newValueLamports / 1_000_000_000).toFixed(6)} TON`
          };
          // обновляем значение entity на случай, если с рыбой ещё что-нибудь могло случиться за это время
          return {
            valueText
          };
        }
      });
    } catch (e) {
      console.error('feedFish', e);
    } finally {
      setFeeding(false);
      closeFeedConfirmModal();
    }
  };

  // Gift modal handlers
  const openGiftModal = () => setShowGiftModal(true);
  const closeGiftModal = () => setShowGiftModal(false);
  const confirmGift = async () => {
    try {
      const preyId = Number(id);
      if (!Number.isFinite(preyId)) return;
      await transferFish({
        fishId: preyId,
        newOwner: giftAddress,
        processingText: (t.gift as any)?.processing || 'Отправка подарка...',
        actionText: (t.gift as any)?.confirm || 'Подарить',
        entity: {
          fishId: preyId,
          name: fishNameDisplay,
          valueText: fishValueDisplayPrecise,
          avatarUrl: thumbAvatarUrl,
          recipient: giftAddress,
        },
      } as any);
      await victimsReload();
    } catch (e) {
    } finally {
      closeGiftModal();
      setGiftAddress('');
    }
  };

  const bitePrey = async (preyId: number) => {
    try {
      const preyItem = items.find((it) => Number(it.id) === preyId);
      const preyVLamports = preyItem?.valueLamports || 0;
      const valueText = preyVLamports > 0 ? `${(preyVLamports / LAMPORTS_PER_SOL).toFixed(4)} TON` : '—';
      const gainSol = preyVLamports > 0 ? (preyVLamports / LAMPORTS_PER_SOL) * 0.8 : 0;
      const now = chainNowSec;
      await huntFish({
        hunterId: fishId,
        preyId,
        processingText: t.tx.processing,
        actionText: `${(t.biteActionText)} ${preyItem?.name ? `"${preyItem?.name}"` : `#${preyId}`}`,
        entity: {
          fishId: preyId,
          name: preyItem?.name || (language === 'ru' ? `Житель #${preyId}` : `Fish #${preyId}`),
          valueText,
          avatarUrl: avatarById?.[preyId],
          huntGainSol: gainSol,
        },
        waitingForCloseTx: async () => {
          const req = async ()  => {
            // дожидаемся пока время следующей охоты станет больше текущей даты
            const fishInfo = await reloadFishInfo();
            const canHunt = fishInfo?.canHuntAfter ? now > fishInfo.canHuntAfter : false;
            return !canHunt;
          };
          await waitingForResult(req);
          await Promise.all([
            victimsReload(),
            reloadEvents(),
            reloadEarnings(),
          ]);
        },
      });
    } catch (e) {
    }
  };

  // Feed amount (TON)
  const defaultFeedSol = MIN_FEED_LAMPORTS / LAMPORTS_PER_SOL;
  const [minFeedLamports, setMinFeedLamports] = useState<number>(MIN_FEED_LAMPORTS);
  const minFeedSol = React.useMemo(() => {
    let sol = minFeedLamports / LAMPORTS_PER_SOL;
    if (solToLamports(sol) < minFeedLamports) {
      sol = (minFeedLamports + 1) / LAMPORTS_PER_SOL;
    }
    return sol;
  }, [minFeedLamports]);
  const [growPrice, setGrowPrice] = useState(() => {
    const initial = defaultFeedSol;
    const base = solToLamports(initial) < MIN_FEED_LAMPORTS ? (MIN_FEED_LAMPORTS + 1) / LAMPORTS_PER_SOL : initial;
    // храним цену с точностью до 2 знаков после запятой
    return Number(base.toFixed(2));
  });
  const feedStep = 0.01;
  // Revive modal controls
  const reviveMinAmount = 0.01;
  const [reviveOpen, setReviveOpen] = useState(false);
  const [reviveAmount, setReviveAmount] = useState(reviveMinAmount);
  const [reviveAmountRaw, setReviveAmountRaw] = useState<string>(reviveMinAmount.toFixed(2));
  const [reviveName, setReviveName] = useState('');
  const [reviveNameError, setReviveNameError] = useState<string | null>(null);
  const [reviveAmountError, setReviveAmountError] = useState<string | null>(null);

  const reviveNameEmptyMessage = t.fishNameError ?? (language === 'ru' ? 'Введите имя жителя' : 'Enter fish name');
  const reviveNameInvalidMessage =
    t.fishNameInvalidChars ?? (language === 'ru' ? 'Используйте только латинские буквы и цифры' : 'Use only Latin letters and numbers');
  const reviveAmountTooSmallMessage =
    (t.reviveModal as any)?.minAmountError ?? (language === 'ru' ? 'Минимальный депозит 0.01 TON' : 'Minimum deposit is 0.01 TON');

  const validateReviveName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return reviveNameEmptyMessage;
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return reviveNameInvalidMessage;
    return null;
  };

  const handleReviveNameChange = (value: string) => {
    setReviveName(value);
    if (reviveNameError) {
      const err = validateReviveName(value);
      setReviveNameError(err);
    }
  };

  const handleReviveNameBlur = () => {
    const err = validateReviveName(reviveName);
    setReviveNameError(err);
  };

  const handleReviveAmountChange = (next: number) => {
    setReviveAmount(next);
    setReviveAmountRaw(next.toFixed(2));
    if (reviveAmountError && next >= reviveMinAmount) {
      setReviveAmountError(null);
    }
  };

  const handleReviveAmountRawChange = (raw: string) => {
    setReviveAmountRaw(raw);
    if (reviveAmountError) {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed) && parsed >= reviveMinAmount) {
        setReviveAmountError(null);
      }
    }
  };

  const handleReviveAmountBlur = (next: number) => {
    if (next < reviveMinAmount) {
      setReviveAmountError(reviveAmountTooSmallMessage);
    } else {
      setReviveAmountError(null);
    }
  };

  const resetReviveState = () => {
    setReviveName('');
    setReviveAmount(reviveMinAmount);
    setReviveAmountRaw(reviveMinAmount.toFixed(2));
    setReviveNameError(null);
    setReviveAmountError(null);
  };

  const openReviveModal = () => {
    setReviveName('');
    setReviveAmount(reviveMinAmount);
    setReviveAmountRaw(reviveMinAmount.toFixed(2));
    setReviveNameError(null);
    setReviveAmountError(null);
    setReviveOpen(true);
  };

  const closeReviveModal = () => {
    setReviveOpen(false);
    resetReviveState();
  };

  const confirmReviveInline = async () => {
    const nameError = validateReviveName(reviveName);
    if (nameError) {
      setReviveNameError(nameError);
      return;
    }
    const rawAmount = parseFloat(reviveAmountRaw);
    if (isNaN(rawAmount) || rawAmount < reviveMinAmount) {
      setReviveAmountError(reviveAmountTooSmallMessage);
      return;
    }
    setReviveNameError(null);
    setReviveAmountError(null);
    try {
      if (!isOwner) return;
      const name = reviveName.trim();
      if (!publicKey) throw new Error('Wallet not connected');

      const readProgram: any = await getProgram(undefined, {} as any);
      const programId: PublicKey = readProgram.programId as PublicKey;

      const [oceanPda] = PublicKey.findProgramAddressSync([Buffer.from('ocean')], programId);
      // @ts-ignore
      const ocean: any = await readProgram.account.ocean.fetch(oceanPda);
      const nextIdBn: anchor.BN = ocean.nextFishId ?? ocean.next_fish_id;
      const nextId = Number(typeof nextIdBn?.toNumber === 'function' ? nextIdBn.toNumber() : Number(nextIdBn));
      const adminPk: PublicKey = new PublicKey(ocean.admin);

      const nextIdLe = Buffer.alloc(8);
      nextIdLe.writeBigUInt64LE(BigInt(nextId));
      const [newFishPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('fish'), publicKey.toBuffer(), nextIdLe],
        programId
      );

      const pdaMap = pdaById || {};
      let oldFishPdaStr = pdaMap[fishId];
      if (!oldFishPdaStr && ownerAddress) {
        oldFishPdaStr = deriveFishPda(programId, new PublicKey(ownerAddress), fishId).toBase58();
      }
      if (!oldFishPdaStr) throw new Error('Fish PDA not found');
      const oldFishPda = new PublicKey(oldFishPdaStr);

      const enc = new TextEncoder();
      // @ts-ignore
      const digest = await crypto.subtle.digest('SHA-256', enc.encode(name));
      const nameSeed = Buffer.from(new Uint8Array(digest));
      const [nameRegistryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('fish_name'), nameSeed],
        programId
      );

      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), oceanPda.toBuffer()],
        programId
      );

      const depositLamports = Math.floor(reviveAmount * 1_000_000_000);

      await runTx(
        async () => {
          const res = await sendTransactionWithWallet({
            methodCall: (program) => program.methods
              .resurrectFish(name, new anchor.BN(depositLamports))
              .accounts({
                ocean: oceanPda,
                oldFish: oldFishPda,
                newFish: newFishPda,
                nameRegistry: nameRegistryPda,
                vault: vaultPda,
                owner: publicKey,
                admin: adminPk,
                systemProgram: SystemProgram.programId,
              }),
            publicKey,
            signTransaction: signTransaction as any,
            signAllTransactions: signAllTransactions as any,
            useManualSign: false,
          });
            
          if (res) {
            const { API_BASE_URL } = await loadRuntimeConfig();
            const base = (API_BASE_URL || '').replace(/\/$/, '');

            const getFishInfo = async (): Promise<boolean> => {
              try {
                const idStr = String(nextId);
                const resp = await fetchCompat(base, `/api/v1/fish/${idStr}/info`, { cache: 'no-store' });
                if (resp.ok) {
                  const raw = await resp.json();
                  const data = raw?.data || raw;
                  if (String(data?.fishId) === idStr) {
                    navigate(`/fish/${idStr}`, { replace: true });
                    return true;
                  }
                }
              } catch (e) {
                console.error(`waitForAvatar`, e);
              }
              return false;
            };

            await waitingForResult(getFishInfo);
          }

          return res;
        },
        language === 'ru' ? 'Восстановление жителя...' : 'Reviving fish...',
        {
          actionText: language === 'ru' ? `Восстановить жителя "${name}"` : `Revive fish "${name}"`,
          successKind: 'revive',
          entity: {
            fishId,
            name,
            valueText: `${reviveAmount.toFixed(4)} TON`,
            avatarUrl: thumbAvatarUrl,
          },
        }
      );
      setReviveOpen(false);
      resetReviveState();
    } catch (e) {
    }
  };

  // Earnings (from backend accumulators)
  const [earnHunt, setEarnHunt] = useState<number | null>(null);
  const [earnPool, setEarnPool] = useState<number | null>(null);
  const [earnTotal, setEarnTotal] = useState<number | null>(null);
  const [earnLoading, setEarnLoading] = useState<boolean>(true);
  const [_earn24hLamports, _setEarn24hLamports] = useState<number | null>(null);

  const reloadEarnings = useCallback(async () => {
    try {
      setEarnLoading(true);
      if (!Number.isFinite(fishId)) return;
      const { API_BASE_URL } = await loadRuntimeConfig();
      const base = (API_BASE_URL || '').replace(/\/$/, '');
      const r = await fetchCompat(base, `/api/v1/fish/${fishId}/earnings`);
      if (!r.ok) return;
      const j = await r.json();
      const payload = j?.data ?? j;
      const hunt = Number(payload?.huntLamports || 0);
      const pool = Number(payload?.poolLamports || 0);
      const total = Number(payload?.totalLamports ?? (hunt + pool));
      const earnings24h = Number(payload?.earnings24hLamports ?? 0);
      setEarnHunt(hunt);
      setEarnPool(pool);
      setEarnTotal(total);
      _setEarn24hLamports(earnings24h);
    } catch {}
    finally {
      setEarnLoading(false); 
    }
  }, [fishId]);
  
  useEffect(() => {
    reloadEarnings();
  }, [fishId]);

  const { events, loading: eventsLoading, feedTimesSec: _feedTimesSec, reload: reloadEvents } = useFishEvents(
    Number.isFinite(fishId) ? fishId : null,
    { limit: 100 }
  );

  useEffect(() => {
    if (!Number.isFinite(fishId)) return;
    if (isDead) {
      setEarn24hLamports(0);
      return;
    }
    const earningsFromMyFish = earnings24hById?.[fishId];
    if (earningsFromMyFish !== undefined && earningsFromMyFish !== null) {
      setEarn24hLamports(Number(earningsFromMyFish));
      return;
    }
    if (_earn24hLamports !== null && _earn24hLamports !== undefined) {
      setEarn24hLamports(Number(_earn24hLamports));
    }
  }, [fishId, isDead, earnings24hById, _earn24hLamports]);

  const mainEarningBadgeText = React.useMemo(() => {
    if (isDead) return t.deadKilled;
    const earn24hValue = earn24hLamports || _earn24hLamports;
    if (!earn24hValue) return null;
    const safe = Number.isFinite(earn24hValue) ? earn24hValue : 0;
    if (safe === 0) return null;
    const sol = safe / 1_000_000_000;
    const sign = sol >= 0 ? '+' : '-';
    return `${sign}${Number(Math.abs(sol).toFixed(6))} TON ${t.over24hLabel ?? 'за 24 часа'}`;
  }, [earn24hLamports, _earn24hLamports, isDead, t]);

  const growthSeries = React.useMemo(() => {
    if (!events || events.length === 0) return [];
    const sortedAsc = [...events].sort(
      (a, b) => Number(a.blockTime || 0) - Number(b.blockTime || 0)
    );
    const points: Array<{ t: number; value: number }> = [];
    let valueLamports = 0;
    let hasValue = false;

    for (const ev of sortedAsc) {
      const tSec = Number(ev.blockTime || 0);
      if (!Number.isFinite(tSec) || tSec <= 0) continue;
      if (ev.eventType === 'FishCreated') {
        valueLamports = Number(ev.payloadDec.deposit || 0);
        hasValue = true;
        points.push({ t: tSec, value: valueLamports });
        continue;
      }
      if (ev.eventType === 'FishResurrected') {
        valueLamports = Number(ev.payloadDec.deposit || 0);
        hasValue = true;
        points.push({ t: tSec, value: valueLamports });
        continue;
      }
      if (ev.eventType === 'FishFed') {
        valueLamports = Number(ev.payloadDec.newValue ?? valueLamports);
        hasValue = true;
        points.push({ t: tSec, value: valueLamports });
        continue;
      }
      if (ev.eventType === 'FishHunted') {
        const delta = Number(ev.payloadDec.receivedFromHuntValue || 0);
        if (!Number.isFinite(delta)) continue;
        valueLamports = (hasValue ? valueLamports : 0) + delta;
        hasValue = true;
        points.push({ t: tSec, value: valueLamports });
        continue;
      }
    }

    if (points.length === 0 && fishInfo?.valueLamports) {
      points.push({ t: chainNowSec, value: fishInfo.valueLamports });
      return points;
    }

    if (points.length > 0 && fishInfo?.valueLamports) {
      const last = points[points.length - 1];
      if (chainNowSec > last.t) {
        points.push({ t: chainNowSec, value: fishInfo.valueLamports });
      }
    }

    return points;
  }, [events, fishInfo?.valueLamports, chainNowSec]);

  const growthChartLabels = React.useMemo(
    () =>
      growthSeries.map((p) => {
        try {
          return new Date(p.t * 1000).toLocaleDateString(
            language === 'ru' ? 'ru-RU' : 'en-US',
            { day: '2-digit', month: '2-digit' }
          );
        } catch {
          return '';
        }
      }),
    [growthSeries, language]
  );

  const growthChartData: ChartData<"line", number[], string> = React.useMemo(
    () => ({
      labels: growthChartLabels,
      datasets: [
        {
          data: growthSeries.map((p) => Number((Number(p.value) / 1_000_000_000).toFixed(6))),
          borderColor: 'rgba(255,216,77,0.95)',
          backgroundColor: 'rgba(255,216,77,0.15)',
          borderWidth: 3.5,
          borderCapStyle: 'round',
          borderJoinStyle: 'round',
          pointRadius: 4.5,
          pointHoverRadius: 6,
          pointBackgroundColor: 'rgba(255,216,77,0.95)',
          pointBorderColor: 'rgba(255, 161, 67, 0.98)',
          pointBorderWidth: 3,
          tension: 0.35,
          fill: false,
        },
      ],
    }),
    [growthSeries, growthChartLabels]
  );

  const growthChartOptions = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          display: false,
          grid: { display: false },
          border: { display: false },
          ticks: { display: false },
        },
        y: {
          display: false,
          grid: { display: false },
        },
      },
    }),
    []
  );

  const growthScale = React.useMemo(() => {
    if (!growthSeries || growthSeries.length === 0) {
      const v = fishInfo?.valueLamports ?? 0;
      const sol = v / 1_000_000_000;
      return {
        min: sol,
        mid: sol,
        max: sol,
      };
    }
    const valuesSol = growthSeries.map((p) => p.value / 1_000_000_000);
    const min = Math.min(...valuesSol);
    const max = Math.max(...valuesSol);
    return { min, max };
  }, [growthSeries, fishInfo?.valueLamports]);

  const growthPercent = React.useMemo(() => {
    if (!Number.isFinite(growthScale.min) || growthScale.min <= 0) return 0;
    const delta = growthScale.max - growthScale.min;
    if (!Number.isFinite(delta)) return 0;
    return (delta / growthScale.min) * 100;
  }, [growthScale.max, growthScale.min]);

  const formatSolShort = React.useCallback((v: number) => {
    return `${v.toFixed(2)} TON`;
  }, []);

  const glowPlugin = React.useMemo(
    () => ({
      id: 'glow',
      beforeDatasetDraw: (chart: any, args: any) => {
        if (args.index !== 0) return;
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = 'rgba(255,200,70,0.95)';
        ctx.shadowBlur = 24;
      },
      afterDatasetDraw: (chart: any, args: any) => {
        if (args.index !== 0) return;
        chart.ctx.restore();
      },
    }),
    []
  );

  const computeBiteGainSol = React.useCallback(
    (preyShare: number | null | undefined): number | null => {
      if (!oceanState) return null;
      if (preyShare == null) return null;
      const shareNum = Math.floor(Number(preyShare));
      if (!Number.isFinite(shareNum) || shareNum <= 0) return null;

      const balance = oceanState.balanceFishes;
      const totalShares = oceanState.totalShares;
      if (totalShares <= 0n || balance <= 0n) return null;

      const biteShare = BigInt(shareNum);
      if (biteShare <= 0n) return null;

      const toHunter = (biteShare * 80n) / 100n;
      const toPool = (biteShare * 10n) / 100n;
      const toAdminShare = (biteShare * 10n) / 100n;

      const shareToValue = (bal: bigint, total: bigint, share: bigint): bigint => {
        if (total <= 0n || share <= 0n || bal <= 0n) return 0n;
        const a = share;
        const b = bal;
        const denom = total;
        const numerator = a * b + denom / 2n;
        return numerator / denom;
      };

      const toAdminValue = shareToValue(balance, totalShares, toAdminShare);
      const newTotalShares = totalShares > toAdminShare + toPool ? totalShares - (toAdminShare + toPool) : 0n;
      const newBalance = balance > toAdminValue ? balance - toAdminValue : 0n;
      if (newTotalShares <= 0n || newBalance <= 0n) return null;

      const received = shareToValue(newBalance, newTotalShares, toHunter);
      if (received <= 0n) return null;

      const sol = Number(received) / 1_000_000_000;
      if (!Number.isFinite(sol) || sol <= 0) return null;
      return sol;
    },
    [oceanState],
  );

  const renderMainCard = () => {
    if (fishInfo === null) {
      return <SkeletonFishMain />;
    }
    return (
      <div className="rounded-[24px] bg-[#1C1B20] p-5 sm:p-[30px] sm:mt-[0px] w-ful">
        {/* Изображение */}
        <div className="relative w-full pt-[90%] rounded-[12px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-top"
            style={{ backgroundImage: (() => {
              const v = avatarOverride || avatarById?.[fishId];
              return v && v.length > 0 ? `url(${v})` : "url('/img/fish-img-1.png')";
            })() }}
          />
          {(isDead || mainEarningBadgeText) && (
            <div className="absolute left-4 top-4">
              <div className="backdrop-blur-[20px] bg-white/20 rounded-[8px] px-2 py-2 flex items-center">
                <span className="text-white text-[16px] font-sf-pro-display font-bold leading-[1.3] tracking-[-0.03em]">
                  {isDead ? (t.deadKilled) : (mainEarningBadgeText ?? '')}
                </span>
              </div>
            </div>
          )}
          {showGrowthChart && (
            <div className="absolute inset-0 z-10">
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
              <div className="relative w-full h-full p-3 sm:p-4 justify-end flex flex-col items-center">
                <div className="relative w-full h-[55%] flex flex-col">
                  <div className="absolute top-0 left-[50%] -translate-x-1/2 -translate-y-1/2 px-5 py-2 rounded-full bg-gradient-to-r from-[#3A2A00]/80 via-[#4A3300]/90 to-[#3A2A00]/80 border border-[#FFC857]/70 border-[4px] shadow-[0_0_27px_rgba(255,200,70,0.38)] backdrop-blur-[6px] flex items-center gap-2">
                    <span className="text-[#FFD24D] text-[27px] md:text-[33px] font-sf-pro-display font-bold leading-none">
                    +{Math.max(0, growthPercent).toFixed()}%
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 mx-[4%]">
                    <Line data={growthChartData} options={growthChartOptions} plugins={[glowPlugin]} />
                  </div>
                  <div className="mt-2">
                    <div className="w-full flex gap-[10px] items-center text-[rgba(255,216,77,0.95)] text-[12px] md:text-[16px] lg:text-[18px] font-sf-pro-display font-bold">
                      <span>{formatSolShort(growthScale.min)}</span>
                      <div className="h-[2px] bg-[rgba(255,216,77,0.95)] grow-[1]" />
                      <span>{formatSolShort(growthScale.max)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isDead ? null : (
          <>
            {/* Название и цена */}
            <div className="mt-[20px] sm:mt-[24px] w-full flex flex-row flex-nowrap items-center sm:items-end justify-between gap-3 sm:gap-4">
              <div className="basis-[50%] min-w-0">
                <span className="block truncate text-white text-[20px] md:text-[40px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em] whitespace-nowrap truncate">{fishNameDisplay}</span>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="block text-white text-[20px] sm:text-[32px] md:text-[42px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em] whitespace-nowrap">
                  {fishValueDisplayPrecise}
                </span>
              </div>
            </div>

            {/* Шкала голода — только для не-владельца; targetTs для синхронизации с таймером меток */}
            {!isOwner && (() => {
              const lastFed = fishInfo?.lastFedAt;
              const canHunt = fishInfo?.canHuntAfter;
              const targetTs = typeof lastFed === 'number' && lastFed > 0
                ? lastFed + feedPeriodSec
                : (typeof canHunt === 'number' && canHunt > 0 ? canHunt : null);
              return (
                <div className="mt-[16px] sm:mt-[20px] w-full">
                  <HungerBar
                    secondsUntilHunger={fishInfo?.secondsUntilHunger ?? 0}
                    targetTs={targetTs ?? undefined}
                  />
                </div>
              );
            })()}

            {/* Управление ценой и CTA — только для владельца */}
            {isOwner && (
              <div className="mt-[19px] sm:mt-[30px] flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-[30px] w-full">
                <div className="w-full lg:w-1/2">
                  <PriceControl value={growPrice} onChange={setGrowPrice} min={minFeedSol} step={feedStep} label={t.price} />
                </div>
                <div className="shrink-0 w-full lg:w-1/2">
                  <button
                    className="w-full h-[48px] rounded-full py-[14px] px-[30px] bg-[#0088FF] hover:bg-[#0a7ae4] transition-colors flex items-center justify-center"
                    disabled={feeding}
                    onClick={openFeedConfirmModal}
                  >
                    <span className="text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.01em]">{t.growFishButton ?? 'Увеличить жителя'}</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderAnalyticsSection = () => (
    <div className="w-full bg-[#1C1B20] rounded-[24px] py-[19px] px-5 sm:px-[24px] flex flex-col gap-[16px]">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
        <div>
          <span className="text-white text-[22px] sm:text-[24px] font-sf-pro-display font-bold leading-[1.1] tracking-[-0.01em]">
            {t.analyticsLabel ?? 'Аналитика'}
          </span>
        </div>
        {isOwner && !isDead && (
          <div className="sm:ml-auto">
            <button
              onClick={openGiftModal}
              className="h-[34px] px-[14px] rounded-full bg-[#404040] hover:bg-[#4a4a4f] transition-colors flex items-center justify-center"
            >
              <span className="text-[#EBEBEB] text-[14px] font-sf-pro-display font-medium leading-[1.3]">
                {(t.gift as any)?.confirm ?? 'Подарить'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Stats rows */}
      <div className="flex flex-col gap-[12px] w-full">
        {earnLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`sk-anal-${i}`} className="flex items-center gap-[12px] w-full">
                <div className="w-6 h-6 flex items-center justify-center">
                  <div
                    className="animate-pulse"
                    style={{ width: 24, height: 24, borderRadius: 6, background: '#2A2A2E' }}
                  />
                </div>
                <div className="flex-1">
                  <div
                    className="animate-pulse"
                    style={{ width: '100%', height: 32, borderRadius: 8, background: '#2A2A2E' }}
                  />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="flex items-center gap-[12px] w-full">
              <div className="w-6 h-6 flex items-center justify-center">
                <img src="https://fish-huting.pro/img/analytics-graph.svg" alt="graph" width={22} height={22} />
              </div>
              <div className="flex-1">
                <span className="text-white text-[14px] leading-[1.4] tracking-[-0.03em]">
                  {t.totalIncomeLabel ?? 'Общая доходность:'}{' '}
                  <br />
                  <strong>
                    {earnTotal != null ? `+${(earnTotal / 1_000_000_000).toFixed(6)} TON` : '—'}
                  </strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-[12px] w-full">
              <div className="w-6 h-6 flex items-center justify-center">
                <img src="https://fish-huting.pro/img/analytics-fish.svg" alt="fish" width={24} height={24} />
              </div>
              <div className="flex-1">
                <span className="text-white text-[14px] leading-[1.4] tracking-[-0.03em]">
                  {t.huntIncomeLabel ?? 'Доход с охоты:'}{' '}
                  <br />
                  <strong>
                    {earnHunt != null ? `+${(earnHunt / 1_000_000_000).toFixed(6)} TON` : '—'}
                  </strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-[12px] w-full">
              <div className="w-6 h-6 flex items-center justify-center">
                <img src="https://fish-huting.pro/img/analytics-wave.svg" alt="wave" width={24} height={24} />
              </div>
              <div className="flex-1">
                <span className="text-white text-[14px] leading-[1.4] tracking-[-0.03em]">
                  {t.oceanIncomeLabel ?? 'Доход с океана:'}{' '}
                  <br />
                  <strong>
                    {earnPool != null ? `+${(earnPool / 1_000_000_000).toFixed(6)} TON` : '—'}
                  </strong>
                </span>
              </div>
            </div>
            {!isOwner && ownerAddress && (
              <div className="flex items-center gap-[12px] w-full">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="https://fish-huting.pro/img/icon-wallet-new.svg" alt="wallet" width={24} height={24} />
                </div>
                <div className="flex-1 flex justify-between">
                  <span className="text-white text-[14px] leading-[1.4] tracking-[-0.03em]">
                    {language === 'ru' ? 'Владелец:' : 'Owner:'}
                    <br />
                    <a
                      href={`https://tonscan.org/address/${ownerAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0088FF] font-bold hover:underline break-all"
                    >
                      {ownerAddressShort}
                    </a>
                  </span>
                  {fishInfo?.socials ? <Socials socials={fishInfo.socials} /> : null}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons inside analytics card */}
      <div className="mt-[16px] flex flex-col gap-[12px] w-full">
        <button
          className={cn(
            "w-full h-[48px] rounded-full transition-colors flex items-center justify-center px-[30px]",
            showGrowthChart
              ? "bg-[#FFC857] hover:bg-[#F5B93B] shadow-[0_0_18px_rgba(255,200,70,0.35)]"
              : "bg-[#1F2730] hover:bg-[#2A3440]"
          )}
          onClick={() => setShowGrowthChart((prev) => {
            if (isWindowWidth !== 'xl' && !prev) {
              window.scrollTo({top: 0, behavior: 'smooth'});
            }
            return !prev;
          })}
        >
          <span className={cn(
            "text-[16px] font-sf-pro-display font-bold tracking-[-0.01em]",
            showGrowthChart ? "text-[#2B1A00]" : "text-white"
          )}>
            {t.dwellerGrowthChart}
          </span>
        </button>
        <button
          className="w-full h-[48px] rounded-full bg-[#0088FF] hover:bg-[#0a7ae4] transition-colors flex items-center justify-center px-[30px]"
          onClick={() => setShareModalOpen(true)}
        >
          <span className="text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.01em]">
            {t.shareToSocialLabel ?? 'Поделиться в соцсетях'}
          </span>
        </button>
        {isOwner && !isDead && (
          <button
            onClick={isStormNow ? undefined : openSellModal}
            disabled={isStormNow}
            aria-disabled={isStormNow}
            className="w-full h-[48px] rounded-full bg-[#EB176B] hover:bg-[#f32b7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center px-[30px]"
          >
            <span className="text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.01em]">
              {t.sellFishLabel ?? 'Продать жителя'}
            </span>
          </button>
        )}
        {isOwner && isDead && (
          <button
            onClick={openReviveModal}
            className="w-full h-[48px] rounded-full bg-[#0088FF] hover:bg-[#0a7ae4] transition-colors flex items-center justify-center px-[30px]"
          >
            <span className="text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.01em]">
              {(t.reviveModal as any)?.confirm ?? 'Восстановить'}
            </span>
          </button>
        )}
      </div>

      {/* Owner notice inside analytics card */}
      {isOwner && !isDead && isStormNow && (
        <div className="mt-[8px] w-full">
          <div className="text-[#DEDEDE] text-[14px] text-center leading-[1.2] tracking-[-0.03em] max-[340px]:text-[10px]">
            {renderTextToken(t.redOceanNotice)}
          </div>
        </div>
      )}
    </div>
  );

  const renderRecentActions = () => (
    <div className="w-full bg-[#1C1B20] rounded-[24px] p-[20px] sm:p-[24px] flex flex-col gap-[13px]">
      <div>
        <span className="text-white text-[22px] sm:text-[24px] font-sf-pro-display font-bold leading-[1.1] tracking-[-0.01em]">{t.recentActionsLabel ?? 'Последние действия'}</span>
      </div>

      {eventsLoading ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-re-${i}`} className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 w-full">
              <div className="flex flex-col gap-[4px] flex-1">
                <div className="animate-pulse" style={{ width: '70%', height: 16, borderRadius: 6, background: '#2A2A2E' }} />
                <div className="animate-pulse" style={{ width: '60%', height: 12, borderRadius: 6, background: '#2A2A2E' }} />
              </div>
              <div className="flex flex-col items-end gap-[4px] min-w-[88px]">
                <div className="animate-pulse" style={{ width: 88, height: 12, borderRadius: 6, background: '#2A2A2E' }} />
                <div className="animate-pulse" style={{ width: 76, height: 14, borderRadius: 6, background: '#2A2A2E' }} />
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {events.length === 0 ? (
            <div className="text-[#DEDEDE] text-[13px] sm:text-[14px] font-sf-pro-display">
              {t.fishEventsEmpty}
            </div>
          ) : (
            events.slice(0, 4).map((ev, i) => (
              <FishEventRow key={i} event={ev} translations={t} />
            ))
          )}
          {!eventsLoading && events.length > 4 && (
            <button
              type="button"
              onClick={() => navigate(`/fish/${fishId}/events`)}
              className="w-full h-[48px] rounded-full bg-[#0088FF] hover:bg-[#0a7ae4] transition-colors px-[30px] text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.01em] flex items-center justify-center"
            >
              {t.showMore}
            </button>
          )}
        </>
      )}
    </div>
  );

  const renderHuntSection = () => {
    if (!showHuntSection) return null;
    return (
      <div className="mt-[27px]" ref={ref}>
        <h2 className="text-white font-sf-pro-display font-bold text-[42px] leading-[1.02] tracking-[-0.03em]">
          {t.availableForHuntLabel ?? 'Доступны для охоты'}
        </h2>
        <div className="mt-[30px]">
          {(() => {
            const myValueRaw = fishInfo?.valueLamports ?? valueById[fishId];
            const valueReady = typeof myValueRaw === 'number' && Number.isFinite(myValueRaw) && myValueRaw >= 0;
            const myValue = Number(myValueRaw || 0);
            const available = items?.filter((f: any) => {
              if (f.id === fishId) return false;
              const v = Number(f.valueLamports || 0);
              return Number.isFinite(v) && v > 0;
            });

            if (!myValue || !available?.length) {
              // heavierCount = allItems.filter((f) => {
              //   if (f.id === fishId) return false;
              //   const v = Number(f.valueLamports || 0);
              //   return Number.isFinite(v) && v > 0;
              // }).length;
            }

            if (loading || !valueReady) {
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-[30px]">
                  {Array.from({ length: 8 }).map((_, i) => (<SkeletonFishCard key={`sk-${i}`} />))}
                </div>
              );
            }

            // Sort prey:
            //  1) рыбы с активной меткой, поставленной текущей рыбой (fishId), идут первыми
            //  2) внутри каждой группы — жертвы и те, кто ближе к состоянию "жертва"
            const nowSec = chainNowSec;
            const timeUntilVictim = (f: any) => {
              const lastFed = Number(f.lastFedAt || 0);
              const targetTs = lastFed > 0 ? lastFed + feedPeriodSec : Number(f.canHuntAfter || 0);
              if (!Number.isFinite(targetTs) || targetTs <= 0) return Number.POSITIVE_INFINITY;
              const remain = targetTs - nowSec;
              return remain <= 0 ? 0 : remain;
            };
            const sortedAvailable = [...available].sort((a, b) => {
              const aIsMarkOwner = a.markedByHunterId === fishId;
              const bIsMarkOwner = b.markedByHunterId === fishId;

              if (aIsMarkOwner && bIsMarkOwner) {
                return Number(b.markPlacedAt) - Number(a.markPlacedAt);
              }
              if (aIsMarkOwner !== bIsMarkOwner) return aIsMarkOwner ? -1 : 1;
              return timeUntilVictim(a) - timeUntilVictim(b);
            });

            const hasActiveMark = (f: FishEntity) => {
              const exp = Number(f.markExpiresAt || 0);
              return Number.isFinite(exp) && exp > 0 && exp > chainNowSec;
            };
            const withoutMarked = hideMarkedFish
              ? sortedAvailable.filter((f) => !hasActiveMark(f) || f.markedByHunterId === fishId)
              : sortedAvailable;
            const searchText = preySearchQuery.trim().toLowerCase();
            const withSearch = searchText
              ? withoutMarked.filter((f) => {
                const byName = String(f.name || '').toLowerCase().includes(searchText);
                const byOwner = String(f.owner || '').toLowerCase().includes(searchText);
                return byName || byOwner;
              })
              : withoutMarked;
            const displayList = showPreyMinValue
              ? withSearch.filter((f) => {
                const vLamports = Number(f.valueLamports);
                if (!vLamports) return false;
                return vLamports >= preyMinLamports;
              })
              : withSearch;

            const totalPages = Math.max(1, Math.ceil(displayList.length / huntPageSize));
            const safePage = Math.min(huntPage, totalPages);
            const from = (safePage - 1) * huntPageSize;
            const pageItems = displayList.slice(from, from + huntPageSize);

            const confirmResetMark = async (fishId: number) => {
              if (!publicKey) return;

              const { API_BASE_URL } = await loadRuntimeConfig();
              const base = (API_BASE_URL || '').replace(/\/$/, '');
              const response = await fetchCompat(base, `/api/v1/wallet/${publicKey.toBase58()}/reset-mark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fishId }),
              });
              if (!response.ok) throw new Error('Failed to reset mark');
              await victimsReload();
            };
            
            return (
              <>
                <div className="mt-[27px] w-full">
                  <HintCard type="hunt" values={{ count: String(heavierCount) }} />
                </div>
                {available.length > 0 && (
                  <>
                    <div className="mt-[20px] w-full max-w-[360px]">
                      <input
                        type="text"
                        value={preySearchQuery}
                        onChange={(e) => {
                          setPreySearchQuery(e.target.value);
                          setHuntPage(1);
                        }}
                        placeholder={language === 'ru' ? 'Поиск жертвы по имени или адресу' : 'Search prey by name or wallet'}
                        className="w-full h-[40px] rounded-[12px] bg-[#101014] border border-white/15 px-3 text-white placeholder:text-white/50 text-sm"
                      />
                    </div>
                    <label className="mt-[20px] inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hideMarkedFish}
                        onChange={(e) => {
                          setHideMarkedFish(e.target.checked);
                          setHuntPage(1);
                        }}
                        className="sr-only peer"
                      />
                      <span className="w-6 h-6 rounded-[8px] border-2 border-white/40 bg-[#101014] flex items-center justify-center peer-checked:bg-[#0088FF] peer-checked:border-[#0a7ae4] shrink-0">
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className={`text-[#101014] ${hideMarkedFish ? '' : 'opacity-0'}`}>
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-white/90 text-sm">{t.hideDwellersWithMark}</span>
                    </label>
                    <div className="mt-[12px] flex flex-col gap-2">
                      <div className="flex gap-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showPreyMinValue}
                            onChange={(e) => {
                              setShowPreyMinValue(e.target.checked);
                              setHuntPage(1);
                            }}
                            className="sr-only peer"
                          />
                          <span className="w-6 h-6 rounded-[8px] border-2 border-white/40 bg-[#101014] flex items-center justify-center peer-checked:bg-[#0088FF] peer-checked:border-[#0a7ae4] shrink-0">
                            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className={`text-[#101014] ${showPreyMinValue ? '' : 'opacity-0'}`}>
                              <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                          <span className="text-white/90 text-sm">{t.showPreyFrom}</span>
                        </label>
                        <div className={`inline-flex items-center gap-2 ${showPreyMinValue ? '' : 'opacity-50 pointer-events-none'}`}>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*[.]?[0-9]*"
                            value={preyMinValueRaw}
                            onChange={(e) => handlePreyMinValueRawChange(e.target.value)}
                            // onBlur={handlePreyMinValueBlur}
                            className="h-[30px] w-[50px] text-center rounded-[10px] bg-[#404040] outline-none text-white text-[14px] sm:text-[15px] font-sf-pro-display tracking-[-0.01em]"
                          />
                          <span className="text-white/90 text-sm">TON</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-[24px] grid justify-items-center grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-[30px]">
                      {pageItems.map((f, idx: number) => (
                        <FishHuntCard
                          key={f.id}
                          name={f.name || `Fish #${f.id}`}
                          valueLamports={Number.isFinite(Number(f.valueLamports)) ? f.valueLamports : valueById[f.id]}
                          lastFedAtSec={f.lastFedAt}
                          canHuntAfterSec={f.canHuntAfter}
                          variant={idx % 2 === 0 ? 'img1' : 'img3'}
                          avatarFile={f.avatarFile}
                          onOpen={() => navigate(`/fish/${f.id}`)}
                          onMark={() => openMarkModal(f.id)}
                          onBite={() => bitePrey(f.id)}
                          hunterCanHuntAfterSec={hunterCanHuntAfterSec}
                          biteGainSol={computeBiteGainSol(f.share)}
                          markExpiresAt={f.markExpiresAt}
                          markPlacedAt={f.markPlacedAt}
                          isMarkOwner={Number(f.markedByHunterId || 0) === Number(fishId || 0)}
                          resetMark={() => {
                            confirmResetMark(f.id);
                          }}
                        />
                      ))}
                    </div>
                    {displayList.length > huntPageSize && (
                      <div className="mt-[16px] flex justify-center">
                        <Paginator
                          page={safePage}
                          totalPages={totalPages}
                          onPrev={() => setHuntPage((p) => Math.max(1, p - 1))}
                          onNext={() => setHuntPage((p) => Math.min(totalPages, p + 1))}
                          onChange={(p) => {
                            setHuntPage(p);
                            scrollToHuntSection();
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </div>
      </div>
    );
  };

  const shareText = React.useMemo(() => {
    const ru = `Посмотри на жителя "${fishNameDisplay}" в CryptoFish!`;
    const en = `Check out fish "${fishNameDisplay}" on CryptoFish!`;
    return language === 'ru' ? ru : en;
  }, [fishNameDisplay, language]);

  // Absolute URL for OG image
  const ogImageUrl = React.useMemo(() => {
    if (!mainAvatarUrl) return '';
    if (mainAvatarUrl.startsWith('http://') || mainAvatarUrl.startsWith('https://')) {
      return mainAvatarUrl;
    }
    // Make relative URL absolute
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}${mainAvatarUrl.startsWith('/') ? mainAvatarUrl : `/${mainAvatarUrl}`}`;
  }, [mainAvatarUrl]);

  const ogTitle = React.useMemo(() => {
    return `${fishNameDisplay} - ${fishValueDisplay} | CryptoFish`;
  }, [fishNameDisplay, fishValueDisplay]);

  const ogDescription = React.useMemo(() => {
    const ru = `Житель "${fishNameDisplay}" весом ${fishValueDisplay} в игре CryptoFish на TON`;
    const en = `Fish "${fishNameDisplay}" worth ${fishValueDisplay} in CryptoFish game on TON`;
    return language === 'ru' ? ru : en;
  }, [fishNameDisplay, fishValueDisplay, language]);

  const backButton = <button
    type="button"
    onClick={() => navigate(-1)}
    className="inline-flex items-center gap-[6px] font-sf-pro-display text-[#58585b] hover:text-white transition-colors"
  >
    <ArrowLeft size={22} aria-hidden="true" strokeWidth={5} />
    {t.myFishBackButton}
  </button>;
  
  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{ogTitle}</title>
        <meta name="title" content={ogTitle} />
        <meta name="description" content={ogDescription} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl || ''} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={shareUrl || ''} />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        {ogImageUrl && <meta name="twitter:image" content={ogImageUrl} />}
      </Helmet>
      <div className="flex flex-col gap-6 text-white">
        {fishInfo !== null && (
          <div className="flex items-center gap-[6px]">
            <h1 className="flex gap-[10px] sm:gap-[15px] lg:gap-[18px] items-center font-sf-pro-display font-bold text-[26px] sm:text-[40px] leading-[0.9] sm:leading-[1.02] tracking-[-0.03em] text-[#58585b]">
              {isOwner ? <>
                <Link replace to={hasHuntQuery ? { search: buildSearch({ hunt: false }) } : '...'} className={cn(
                  'inline-flex items-center gap-[6px]',
                  'cursor-pointer', 
                  'hover:text-white',
                  { 
                    'hover:underline': isWindowWidth !== 'sm', 
                  }
                )}
                onClick={() => {
                  if (!hasHuntQuery) {
                    navigate(-1);
                  }
                }}
                >
                  <ArrowLeft size={22} aria-hidden="true" strokeWidth={5} />
                  {t.myFishBackButton}
                </Link>
                <span> / </span>
                <Link replace to={showHuntSection ? { search: buildSearch({ hunt: true }) } : ''} className={cn(
                  'cursor-pointer',
                  'transition',
                  {
                    'hover:underline': isWindowWidth !== 'sm',
                    'hover:text-white': !hasHuntQuery,
                    'text-white': hasHuntQuery,
                  }
                )} onClick={scrollToHuntSection}>{t.huntLabel}</Link>
              </> : backButton}
            </h1>
          </div>
        )}

        <div className="flex max-lg:flex-col gap-6 lg:gap-[40px] text-white">
          {isWindowWidth === 'sm' && hasHuntQuery ? (
            <div className="flex flex-col gap-6" ref={huntSectionRef}>
              {renderHuntSection()}
            </div>
          ) : (
            <>
              {/* Wide column first (left) */}
              <div className="grow">
                {renderMainCard()}
                {isWindowWidth !== 'sm' || hasHuntQuery ? <div ref={huntSectionRef}>
                  {renderHuntSection()}
                </div>: null}
              </div>
              {/* Narrow column second (right) */}
              <div className="basis-[31.086%] shrink-0 flex flex-col gap-6">
                {renderAnalyticsSection()}
                {renderRecentActions()}
              </div>
            </>
          )}
        </div>
      </div>
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={shareUrl}
        shareText={shareText}
      />
      
      {/* Mark modal */}
      <FishActionModal
        open={showMarkModal}
        onClose={closeMarkModal}
        onConfirm={confirmMark}
        confirmLabel={(() => {
          const v = markPreyId!=null ? (valueById[markPreyId] || 0) : 0;
          const prey = items.find(x => x.id === markPreyId) as any;
          const costLamports = getMarkCostLamports({
            valueLamports: v,
            lastFedAtSec: prey?.lastFedAt ?? null,
            chainNowSec,
            feedPeriodSec,
            markPlacementWindowSec,
            highRateThresholdSec,
          });
          const cost = costLamports / LAMPORTS_PER_SOL;
          const label = t.mark.modalConfirm;
          return cost > 0 ? `${label} ${cost.toFixed(4)} TON` : label;
        })()}
        cancelLabel={(t.mark as any)?.modalCancel ?? (t?.cancel ?? 'Отменить')}
        background="https://fish-huting.pro/img/tx-error-bg.png"
        imageSrc={(markPreyId && avatarById?.[markPreyId]) || '/img/dead-fish.png'}
        badgeText={'☠️ Черная метка 2/3'}
        fishName={(items.find(x=>x.id===markPreyId)?.name) || `Fish #${markPreyId ?? ''}`}
        fishValueText={markPreyId!=null && valueById[markPreyId] ? `${(valueById[markPreyId]/1_000_000_000).toFixed(2)} TON` : '—'}
      >
        <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em]">
          {renderTextToken(t.mark.modalText)}
        </div>
      </FishActionModal>

      {/* Sell modal */}
      <FishActionModal
        open={showSellModal}
        onClose={closeSellModal}
        onConfirm={confirmSell}
        confirmLabel={(() => {
          const prefix = t.sell.modalConfirmPrefix;
          const amount = calcSellAmount(fishInfo?.valueLamports ?? valueById[fishId] ?? 0);
          return amount ? `${prefix} ${amount}` : prefix;
        })()}
        cancelLabel={t.sell.modalCancel}
        background="https://fish-huting.pro/img/ocean-background.png"
        imageSrc={thumbAvatarUrl}
        fishName={fishNameDisplay}
        fishValueText={(() => {
          const vLamports = (fishInfo?.valueLamports ?? valueById[fishId] ?? 0) as number;
          const value = vLamports / 1_000_000_000;
          return value > 0 ? `${value.toFixed(4)} TON` : '—';
        })()}
      >
        <FishActionSellChildren amount={calcSellAmount(fishInfo?.valueLamports ?? valueById[fishId] ?? 0)} />
      </FishActionModal>

      {/* Gift modal */}
      <FishActionModal
        open={showGiftModal}
        onClose={closeGiftModal}
        onConfirm={confirmGift}
        confirmLabel={(t.gift as any)?.confirm ?? 'Подарить'}
        confirmDisabled={!giftAddress || giftAddress.length < 32}
        cancelLabel={(t.gift as any)?.cancel ?? (t?.cancel ?? 'Отменить')}
        background="https://fish-huting.pro/img/ocean-background.png"
        hideCloseIcon
        imageSrc={thumbAvatarUrl}
        fishName={fishNameDisplay}
        fishValueText={fishValueDisplay}
      >
        <div className="flex flex-col gap-[14px] w-full max-w-full sm:max-w-[335px]">
          <div className="text-white text-[20px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em]">
            {(t.gift as any)?.title ?? 'Отправить подарок'}
          </div>
          {/* input */}
          <div className="w-full">
            <div className="h-[44px] sm:h-[40px] w-full rounded-[12px] bg-black/20 flex items-center px-[14px] gap-[6px]">
              <span className="text-[16px] text-white/70">🔗</span>
              <input
                value={giftAddress}
                onChange={(e) => setGiftAddress(e.target.value)}
                placeholder={language === 'ru' ? 'Введите адрес кошелька' : 'Enter wallet address'}
                className="flex-1 h-full bg-transparent outline-none text-white text-[15px] sm:text-[16px]"
              />
            </div>
            {!giftAddress || giftAddress.length < 32 ? (
              <div className="mt-2 text-[12px] text-[#FF6B6B]">
                {giftAddress ? ((t.gift as any)?.invalidAddress ?? 'Некорректный адрес') : ''}
              </div>
            ) : null}
          </div>
        </div>
      </FishActionModal>

      {/* Feed confirm modal */}
      <FishActionModal
        open={showFeedConfirmModal}
        onClose={closeFeedConfirmModal}
        onConfirm={confirmFeed}
        confirmLabel={`${t.feed.confirmModal.confirmLabel}: ${growPrice.toFixed(2)} TON`}
        cancelLabel={t.feed.confirmModal.cancelLabel}
        background="https://fish-huting.pro/img/ocean-background.png"
        imageSrc={mainAvatarUrl}
        fishName={fishNameDisplay}
        fishValueText={(() => {
          const vLamports = fishInfo?.valueLamports || 0;
          const value = vLamports / 1_000_000_000;
          return value > 0 ? `${value.toFixed(4)} TON` : '—';
        })()}
      >
        <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em]">
          {renderTextToken(t.feed.confirmModal.text, { amount: growPrice.toFixed(2) })}
        </div>
      </FishActionModal>

      {/* Revive modal (opens from right column button) */}
      <FishActionModal
        open={reviveOpen}
        onClose={closeReviveModal}
        onConfirm={confirmReviveInline}
        confirmLabel={(t.reviveModal as any)?.confirm ?? 'Восстановить'}
        cancelLabel={(t.reviveModal as any)?.cancel ?? (t?.cancel ?? 'Отменить')}
        background="/img/ocean-background.png"
        hideCloseIcon
        hidePreview={false}
        hideNameValueRow
        imageSrc={thumbAvatarUrl}
      >
        <div className="mt-[20px] w-full max-w-full sm:max-w-[335px]">
          <DeadFishForm
            nameValue={reviveName}
            onNameChange={handleReviveNameChange}
            onNameBlur={handleReviveNameBlur}
            nameError={reviveNameError}
            placeholderName={(t.reviveModal as any)?.newNamePlaceholder || (language === 'ru' ? 'Новое имя жителя' : 'New fish name')}
            value={reviveAmount}
            onChange={handleReviveAmountChange}
            onAmountBlur={handleReviveAmountBlur}
            onRawAmountChange={handleReviveAmountRawChange}
            amountError={reviveAmountError}
            min={reviveMinAmount}
            step={0.01}
            labelPrice={t.price}
          />
        </div>
      </FishActionModal>
    </>
  );
};

export default FishPage;
