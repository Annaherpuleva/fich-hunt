import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { lamportsToSol, formatDurationHMS } from '../../../core/utils/format';
import { renderTextToken, replacePlaceholders } from "../../../helpers/render-text-token";
import { useBlockchainNowSec } from '../../../core/hooks/useBlockchainNowSec';
import { useTimersConfig } from '../../../core/hooks/useTimersConfig';
import { getMarkCostLamports } from '../utils/markCost';
import { getApiBaseUrlSync } from '../../../shared/api/baseUrl';

type Props = {
  name: string;
  valueLamports?: number;
  lastFedAtSec: number | null;
  canHuntAfterSec: number | null;
  variant?: 'img1' | 'img3';
  avatarFile: string | null;
  onMark?: () => void;
  onBite?: () => Promise<void>;
  onOpen?: () => void;
  biteGainSol?: number | null;
  markExpiresAt: number | null;
  markPlacedAt: number | null;
  isMarkOwner?: boolean;
  hunterCanHuntAfterSec: number | null;
  resetMark: () => void
};
type MarkTimer = {
  leftSec: number
  totalSec: number
  fillPercent: number
} | null;
type Timers = { 
  canHunt: { remain: number; elapsed: number; percent: number; isVictim: boolean } 
  hunterCanHunt: number 
  markTimer: MarkTimer
};

