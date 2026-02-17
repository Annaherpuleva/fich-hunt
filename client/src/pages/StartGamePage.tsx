import React, { useEffect, useRef, useState } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useWallet } from '../wallet/tonWallet';
import { useTx } from '../components/TxOverlay';
import { LAMPORTS_PER_SOL } from '../core/constants';
import { triggerConfetti } from '../utils/confetti';
import { useNavigate } from 'react-router-dom';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { fetchCompat } from '../shared/api/compat';
import { Socials } from "../features/fish/components/TopOceanBlock";
import { buildTonCreateTx } from '../ton/tx-ton-ocean';
import { getMyFish } from '../shared/api/fishApi';

type WidgetItem = {
  id: string;
  name: string;
  valueText: string;
  walletAddress: string;
  owner?: string;
  avatarUrl?: string | null;
  avatarType?: 'jellyfish' | 'shark' | 'fish' | 'whale' | 'octopus';
  socials?: { x?: string; telegram?: string; discord?: string };
};

const StartGamePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'top'>('new');
  const [recentItems, setRecentItems] = useState<WidgetItem[]>([]);
  const [topItems, setTopItems] = useState<WidgetItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState<boolean>(true);
  const [loadingTop, setLoadingTop] = useState<boolean>(true);
  const [fishName, setFishName] = useState('');
  const [fishNameError, setFishNameError] = useState<string | null>(null);
  const [fishPrice, setFishPrice] = useState(0.10);
  const [priceInput, setPriceInput] = useState<string>('0.10');
  const [_priceWidth, setPriceWidth] = useState<number>(58);
  const priceMeasureRef = useRef<HTMLSpanElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const isPriceInputFocusedRef = useRef<boolean>(false);
  const [fishCreated, setFishCreated] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdValueSol, setCreatedValueSol] = useState<number | null>(null);
  const [createdAvatarUrl, setCreatedAvatarUrl] = useState<string | null>(null);
  const [waitingAvatar, setWaitingAvatar] = useState<boolean>(false);
  const [_createdAnimationLoaded, setCreatedAnimationLoaded] = useState<boolean>(false);
  const { publicKey } = useWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { t, language } = useLanguage();
  const { runTx } = useTx();
  const navigate = useNavigate();
  const avatarRef = useRef<HTMLDivElement | null>(null);

  const createdAnimationUrl = React.useMemo(() => {
    if (!createdAvatarUrl || !createdAvatarUrl.includes('/static/avatars/thumbs/')) return null;
    const base = createdAvatarUrl.replace('/static/avatars/thumbs/', '/static/avatars/animations/');
    // заменяем расширение на .webm, сохраняя возможный query/hash
    return base.replace(/\.[^.?#]+(?=($|[?#]))/, '.webm');
  }, [createdAvatarUrl]);

  useEffect(() => {
    // при смене аватара/анимации сбрасываем флаг загрузки
    setCreatedAnimationLoaded(false);
  }, [createdAnimationUrl]);

  // Получаем градиентные цвета для аватаров (fallback, когда нет картинки)
  const getAvatarGradient = (type: string) => {
    const gradients = {
      jellyfish: 'bg-gradient-to-br from-purple-400 to-pink-400',
      shark: 'bg-gradient-to-br from-blue-400 to-cyan-400',
      fish: 'bg-gradient-to-br from-green-400 to-teal-400',
      whale: 'bg-gradient-to-br from-indigo-400 to-purple-400',
      octopus: 'bg-gradient-to-br from-orange-400 to-red-400'
    };
    return gradients[type as keyof typeof gradients] || gradients.fish;
  };

  const shortAddr = (addr?: string) => {
    if (!addr) return '';
    const s = String(addr);
    return `${s.slice(0, 6)}...${s.slice(-4)}`;
  };

  const _buildSocialUrl = (kind: 'telegram'|'x'|'discord', v?: string) => {
    if (!v) return undefined;
    const hasProto = /^https?:\/\//i.test(v);
    if (hasProto) return v;
    const val = v.startsWith('@') ? v.slice(1) : v;
    if (kind === 'telegram') return `https://t.me/${val}`;
    if (kind === 'x') return `https://x.com/${val}`;
    // discord could be username or invite; if plain, open users search URL
    return /^\d{5,20}$/.test(val) ? `https://discord.com/users/${val}` : `https://discord.com/${val}`;
  };

  // Load data for right widget (both tabs)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingRecent(true);
        setLoadingTop(true);
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');

        // fetch recent created fish events (up to 10)
        const recentP = (async () => {
          try {
            const r = await fetchCompat(base, '/api/v1/events?type=FishCreated&limit=10');
            if (!r.ok) throw new Error('bad');
            const j = await r.json();
            const evs: any[] = Array.isArray(j?.data) ? j.data : Array.isArray(j?.items) ? j.items : [];
            const rows = evs.map((e: any) => {
              const pd = e?.payloadDec || {};
              const p = e?.payload || {};
              const fishIdRaw = pd.fish_id ?? p.fish_id ?? pd.fishId ?? p.fishId;
              const fishId = Number(String(fishIdRaw));
              const name = pd.name || p.name || (language === 'ru' ? `Житель #${fishId}` : `Fish #${fishId}`);
              const owner = pd.owner || p.owner || e.owner || '';
              const shareStr = String(pd.share ?? p.share ?? '0');
              return { fishId, name, owner, shareStr } as any;
            }).filter((x) => Number.isFinite(x.fishId));

            // batch avatars
            const ids = rows.map((r: any) => String(r.fishId)).join(',');
            let idToAvatar: Record<string, string> = {};
            try {
              if (ids.length) {
                const rr = await fetch(`${base}/api/v1/fish/names?ids=${encodeURIComponent(ids)}`);
                if (rr.ok) {
                  const jj = await rr.json();
                  const arr = Array.isArray(jj?.data) ? jj.data : Array.isArray(jj?.items) ? jj.items : [];
                  idToAvatar = Object.fromEntries(arr.map((d: any) => [String(d.fishId), d.avatarFile])) as Record<string, string>;
                }
              }
            } catch {}

            // fetch socials per owner (no batch endpoint, do up to 10 requests)
            const owners = Array.from(new Set(rows.map((r: any) => String(r.owner)).filter(Boolean)));
            const addrToSocials: Record<string, any> = {};
            try {
              await Promise.all(owners.map(async (addr) => {
                try {
                  const pr = await fetchCompat(base, `/api/v1/wallet/${addr}/profile`);
                  if (pr.ok) {
                    const pj = await pr.json();
                    addrToSocials[addr] = pj?.data?.socials || pj?.socials || {};
                  }
                } catch {}
              }));
            } catch {}

            // compute value from share using API ocean summary (no RPC)
            let oceanBalance = 0n, totalShares = 1n;
            try {
              const sumRes = await fetchCompat(base, '/api/v1/ocean/summary');
              if (sumRes.ok) {
                const sumJson = await sumRes.json();
                const data = sumJson?.data || sumJson;
                const balStr = data?.balanceLamports ?? data?.tvlLamports ?? '0';
                const sharesStr = data?.totalShares ?? '0';
                oceanBalance = BigInt(String(balStr || '0'));
                const ts = BigInt(String(sharesStr || '0'));
                totalShares = ts > 0n ? ts : 1n;
              }
            } catch {}

            const mapped: WidgetItem[] = rows.map((r: any) => {
              let valLamports = 0n;
              try {
                const share = BigInt(String(r.shareStr || '0'));
                if (share > 0n) valLamports = (oceanBalance * share) / totalShares;
              } catch {}
              const valueText = `${(Number(valLamports) / 1_000_000_000).toFixed(2)} TON`;
              const avatarFile = idToAvatar[String(r.fishId)];
              const avatarUrl = avatarFile
                ? `${base}/static/avatars/thumbs/${String(avatarFile).replace(/\.[^.]+$/, '.webp')}`
                : undefined;
              return { id: String(r.fishId), name: r.name, valueText, walletAddress: shortAddr(r.owner), owner: String(r.owner), avatarUrl, socials: addrToSocials[String(r.owner)] || {} };
            });
            if (!cancelled) setRecentItems(mapped.slice(0, 10));
          } catch {
            if (!cancelled) setRecentItems([]);
          } finally {
            if (!cancelled) setLoadingRecent(false);
          }
        })();

        // fetch top fish leaderboard (top 10)
        const topP = (async () => {
          try {
            const r = await fetchCompat(base, '/api/v1/leaderboards/top-fish?limit=10');
            if (!r.ok) throw new Error('bad');
            const j = await r.json();
            const arr: any[] = Array.isArray(j?.data.items) ? j.data.items : [];
            const mapped: WidgetItem[] = arr.map((it: any) => {
              const valueLamports = Number(String(it.valueLamportsStr || '0'));
              const valueText = `${(valueLamports / 1_000_000_000).toFixed(2)} TON`;
              const avatarUrl = it.avatarFile
                ? `${base}/static/avatars/thumbs/${String(it.avatarFile).replace(/\.[^.]+$/, '.webp')}`
                : undefined;
              return {
                id: String(it.fishId),
                name: it.fishName || `Fish #${it.fishId}`,
                valueText,
                walletAddress: shortAddr(it.owner),
                owner: String(it.owner),
                avatarUrl,
                socials: it.socials || {},
              } as WidgetItem;
            });
            if (!cancelled) setTopItems(mapped.slice(0, 10));
          } catch {
            if (!cancelled) setTopItems([]);
          } finally {
            if (!cancelled) setLoadingTop(false);
          }
        })();

        await Promise.allSettled([recentP, topP]);
      } catch {
        if (!cancelled) { setLoadingRecent(false); setLoadingTop(false); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const increaseFishPrice = () => {
    setFishPrice(prev => {
      const v = Math.min(prev + 0.01, 1000);
      return v;
    });
  };

  const decreaseFishPrice = () => {
    setFishPrice(prev => {
      const v = Math.max(prev - 0.01, 0.01);
      return v;
    });
  };

  useEffect(() => {
    // Обновляем priceInput только если инпут не в фокусе, чтобы не терять позицию курсора
    if (!isPriceInputFocusedRef.current) {
      setPriceInput(fishPrice.toFixed(2));
    }
  }, [fishPrice]);

  const onPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursorPosition = input.selectionStart || 0;
    let val = e.target.value.replace(',', '.');
    if (val === '') { setPriceInput(val); return; }
    
    // Проверяем формат и ограничиваем до 2 цифр после запятой
    if (!/^\d*\.?\d*$/.test(val)) return;
    
    // Если есть точка, ограничиваем количество цифр после неё до 2
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const beforeDot = val.substring(0, dotIndex + 1);
      const afterDot = val.substring(dotIndex + 1);
      // Оставляем только первые 2 цифры после запятой
      const limitedAfterDot = afterDot.substring(0, 2);
      val = beforeDot + limitedAfterDot;
    }
    
    setPriceInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, 0.01), 1000);
      setFishPrice(clamped);
    }
    // Восстанавливаем позицию курсора после обновления
    setTimeout(() => {
      if (priceInputRef.current) {
        const newPosition = Math.min(cursorPosition, val.length);
        priceInputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const onPriceBlur = () => {
    const parsed = parseFloat(priceInput);
    const clamped = isNaN(parsed) ? fishPrice : Math.min(Math.max(parsed, 0.01), 1000);
    setFishPrice(clamped);
    setPriceInput(clamped.toFixed(2));
  };

  // Auto width for price input based on content (with min 58px, max 160px)
  useEffect(() => {
    const el = priceMeasureRef.current;
    if (!el) return;
    el.textContent = priceInput || '0';
    const w = Math.ceil(el.getBoundingClientRect().width) + 12; // small padding
    const finalW = Math.max(58, Math.min(160, w));
    setPriceWidth(finalW);
  }, [priceInput]);

  const validateFishName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return t.fishNameError ?? (language === 'ru' ? 'Введите имя жителя' : 'Enter fish name');
    }
    // Проверка на латинские буквы и цифры
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
      return t.fishNameInvalidChars ?? (language === 'ru' ? 'Используйте только латинские буквы и цифры' : 'Use only Latin letters and numbers');
    }
    return null;
  };

  const handleFishNameChange = (value: string) => {
    setFishName(value);
    if (fishNameError) {
      const error = validateFishName(value);
      setFishNameError(error);
    }
  };

  const createFish = async () => {
    if (creating) return;
    
    // Валидация имени
    const nameError = validateFishName(fishName);
    if (nameError) {
      setFishNameError(nameError);
      return;
    }
    setFishNameError(null);
    if (!publicKey) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cryptofish-open-wallet-menu"));
      } else {
        alert(language === 'ru' ? 'Подключите кошелек' : 'Connect wallet first');
      }
      return;
    }
    // Минимальный депозит 0.01 TON по правилам сервиса (10_000_000 базовых единиц)
    if (fishPrice < 0.01) {
      alert(language === 'ru' ? 'Минимальный депозит 0.01 TON' : 'Minimum deposit is 0.01 TON');
      return;
    }

    setCreating(true);
    try {
      const { API_BASE_URL } = await loadRuntimeConfig();
      const base = (API_BASE_URL || '').replace(/\/$/, '');
      const params = new URLSearchParams({ fishName });
      // Name availability endpoint may be unavailable on some deployments.
      // Never block wallet signing when this pre-check is down.
      try {
        const checkNameRes = await fetchCompat(base, `/api/v1/fish/check-name?${params}`, { cache: 'no-store' });
        if (checkNameRes.ok) {
          const j = await checkNameRes.json();
          if (j && j.ok === false && j.error?.code === 'already_exists') {
            setFishNameError(t.fishNameAlreadyExists);
            setCreating(false);
            return;
          }
        }
      } catch (checkError) {
        console.warn('fish name pre-check is unavailable, continue with transaction', checkError);
      }
      const depositLamports = Math.floor(fishPrice * LAMPORTS_PER_SOL);
      const oceanAddress = String((await loadRuntimeConfig()).OCEAN_TON || '').trim();
      if (!oceanAddress) {
        throw new Error(language === 'ru' ? 'Не настроен адрес сервиса OCEAN_TON.' : 'OCEAN_TON service address is not configured.');
      }

      const _sig = await runTx(
        async () => {
          const tx = buildTonCreateTx(oceanAddress, fishPrice.toFixed(2));
          const res = await tonConnectUI.sendTransaction(tx as any);
          return String((res as any)?.boc || 'ton-sent');
        },
        language === 'ru' ? 'Создание жителя...' : 'Creating fish...',
        { actionText: language === 'ru' ? `Создание жителя "${fishName}"` : `Create fish "${fishName}"`, showSuccessModal: false }
      );
      if (!_sig) return;

      const walletAddress = publicKey.toBase58();
      const waitForCreatedFish = async (totalMs = 35000, intervalMs = 1200) => {
        const started = Date.now();
        while (Date.now() - started < totalMs) {
          try {
            const myFish: any = await getMyFish(walletAddress);
            const items: any[] = Array.isArray(myFish?.data?.items)
              ? myFish.data.items
              : Array.isArray(myFish?.items)
                ? myFish.items
                : [];
            const created = items.find((it) => String(it?.fishName || '').toLowerCase() === fishName.toLowerCase());
            if (created) {
              return {
                fishId: Number(created?.fishId),
                fishName: String(created?.fishName || fishName),
                valueLamports: Number(created?.valueLamports || depositLamports),
              };
            }
          } catch {}
          await new Promise((r) => setTimeout(r, intervalMs));
        }
        return null;
      };

      const createdFish = await waitForCreatedFish();
      const fishId = Number(createdFish?.fishId);
      const fishNameOnChain: string = createdFish?.fishName || fishName;
      const valueLamports = Number.isFinite(createdFish?.valueLamports)
        ? Number(createdFish?.valueLamports)
        : depositLamports;

      // After successful creation request, wait for backend to bind avatar
      setCreatedValueSol(valueLamports / LAMPORTS_PER_SOL);
      if (fishNameOnChain) setFishName(fishNameOnChain);
      setWaitingAvatar(true);
      try {
        const url = await (async function waitForAvatar(id: number, totalMs = 20000, intervalMs = 800): Promise<string> {
          const started = Date.now();
          const fallback = '/img/fish-created-card-bg.jpg';
          while (Date.now() - started < totalMs) {
            try {
              const idStr = String(id);
              const res = await fetch(`${base}/api/v1/fish/${idStr}/info`, { cache: 'no-store' });
              if (res.ok) {
                const raw = await res.json();
                const data = raw?.data ?? raw;
                const file = data?.avatarFile as string | undefined;
                if (file) {
                  const webp = String(file).replace(/\.[^.]+$/, '.webp');
                  return `${base}/static/avatars/thumbs/${webp}`;
                }
                // если инфо уже есть, но аватара нет — перестаем ждать, чтобы не долбить API
                if (data && data.fishId) return fallback;
              }
            } catch {}
            await new Promise(r => setTimeout(r, intervalMs));
          }
          return fallback;
        })(Number.isFinite(fishId) ? fishId : 0);
        setCreatedAvatarUrl(url);
      } catch {
        setCreatedAvatarUrl('/img/fish-created-card-bg.jpg');
      } finally {
        setWaitingAvatar(false);
        setFishCreated(true);
      }
    } catch (e: any) {
      console.error('createFish failed', e);
      const fallbackMessage = language === 'ru'
        ? 'Не удалось открыть подтверждение транзакции. Попробуйте снова.'
        : 'Failed to open transaction confirmation. Please try again.';
      const message = typeof e?.message === 'string' && e.message.trim().length > 0
        ? e.message
        : fallbackMessage;
      await runTx(
        async () => {
          throw new Error(message);
        },
        language === 'ru' ? 'Создание жителя...' : 'Creating fish...',
        {
          actionText: language === 'ru' ? `Создание жителя "${fishName}"` : `Create fish "${fishName}"`,
          showSuccessModal: false,
        }
      );
    } finally {
      setCreating(false);
    }
  };

  // Trigger confetti after the created fish block actually renders in the DOM
  useEffect(() => {
    if (!fishCreated || waitingAvatar) return;
    // next tick to ensure layout is ready
    const id = setTimeout(() => {
      try {
        triggerConfetti(150, avatarRef.current || undefined);
      } catch (_) {}
    }, 0);
    return () => clearTimeout(id);
  }, [fishCreated, waitingAvatar]);

  return (
    <div className="min-h-screen bg-[#101014] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-0 lg:px-0 py-4 lg:py-8">
        <div className="flex flex-col items-center justify-center lg:items-start lg:flex-row gap-6 lg:gap-8 xl:gap-20">
          {/* Левая часть - Создание рыбы */}
          <div className="flex-1 max-w-[500px] lg:max-w-[650px] xl:max-w-[821px]">
            <div className="space-y-7">
              {/* Текстовый блок */}
              <div className="space-y-4 lg:space-y-5">
                <h1 className="text-[28px] sm:text-[32px] lg:text-[42px] font-bold leading-[1.02] tracking-[-0.01em] text-white font-sf-pro-display">
                  {t.createFishTitle}
                </h1>
                <p className="text-[16px] sm:text-[17px] lg:text-[18px] xl:text-[20px] font-normal leading-[1.3] tracking-[-0.02em] text-[#DEDEDE] font-sf-pro">
                  {t.createFishDescription}
                </p>
              </div>

              {/* Карточка создания рыбы */}
              <div className="relative min-h-[520px] lg:h-[600px] xl:h-[702px] rounded-2xl overflow-hidden">
                {(creating || waitingAvatar) && (
                  <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <div className="text-white text-sm font-semibold text-center px-6">
                      {creating ? (language === 'ru' ? 'Отправляем транзакцию...' : 'Sending transaction...') : (language === 'ru' ? 'Ждём подтверждение создания рыбы...' : 'Waiting for fish creation...')}
                    </div>
                  </div>
                )}
                {fishCreated ? (
                  /* Состояние "рыба создана" */
                  <div className="h-full">
                    {/* Фоновое изображение океана */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: 'url(/img/ocean-background.png)'
                      }}
                    />
                    
                    {/* Основной контейнер - карточка согласно Figma позиции (центр по вертикали как у формы ввода) */}
                    <div className="relative mt-[1.2rem] sm:mt-[0] z-10 flex h-full items-center justify-center px-3 py-6 sm:py-10 lg:px-4 xl:px-6">
                      <div 
                        className="w-full max-w-[396px] bg-white rounded-3xl p-4 sm:p-6 lg:p-[30px]"
                      >
                        
                        {/* Карточка с анимацией рыбы */}
                        <div
                          ref={avatarRef}
                          className="relative w-full pt-[100%] rounded-3xl overflow-hidden mb-3"
                        >
                          {/* Статичный фон на случай, если анимация не загрузилась */}
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                              backgroundImage:
                                createdAvatarUrl && createdAvatarUrl.length > 0
                                  ? `url(${createdAvatarUrl})`
                                  : 'url(/img/fish-created-card-bg.jpg)',
                            }}
                          />
                          {/* Видео-анимация поверх фона */}
                          {createdAnimationUrl && (
                            <video
                              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                              autoPlay
                              loop
                              muted
                              playsInline
                              onLoadedData={() => setCreatedAnimationLoaded(true)}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                setCreatedAnimationLoaded(false);
                              }}
                            >
                              <source src={createdAnimationUrl} type="video/webm" />
                            </video>
                          )}
                        </div>
                        
                        {/* Информация о рыбе */}
                        <div className="flex items-center justify-between mb-[14px]">
                          <div className="w-[131px] sm:w-[240px]">
                            <h3 className="text-[14px] sm:text-[20px] font-bold leading-[1.02] tracking-[-0.04em] text-[#404040] font-sf-pro-display truncate">
                              {fishName || "Ocean Ronin 17"}
                            </h3>
                          </div>
                          <div className="w-[131px] text-right">
                            <span className="text-[14px] sm:text-[20px] font-bold leading-[1.02] tracking-[-0.04em] text-[#404040] font-sf-pro-display">
                              {createdValueSol !== null ? `${createdValueSol.toFixed(2)} TON` : `${fishPrice.toFixed(2)} TON`}
                            </span>
                          </div>
                        </div>
                        
                        {/* Кнопка "Начать игру" — показываем только когда аватар получен */}
                        {!waitingAvatar && (
                          <button className="w-full bg-[#0088FF] hover:bg-[#0077DD] transition-colors rounded-lg py-[14px] px-[30px]" onClick={() => navigate('/my-fish')}>
                            <span className="text-[16px] font-bold leading-[1.02] tracking-[-0.04em] text-white font-sf-pro-display">
                              {t.startGame}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Состояние создания рыбы */
                  <div className="h-full">
                    {/* Фоновое изображение океана */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: 'url(/img/ocean-background.png)'
                      }}
                    />
                    
                    {/* Основной контейнер - центрированный по вертикали */}
                    <div className="relative z-10 flex h-full items-center justify-center px-3 py-6 sm:py-10 lg:px-4 xl:px-6">
                      <div className="w-full max-w-[396px] bg-white border border-[#EBEDF0] rounded-3xl relative p-6 sm:p-[30px]" style={{ borderWidth: '0.63px' }}>
                        
                        {/* Изображение рыбы */}
                        <div className="w-full h-[300px] rounded-3xl overflow-hidden mb-[14px]">
                          <div 
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: 'url(/img/fish-creation-image-7a550f.jpg)'
                            }}
                          />
                        </div>

                        {/* Контролы */}
                        <div className="w-full">
                          {/* Поле имени рыбы */}
                          <div className="w-full mb-[10px]">
                            <div className={`w-full h-[36px] sm:h-[40px] rounded-xl flex items-center justify-center px-[14px] sm:px-6 ${
                              fishNameError ? 'bg-[#FF4444]/20 border-2 border-[#FF4444]' : 'bg-[#EBEBEB]'
                            }`}>
                              <input
                                type="text"
                                placeholder={t.fishName}
                                value={fishName}
                                onChange={(e) => handleFishNameChange(e.target.value)}
                                onBlur={() => {
                                  const error = validateFishName(fishName);
                                  setFishNameError(error);
                                }}
                                className="w-full text-center bg-transparent text-[14px] sm:text-[16px] font-normal leading-[1.02] tracking-[-0.03em] text-[#595959] font-sf-pro placeholder-[#595959] placeholder:text-center outline-none"
                              />
                            </div>
                            {fishNameError && (
                              <div className="mt-1 text-[12px] sm:text-[13px] text-[#FF4444] font-sf-pro-display leading-[1.2]">
                                {fishNameError}
                              </div>
                            )}
                          </div>

                          {/* Контрол цены */}
                          <div className="w-full h-[36px] sm:h-[40px] bg-[#EBEBEB] rounded-xl relative flex items-center mb-3 sm:mb-4">
                            {/* Кнопка уменьшения */}
                            <button 
                              onClick={decreaseFishPrice}
                              className="absolute left-[3px] top-[3px] w-[28px] h-[28px] sm:w-[40px] sm:h-[34px] bg-[#101014] hover:bg-[#2A2A2E] transition-colors rounded-lg flex items-center justify-center"
                            >
                              <span className="text-[13px] sm:text-[14px] font-bold leading-[1.2] text-white font-onest">-</span>
                            </button>
                            
                            {/* Текст/инпут цены */}
                            <div className="flex-1 text-center flex items-center justify-center gap-[6px] sm:gap-2">
                              <span className="text-[13px] sm:text-[16px] font-normal leading-[1.02] tracking-[-0.03em] text-[#404040] font-sf-pro select-none">
                                {t.price}
                              </span>
                              <input
                                ref={priceInputRef}
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*[.]?[0-9]*"
                                value={priceInput}
                                onChange={onPriceInputChange}
                                onFocus={() => { isPriceInputFocusedRef.current = true; }}
                                onBlur={() => {
                                  isPriceInputFocusedRef.current = false;
                                  onPriceBlur();
                                }}
                                className="text-center bg-transparent outline-none text-[13px] sm:text-[16px] font-normal leading-[1.02] tracking-[-0.03em] text-[#404040] font-sf-pro w-[47px] sm:w-[70px]"
                                aria-label="Fish price in TON"
                              />
                              <span className="text-[13px] sm:text-[16px] font-normal leading-[1.02] tracking-[-0.03em] text-[#404040] font-sf-pro select-none">TON</span>
                            </div>
                            {/* hidden measurer for input width */}
                            <span ref={priceMeasureRef} className="absolute -z-10 opacity-0 pointer-events-none text-[14px] sm:text-[16px] font-normal tracking-[-0.03em] font-sf-pro" />
                            
                            {/* Кнопка увеличения */}
                            <button 
                              onClick={increaseFishPrice}
                              className="absolute right-[3px] top-[3px] w-[28px] h-[28px] sm:w-[40px] sm:h-[34px] bg-[#101014] hover:bg-[#2A2A2E] transition-colors rounded-lg flex items-center justify-center"
                            >
                              <span className="text-[13px] sm:text-[14px] font-bold leading-[1.2] text-white font-onest">+</span>
                            </button>
                          </div>

                          {/* Информационный текст */}
                          {/* <div className="mb-3 sm:mb-4">
                            <p className="text-[13px] sm:text-[14px] font-normal leading-[1.2] tracking-[-0.03em] text-[#595959] font-sf-pro-display">
                              {t.fishPriceInfo}
                            </p>
                          </div> */}

                          {/* Кнопка создания */}
                          <button 
                            onClick={createFish}
                            disabled={creating}
                            aria-busy={creating}
                            className={`w-full h-[48px] rounded-full px-[30px] transition-colors flex items-center justify-center ${creating ? 'bg-[#2A6EB3] cursor-not-allowed' : 'bg-[#0088FF] hover:bg-[#0077DD]'}`}
                          >
                            <span className="text-[15px] sm:text-[16px] font-bold leading-[1.02] tracking-[-0.01em] text-white font-sf-pro-display">
                              {t.createFish}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Правая часть - Список игроков */}
          <div className="w-full lg:w-[378px] lg:flex-shrink-0">
            <div className="bg-[#1C1B20] rounded-3xl p-4 lg:p-6 space-y-4 lg:space-y-6">
              {/* Табы */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('new')}
                  className={`px-[10px] py-[2px] rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'new'
                      ? 'bg-[#0088FF] text-white'
                      : 'bg-[#404040] text-[#EBEBEB]'
                  }`}
                >
                  {t.newFish}
                </button>
                <button
                  onClick={() => setActiveTab('top')}
                  className={`px-[10px] py-[2px] rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'top'
                      ? 'bg-[#0088FF] text-white'
                      : 'bg-[#404040] text-[#EBEBEB]'
                  }`}
                >
                  {t.topFish}
                </button>
              </div>

              {/* Заголовок секции */}
              <div className="space-y-2">
                <h2 className="text-xl lg:text-2xl font-bold leading-[1.1] tracking-[-0.01em] text-white">
                  {activeTab === 'new' ? t.recentlyInOcean : t.topFish}
                </h2>
                
                {/* Заголовки таблицы */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-sm lg:text-base font-medium leading-[1.1] tracking-[-0.03em] text-[#EBEBEB]">
                      {t.priceInSol}
                    </span>
                  </div>
                  <div className="w-20 lg:w-[103px] text-right">
                    <span className="text-sm lg:text-base font-medium leading-[1.1] tracking-[-0.03em] text-[#EBEBEB]">
                      {t.player}
                    </span>
                  </div>
                </div>
              </div>

              {/* Список игроков */}
              <div className="space-y-3">
                {(activeTab === 'new' ? loadingRecent : loadingTop) && (
                  <>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={`sk-start-${i}`} className="flex items-center gap-3 lg:gap-4 w-full min-h-[50px] lg:h-[60px]">
                        <div className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-lg overflow-hidden flex-shrink-0">
                          <div className="w-full h-full animate-pulse" style={{ background: '#2A2A2E' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="space-y-1 lg:space-y-[14px]">
                            <div className="animate-pulse" style={{ width: 160, height: 18, borderRadius: 6, background: '#2A2A2E' }} />
                            <div className="animate-pulse" style={{ width: 120, height: 14, borderRadius: 6, background: '#2A2A2E' }} />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 lg:gap-[10px] flex-shrink-0">
                          <div className="flex gap-1 lg:gap-2">
                            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-black/40 rounded-sm" />
                            <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/40 rounded-sm" />
                          </div>
                          <div className="animate-pulse" style={{ width: 100, height: 14, borderRadius: 6, background: '#2A2A2E' }} />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 'new' && !loadingRecent && recentItems.slice(0, 10).map((player) => (
                  <div key={`recent-${player.id}`} className="flex items-center gap-3 lg:gap-4 w-full min-h-[50px] lg:h-[60px]">
                    {/* Аватар */}
                    <div
                      className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/fish/${player.id}`)}
                      role="button"
                    >
                      {player.avatarUrl ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                      ) : (
                        <div className={`w-full h-full ${getAvatarGradient(player.avatarType || 'fish')} flex items-center justify-center`}>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/20 rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Информация */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1 lg:space-y-[14px]">
                        <h3 className="text-base lg:text-lg font-bold leading-[1.2] text-white truncate">{player.name}</h3>
                        <p className="text-xs lg:text-sm font-bold leading-[1.2] text-[#DEDEDE]">{player.valueText}</p>
                      </div>
                    </div>

                    {/* Социальные сети и адрес */}
                    <div className="flex flex-col items-end gap-2 lg:gap-[10px] flex-shrink-0">
                      <div className="flex gap-1 lg:gap-2">
                        <Socials socials={player.socials} />
                      </div>
                      <a
                        href={player.owner ? `https://tonscan.org/address/${player.owner}` : undefined}
                        target={player.owner ? "_blank" : undefined}
                        rel={player.owner ? "noreferrer" : undefined}
                        className="text-xs lg:text-base font-bold leading-[1.2] text-[#0088FF] text-right hover:underline"
                      >
                        {player.walletAddress}
                      </a>
                    </div>
                  </div>
                ))}

                {activeTab === 'new' && !loadingRecent && recentItems.length === 0 && (
                  <div className="text-sm lg:text-base font-bold leading-[1.2] text-[#DEDEDE]">
                    {t.noFishYet}
                  </div>
                )}

                {activeTab === 'top' && !loadingTop && topItems.slice(0, 10).map((player, _idx) => (
                  <div key={`top-${player.id}`} className="flex items-center gap-3 lg:gap-4 w-full min-h-[50px] lg:h-[60px]">
                    <div
                      className="w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/fish/${player.id}`)}
                      role="button"
                    >
                      {player.avatarUrl ? (
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${player.avatarUrl}')` }} />
                      ) : (
                        <div className={`w-full h-full ${getAvatarGradient(player.avatarType || 'fish')} flex items-center justify-center`}>
                          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-white/20 rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1 lg:space-y-[14px]">
                        <h3 className="text-base lg:text-lg font-bold leading-[1.2] text-white truncate">{player.name}</h3>
                        <p className="text-xs lg:text-sm font-bold leading-[1.2] text-[#DEDEDE]">{player.valueText}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 lg:gap-[10px] flex-shrink-0">
                      <div className="flex gap-1 lg:gap-2">
                        <Socials socials={player.socials} />
                      </div>
                      <a
                        href={player.owner ? `https://tonscan.org/address/${player.owner}` : undefined}
                        target={player.owner ? "_blank" : undefined}
                        rel={player.owner ? "noreferrer" : undefined}
                        className="text-xs lg:text-base font-bold leading-[1.2] text-[#0088FF] text-right hover:underline"
                      >
                        {player.walletAddress}
                      </a>
                    </div>
                  </div>
                ))}

                {activeTab === 'top' && !loadingTop && topItems.length === 0 && (
                  <div className="text-sm lg:text-base font-bold leading-[1.2] text-[#DEDEDE]">
                    {t.noFishYet}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartGamePage;
