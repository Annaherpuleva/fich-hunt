import React, { useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MyProfilePanel from '../features/fish/components/MyProfilePanel';
import TopOceanBlock from '../features/fish/components/TopOceanBlock';
import OceanHappenings from '../features/fish/components/OceanHappenings';
import HintCard from '../features/fish/components/HintCard';
import FishCardImage from '../features/fish/components/FishCardImage';
import CreateFishTile from '../features/fish/components/CreateFishTile';
import MyFishHeader from '../features/fish/components/MyFishHeader';
import { useMyFish } from '../features/fish/hooks/useMyFish';
import { useBlockchainNowSec } from '../core/hooks/useBlockchainNowSec';
import { useTimersConfig } from '../core/hooks/useTimersConfig';
import SkeletonFishCard from '../features/fish/components/SkeletonFishCard';
import { useWallet } from '../wallet/tonWallet';
import { PublicKey, SystemProgram } from '@/shims/solanaWeb3';
import * as anchor from '@/shims/anchor';
import { getProgram } from '../config/contract';
import { useTx } from '../components/TxOverlay';
import { useLanguage } from '../contexts/LanguageContext';
import { Buffer } from 'buffer';
import FishActionModal from '../features/fish/components/FishActionModal';
import DeadFishForm from '../features/fish/components/DeadFishForm';
import ConfirmModal from '../features/fish/components/ConfirmModal';
import { LAMPORTS_PER_SOL } from '../core/constants';
import Paginator from '../features/fish/components/Paginator';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { fetchCompat } from '../shared/api/compat';
import { waitingForResult } from "../helpers/wait-for-result";
import { sendTransactionWithWallet } from '../utils/sendTransactionWithWallet';
import { useWindowWidth } from "../helpers/useWindowWidth";
import { deriveFishPda } from '../features/fish/api/pda';

const PAGE_PARAM = 'page';

const MyFishPage: React.FC = () => {
  const windowWidth = useWindowWidth();
  // Simplified two-column layout
  const {
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
  } = useMyFish();
  const chainNowSec = useBlockchainNowSec();
  const { feedPeriodSec } = useTimersConfig();
  const navigate = useNavigate();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { runTx } = useTx();
  const { t, language } = useLanguage();
  
  const [mobileTab, setMobileTab] = React.useState<'fish' | 'profile'>('fish');
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get(PAGE_PARAM);
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const setPage = (next: number | ((prev: number) => number)) => {
    const value = typeof next === 'function' ? next(page) : next;
    const clamped = Math.max(1, value);
    navigate({search: clamped === 1 ? '' : `page=${clamped}`}, {replace: true});
  };

  const pageSize = 5;
  const fishCardListRef = useRef<HTMLDivElement>(null);

  const handleFeed = async (fishId: number) => {
    try {
      const amountTotal = feedCostById[fishId];
      const baseAmount = feedBaseById[fishId];
      if (!amountTotal || !baseAmount) return;
      if (!publicKey) return;

      const SAFETY_DELTA_LAMPORTS = 5_000;
      const feedingAmount = baseAmount + SAFETY_DELTA_LAMPORTS;

      // Для read-only операций
      const readProgram: any = await getProgram(undefined, {} as any);
      const programId: PublicKey = readProgram.programId as PublicKey;

      const fishPda = (() => {
        const raw = pdaById[fishId];
        if (raw) return new PublicKey(raw);
        return deriveFishPda(programId, new PublicKey(publicKey.toBase58()), fishId);
      })();
      const [oceanPda] = PublicKey.findProgramAddressSync([Buffer.from('ocean')], programId);
      // @ts-ignore
      const ocean: any = await readProgram.account.ocean.fetch(oceanPda);
      const adminPk = new PublicKey(ocean.admin);
      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault'), oceanPda.toBuffer()], programId);

      const fishItem = items.find(f => f.id === fishId);
      const vLamports = fishItem?.valueLamports || 0;
      const entity = {
        fishId,
        name: fishItem?.name || (language === 'ru' ? `Житель #${fishId}` : `Fish #${fishId}`),
        valueText: vLamports > 0 ? `${(vLamports / LAMPORTS_PER_SOL).toFixed(6)} TON` : '—',
        avatarUrl: avatarById?.[fishId],
        feedDeltaSol: baseAmount / LAMPORTS_PER_SOL,
        feedPercent: feedPercentBps / 100,
      };
      
      await runTx(
        async () => {
          const res = await sendTransactionWithWallet({
            methodCall: (program) => program.methods
              .feedFish(new anchor.BN(feedingAmount))
              .accounts({
                ocean: oceanPda,
                fish: fishPda,
                vault: vaultPda,
                owner: publicKey,
                admin: adminPk,
                systemProgram: SystemProgram.programId,
              } as any),
            publicKey,
            signTransaction: signTransaction as any,
            signAllTransactions: signAllTransactions as any,
            useManualSign: false,
          });

          if (res) {
            const { API_BASE_URL } = await loadRuntimeConfig();
            const base = (API_BASE_URL || '').replace(/\/$/, '');
            const fishLamports = fishItem?.valueLamports || 0;
            let valueText = '';
            const getFishInfo = async (): Promise<boolean> => {
              const ac = new AbortController();
              const timeoutId = setTimeout(() => ac.abort(), 8000);
              try {
                const resp = await fetch(`${base}/api/v1/fish/${fishId}/info`, {
                  cache: 'no-store',
                  signal: ac.signal,
                });
                clearTimeout(timeoutId);
                if (resp.ok) {
                  const raw = await resp.json();
                  const data = raw?.data || raw;
                  const newVal = Number(data?.valueLamports ?? data?.valueLamportsStr ?? 0);
                  if (Number.isFinite(newVal) && newVal > fishLamports) {
                    valueText = `${(newVal / LAMPORTS_PER_SOL).toFixed(6)} TON`;
                    await reload();
                    return true;
                  }
                }
              } catch (e) {
                clearTimeout(timeoutId);
                console.error(`waitForFishInfo`, e);
              }
              return false;
            };
            await waitingForResult(getFishInfo);
            entity.valueText = valueText || `${((vLamports + feedingAmount) / LAMPORTS_PER_SOL).toFixed(6)} TON`;
          }
            
          return res;
        },
        t.feed.processing,
        {
          actionText: `${t.feed.actionPrefix} #${fishId}`,
          entity,
          successKind: 'feed',
        }
      );
      
    } catch (e) {
      // Ошибку показывает TxOverlay
    }
  };

  const reviveMinAmount = 0.01;
  const [reviveOpen, setReviveOpen] = React.useState(false);
  const [reviveFishId, setReviveFishId] = React.useState<number | null>(null);
  const [reviveAmount, setReviveAmount] = React.useState<number>(reviveMinAmount);
  const [reviveAmountRaw, setReviveAmountRaw] = React.useState<string>(reviveMinAmount.toFixed(2));
  const [reviveName, setReviveName] = React.useState<string>('');
  const [reviveNameError, setReviveNameError] = React.useState<string | null>(null);
  const [reviveAmountError, setReviveAmountError] = React.useState<string | null>(null);

  const [hideModalOpen, setHideModalOpen] = React.useState(false);
  const [hideFishId, setHideFishId] = React.useState<number | null>(null);

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

  const resetReviveState = () => {
    setReviveName('');
    setReviveAmount(reviveMinAmount);
    setReviveAmountRaw(reviveMinAmount.toFixed(2));
    setReviveNameError(null);
    setReviveAmountError(null);
  };

  const openRevive = (id: number) => {
    setReviveFishId(id);
    resetReviveState();
    setReviveOpen(true);
  };
  const closeRevive = () => {
    setReviveOpen(false);
    setReviveFishId(null);
    resetReviveState();
  };

  const openHideModal = (id: number) => { setHideFishId(id); setHideModalOpen(true); };
  const closeHideModal = () => { setHideModalOpen(false); setHideFishId(null); };

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
    setReviveAmountRaw(next.toFixed(4));
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

  const confirmRevive = async () => {
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
      if (reviveFishId == null) return;
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

      const oldFishPda = (() => {
        const raw = pdaById[reviveFishId];
        if (raw) return new PublicKey(raw);
        const owner = items.find((f) => f.id === reviveFishId)?.owner || publicKey.toBase58();
        return deriveFishPda(programId, new PublicKey(owner), reviveFishId);
      })();

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
              } as any),
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
                    await reload();
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
            fishId: reviveFishId,
            name,
            valueText: `${reviveAmount.toFixed(4)} TON`,
            avatarUrl: reviveAvatarUrl,
          },
        }
      );

      setReviveOpen(false);
      setReviveFishId(null);
      resetReviveState();
    } catch (e) {
    }
  };

  // No input/validation for revive modal per current UI

  // Derived preview data for revive modal
  const reviveAvatarUrl = React.useMemo(() => {
    if (reviveFishId == null) return undefined;
    const url = avatarById?.[reviveFishId];
    return url || 'https://fish-huting.pro/img/fish-image-7a550f.jpg';
  }, [reviveFishId, avatarById]);

  const confirmHideFish = async () => {
    if (hideFishId == null || !publicKey) return;

    await runTx(
      async () => {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const response = await fetchCompat(base, `/api/v1/wallet/${publicKey.toBase58()}/hidden-fish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fishId: hideFishId }),
        });
        if (!response.ok) throw new Error('Failed to hide fish');
        await reload();
      },
      t.hideFishModal?.processing ?? (language === 'ru' ? 'Скрываем жителя...' : 'Hiding fish...'),
      {
        showSuccessModal: false,
        showErrorModal: true,
      }
    );

    closeHideModal();
  };

  const renderFishGrid = () => {
    const sortedItems = [...items].sort((a: any, b: any) => {
      const va = Number(valueById[a.id] || 0);
      const vb = Number(valueById[b.id] || 0);
      return vb - va; // larger fish (by value) first
    });

    const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * pageSize;
    const pageItems = sortedItems.slice(from, from + pageSize);

    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 justify-items-center">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonFishCard key={`sk-my-${i}`} />
          ))}
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2 justify-items-center">
          {pageItems.map((f, _idx) => {
            const priceLamports = valueById[f.id] || 0;
            let price = '—';
            if (priceLamports > 0) {
              const rawSol = priceLamports / 1_000_000_000;
              const absSol = Math.abs(rawSol);
              // Для мелких значений (< 0.01 TON) показываем до 4 знаков,
              // чтобы минимальные депозиты не превращались визуально в 0.00 TON.
              const display = absSol >= 0.01 ? rawSol.toFixed(2) : rawSol.toFixed(2);
              price = `${display} TON`;
            }
            const isDead = !(priceLamports > 0);
            const earn24hLamports = !isDead ? Number(earnings24hById?.[f.id] || 0) : 0;
            const pda = pdaById[f.id];
            const avatarUrl = avatarById?.[f.id];
            return (
              <FishCardImage
                fishId={f.id}
                key={f.id}
                title={f.name || `Fish #${f.id}`}
                price={price}
                isDead={isDead}
                avatarUrl={avatarUrl}
                feedCostLamports={feedCostById[f.id]}
                feedBaseLamports={feedBaseById?.[f.id]}
                secondsUntilHunger={(() => {
                  const targetTs =
                    typeof f.lastFedAt === 'number' && f.lastFedAt > 0
                      ? f.lastFedAt + feedPeriodSec
                      : typeof f.canHuntAfter === 'number'
                        ? f.canHuntAfter
                        : null;
                  return targetTs != null
                    ? Math.max(0, targetTs - chainNowSec)
                    : f.secondsUntilHunger;
                })()}
                secondsUntilHunt={
                  typeof f.canHuntAfter === 'number' && f.canHuntAfter > 0
                    ? Math.max(0, f.canHuntAfter - chainNowSec)
                    : 0
                }
                canHuntAfterSec={f.canHuntAfter ?? undefined}
                onFeed={() => handleFeed(f.id)}
                onRevive={() => openRevive(f.id)}
                onHide={isDead ? () => openHideModal(f.id) : undefined}
                onOpen={(hunt?: boolean) => navigate(`/fish/${f.id}${hunt ? '?hunt=1' : ''}`)}
                earnings24hLamports={earn24hLamports}
                // @ts-ignore preserve design; debug pda as data attribute
                data-fish-pda={pda}
              />
            );
          })}
          <CreateFishTile key="create-fish-tile" />
        </div>
        {sortedItems.length > pageSize && (
          <Paginator
            page={safePage}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onChange={(p) => {
              setPage(p);
              fishCardListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}
      </>
    );
  };

  return (
    <>
      {windowWidth === 'sm' ? (
        <div className="flex flex-col gap-5 text-white" ref={fishCardListRef}>
          <MyFishHeader activeTab={mobileTab} onTabChange={setMobileTab} />
          {mobileTab === 'fish' ? (
            <>
              <HintCard type="myDwellers" />
              {renderFishGrid()}
              <TopOceanBlock />
              <OceanHappenings />
            </>
          ) : (
            <MyProfilePanel fishItems={items} loading={loading} />
          )}
        </div>
      ) : (
        <div className="flex sm:flex-col gap-8 sm:gap-10 text-white">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12 xl:gap-[80px]">
            <div className="order-2 lg:order-1 flex flex-col gap-6 sm:gap-8">
              <MyProfilePanel fishItems={items} loading={loading} />
              <TopOceanBlock />
              <OceanHappenings />
            </div>
            <div className="order-1 lg:order-2 flex flex-col gap-6 sm:gap-8" ref={fishCardListRef}>
              <MyFishHeader />
              <HintCard type="myDwellers" />
              {renderFishGrid()}
            </div>
          </div>
        </div>
      )}
      <FishActionModal
        open={reviveOpen}
        onClose={closeRevive}
        onConfirm={confirmRevive}
        confirmLabel={(t.reviveModal as any)?.confirm ?? 'Восстановить'}
        cancelLabel={(t.reviveModal as any)?.cancel ?? (t?.cancel ?? 'Отменить')}
        background="https://fish-huting.pro/img/ocean-background.png"
        hideCloseIcon
        hidePreview={false}
        hideNameValueRow
        imageSrc={reviveAvatarUrl}
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
      <ConfirmModal
        open={hideModalOpen}
        onClose={closeHideModal}
        onConfirm={confirmHideFish}
        question={(t.hideFishModal as any)?.question ?? 'Скрыть мертвого жителя навсегда?'}
        confirmLabel={(t.hideFishModal as any)?.confirm ?? 'Скрыть навсегда'}
        cancelLabel={(t.hideFishModal as any)?.cancel ?? (t?.cancel ?? 'Отменить')}
      />
    </>
  );
};

export default MyFishPage;