const FishHuntCard: React.FC<Props> = ({
  name,
  valueLamports = 0,
  lastFedAtSec,
  canHuntAfterSec,
  variant = 'img1',
  avatarFile,
  onMark,
  onBite,
  onOpen,
  biteGainSol,
  isMarkOwner,
  markExpiresAt,
  markPlacedAt,
  hunterCanHuntAfterSec,
  resetMark,
}) => {
  const [isSubmittingBite, setIsSubmittingBite] = useState(false);
  const { t } = useLanguage();
  const {
    feedPeriodSec,
    markPlacementWindowSec,
    highRateThresholdSec,
  } = useTimersConfig();
  const apiBaseUrl = getApiBaseUrlSync();
  const bg = avatarFile && avatarFile.length > 0
    ? `url(${apiBaseUrl}/static/avatars/thumbs/${avatarFile})`
    : (variant === 'img3' ? 'url(/img/fish-img-3-858cfd.png)' : 'url(/img/fish-img-1.png)');
  const animationUrl = useMemo(() => {
    if (!avatarFile) return null;
    return `${apiBaseUrl}/static/avatars/animations/${avatarFile}`.replace(/\.[^.?#]+(?=($|[?#]))/, '.webm');
  }, [avatarFile]);
  const price = useMemo(() => (valueLamports > 0 ? `${lamportsToSol(valueLamports, 2)} SOL` : '—'), [valueLamports]);

  const chainNowSec = useBlockchainNowSec();
  const timers: Timers | null = useMemo(() => {
    const nowSec = chainNowSec;
    const targetTs =
      typeof lastFedAtSec === 'number' && lastFedAtSec > 0
        ? lastFedAtSec + feedPeriodSec
        : (canHuntAfterSec || 0);
    const remain = Math.max(0, targetTs - nowSec);
    const elapsed = Math.max(0, Math.min(feedPeriodSec, feedPeriodSec - remain));

    const markInvalidatedByFeeding =
      typeof lastFedAtSec === 'number' &&
      typeof markPlacedAt === 'number' &&
      lastFedAtSec > 0 &&
      markPlacedAt > 0 &&
      lastFedAtSec >= markPlacedAt;

    let markTimer: MarkTimer = null;
    const hasMark =
      Boolean(!markInvalidatedByFeeding &&
        markExpiresAt && markExpiresAt > nowSec);

    if (hasMark && markPlacedAt && markExpiresAt) {
      const leftSec = Math.max(0, markExpiresAt - nowSec);
      const totalSec = Math.max(1, markExpiresAt - markPlacedAt);

      const fillPercent = Math.min(
        100,
        Math.max(
          0,
          Math.floor(
            ((totalSec - leftSec) / totalSec) * 100,
          ),
        ),
      );

      markTimer = {
        leftSec,
        totalSec,
        fillPercent,
      };
    }

    return {
      canHunt: {
        remain,
        elapsed,
        percent: Math.min(100, Math.floor((elapsed / feedPeriodSec) * 100)),
        isVictim: remain <= 0,
      },
      hunterCanHunt: Math.max(0, (hunterCanHuntAfterSec || 0) - nowSec),
      markTimer,
    };
  }, [chainNowSec, canHuntAfterSec, hunterCanHuntAfterSec, lastFedAtSec, markExpiresAt, markPlacedAt]);

  const victimCountdown = formatDurationHMS(timers?.canHunt.remain || 0); 
  const victimLabel = timers && timers.canHunt.remain > 0 ? `${t?.willBeVictimIn ?? 'Станет жертвой через'} ${victimCountdown}` : (t?.victim ?? 'Жертва');

  const markLabel = () => {
    if (!timers?.markTimer) return '';
    const duration = formatDurationHMS(timers?.markTimer?.leftSec as number);
    if (isMarkOwner) {
      const base = t?.myMarkExpiresIn ?? 'Вы поставили метку. Истекает';
      return `${base} ${duration}`;
    }
    const base = t?.blackMarkExpiresIn ?? 'Чёрная метка истечёт через';
    return `${base} ${duration}`;
  };

  // Compute mark cost per specifications and on-chain logic:
  // окно установки метки — только последние 24 часа до момента "жертвы",
  // при этом в последние 3 часа ставка выше. После наступления статуса "жертва"
  // новые метки ставить нельзя.
  const markCostLamports = useMemo(
    () =>
      getMarkCostLamports({
        valueLamports,
        lastFedAtSec,
        chainNowSec,
        feedPeriodSec,
        markPlacementWindowSec,
        highRateThresholdSec,
      }),
    [valueLamports, lastFedAtSec, chainNowSec, feedPeriodSec, markPlacementWindowSec, highRateThresholdSec]
  );
  const markCostSol = markCostLamports / 1_000_000_000;
  const canPlaceMark = markCostLamports > 0 && !timers?.canHunt.isVictim && !timers?.markTimer;
  const markButtonText = useMemo(() => {
    if (isMarkOwner && !canPlaceMark) {
      return t.markBurnedLabel;
    }
    const base = t.markButtonLabel;
    return markCostSol > 0 ? `${base} ${markCostSol.toFixed(4)} SOL` : base;
  }, [markCostSol, t]);
  
  const canBite = timers?.canHunt.isVictim && (!timers?.markTimer || !!isMarkOwner) && timers.hunterCanHunt <= 0;

  const biteButtonText = useMemo(() => {
    if (timers && timers.hunterCanHunt > 0) {
      return `${t.biteActionText} ${formatDurationHMS(timers.hunterCanHunt)}`;
    }
    if (biteGainSol == null || !Number.isFinite(biteGainSol) || biteGainSol <= 0) {
      return t.biteActionText;
    }
    return <>{t.biteActionText} <span style={{ whiteSpace: 'nowrap' }}>({replacePlaceholders(t.biteButtonLabel, { amount: Number(biteGainSol.toFixed(3)) })} SOL)</span></>;
    // return `${t.biteActionText} (${replacePlaceholders(t.biteButtonLabel, { amount: Number(biteGainSol.toFixed(3)) })} SOL)`;
  }, [biteGainSol, t.biteButtonLabel, timers?.hunterCanHunt]);

  const markExpired = !canPlaceMark && isMarkOwner && !timers?.markTimer && !timers?.canHunt.isVictim;

  return (
    <div className="relative bg-[#1C1B20] rounded-[24px] p-5 sm:p-[30px] w-full max-w-[396px]">
      {markExpired &&
        <button
          type="button"
          onClick={resetMark}
          className="absolute right-[12px] top-[12px] sm:right-[20px] sm:top-[20px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#FF4444] hover:bg-[#FF6666] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      }
      <div
        className="relative w-full h-[350px] sm:h-[300px] rounded-[24px] overflow-hidden"
        onClick={onOpen}
        role={onOpen ? 'button' : undefined}
        style={{ cursor: onOpen ? 'pointer' : 'default' }}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bg }} />
        {animationUrl && (
          <video
            className="absolute inset-0 h-full w-full object-cover pointer-events-none scale-[1.03]"
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          >
            <source src={animationUrl} type="video/webm" />
          </video>
        )}
        <div className="absolute left-4 top-4">
          <div className="backdrop-blur-[8px] bg-white/25 rounded-[8px] px-2 py-2 flex items-center">
            <span className="text-white text-[12px] font-sf-pro-display font-bold leading-[1.3] tracking-[-0.08em]">
              {timers?.canHunt.isVictim ? (t?.victim) : (t?.fishFullLabel)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-[14px] w-full flex flex-row flex-nowrap items-center justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <span className="block w-[150px] sm:w-[180px] truncate text-white text-[18px] sm:text-[20px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em] whitespace-nowrap">
            {name}
          </span>
        </div>
        <div className="flex-shrink-0 text-right sm:w-[131px]">
          <span className="text-white text-[20px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em] whitespace-nowrap">{price}</span>
        </div>
      </div>

      {markExpired ?
        // owner mark expired
        <div className="mt-[18px] flex w-full flex-col gap-[14px]">
          <div className="flex h-[40px] w-full items-center justify-center rounded-full bg-[#000]">
            <span className="text-[16px] leading-[1.02] tracking-[-0.03em] text-white">{t.markBurnedLabel}</span>
          </div>
          <span className="text-[14px] leading-[1.2] tracking-[-0.03em] text-[#DEDEDE]">
            {renderTextToken(t.markBurnedText)}
          </span>
        </div> :
        <>
          {/* victim status label */}
          <div
            className="mt-3 w-full h-[40px] rounded-full overflow-hidden"
            style={{ background: 'rgba(235, 23, 107, 0.15)' }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: timers ? `${timers.canHunt.percent}%` : undefined,
                  background: 'rgba(235, 23, 107, 0.3)',
                }}
              />
              <div className="text-white text-[16px] leading-[1.02] tracking-[-0.03em] px-[20px]">
                {victimLabel}
              </div>
            </div>
          </div>
          {/* mark status label */}
          {timers?.markTimer && (
            <div
              className="mt-3 w-full h-[40px] rounded-full overflow-hidden"
              style={{ background: 'rgba(0, 0, 0, 0.35)' }}
            >
              <div className="relative px-[20px] w-full h-full flex items-center justify-center gap-2">
                <div
                  className="absolute left-0 top-0 h-full rounded-full z-0"
                  style={{
                    width: `${timers?.markTimer?.fillPercent}%`,
                    background: '#000000',
                  }}
                />
                {!isMarkOwner && (
                  <span className="relative z-10 text-white text-[16px] leading-[1.02]">☠️</span>
                )}
                <span className="relative z-10 text-white text-[16px] leading-[1.02] tracking-[-0.03em]">
                  {markLabel()}
                </span>
              </div>
            </div>
          )}
          <div className="mt-[14px] w-full flex flex-col gap-2">
            {/* place mark button */}
            {!timers?.markTimer && <button
              className={`w-full h-[48px] rounded-full px-[30px] flex items-center justify-center ${isMarkOwner && !canPlaceMark ? 'bg-[#000]' : 'bg-[#0088FF] hover:bg-[#0a7ae4] disabled:opacity-60 disabled:cursor-not-allowed transition-colors'}`}
              disabled={!canPlaceMark}
              aria-disabled={!canPlaceMark}
              onClick={() => { if (canPlaceMark && onMark) onMark(); }}
            >
              <span className="text-white text-[16px] font-sf-pro-display font-bold leading-[1.2] tracking-[-0.04em]">{markButtonText}</span>
            </button>}
            <BiteButton 
              text={biteButtonText} 
              disabled={!canBite || isSubmittingBite} 
              onClick={async () => {
                if (canBite && onBite) {
                  setIsSubmittingBite(true);
                  await onBite();
                  setIsSubmittingBite(false);
                }
              }}
            />
          </div>
        </>
      }
    </div>
  );
};

const BiteButton: React.FC<{disabled: boolean; onClick: () => Promise<void>; text: string | React.JSX.Element}> = ({text, disabled, onClick}) => (
  <button
    className="w-full min-h-[48px] rounded-full px-[30px] py-[3px] bg-[#EB176B] hover:bg-[#f32b7a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
    disabled={disabled}
    aria-disabled={disabled}
    onClick={onClick}
  >
    <span className="text-white text-[16px] leading-[1.2] font-sf-pro-display font-bold tracking-[-0.04em]">
      {text}
    </span>
  </button>
);

export default FishHuntCard;
