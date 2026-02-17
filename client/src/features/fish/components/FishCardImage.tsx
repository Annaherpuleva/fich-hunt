import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatDurationHMS } from '../../../core/utils/format';
import FishActionModal from './FishActionModal';
import { renderTextToken } from '../../../helpers/render-text-token';
import { useTimersConfig } from "../../../core/hooks/useTimersConfig";
import { useBlockchainNowSec } from '../../../core/hooks/useBlockchainNowSec';
import { Link } from "react-router-dom";

export type FishCardProps = {
  fishId: number,
  title?: string;
  price?: string;
  isDead?: boolean;
  avatarUrl?: string;
  feedCostLamports?: number; // total to pay including 10% fee
  feedBaseLamports?: number; // amount without commission
  onFeed?: () => Promise<void> | void;
  onRevive?: () => Promise<void> | void;
  onHide?: () => Promise<void> | void; // hide dead fish permanently
  earnings24hLamports?: number;
  secondsUntilHunger: number;
  secondsUntilHunt: number;
  /** Unix timestamp (sec) when this fish can hunt again; null = can hunt now */
  canHuntAfterSec?: number | null;
  onOpen?: (hunt?: boolean) => void;
};

const FishCardImage: React.FC<FishCardProps> = ({
  fishId,
  title = 'Ocean Ronin 17',
  price = '0.94 SOL',
  isDead = false,
  avatarUrl,
  feedCostLamports,
  feedBaseLamports,
  onFeed,
  onRevive,
  onHide,
  earnings24hLamports,
  secondsUntilHunger,
  secondsUntilHunt,
  canHuntAfterSec = null,
  onOpen,
}) => {
  const { t } = useLanguage();
  const { feedPeriodSec } = useTimersConfig();
  const bg = avatarUrl && avatarUrl.length > 0
    ? `url(${avatarUrl})`
    : 'url(/img/fish-image-7a550f.jpg)';
  const animationUrl = useMemo(() => {
    if (!avatarUrl || !avatarUrl.includes('/static/avatars/thumbs/')) return null;
    const base = avatarUrl.replace('/static/avatars/thumbs/', '/static/avatars/animations/');
    // Заменяем расширение файла на .webm, сохраняя возможный query/hash
    return base.replace(/\.[^.?#]+(?=($|[?#]))/, '.webm');
  }, [avatarUrl]);
  const [animationLoaded, setAnimationLoaded] = useState<boolean>(false);
  const [showFeedConfirmModal, setShowFeedConfirmModal] = useState<boolean>(false);
  const [isFeedSubmitting, setIsFeedSubmitting] = useState<boolean>(false);

  const openFeedConfirmModal = () => setShowFeedConfirmModal(true);
  const closeFeedConfirmModal = () => setShowFeedConfirmModal(false);

  const confirmFeed = async () => {
    setIsFeedSubmitting(true);
    closeFeedConfirmModal();
    try {
      if (onFeed) {
        await onFeed();
      }
    } finally {
      setIsFeedSubmitting(false);
    }
  };

  useEffect(() => {
    // При смене аватара/анимации снова показываем скелетон, пока новое видео не загрузится
    setAnimationLoaded(false);
  }, [animationUrl]);
  
  const feedText = useMemo(() => {
    const lamports = (() => {
      if (typeof feedBaseLamports === 'number' && isFinite(feedBaseLamports) && feedBaseLamports > 0) {
        return feedBaseLamports;
      }
      if (typeof feedCostLamports === 'number' && isFinite(feedCostLamports) && feedCostLamports > 0) {
        return feedCostLamports;
      }
      return null;
    })();
    if (lamports && lamports > 0) {
      const sol = lamports / 1_000_000_000;
      return `${t?.feedButtonLabel ?? 'Покормить'}: ${Number(sol.toFixed(4))} SOL`;
    }
    return t?.feedButtonLabel ?? 'Покормить';
  }, [feedBaseLamports, feedCostLamports, t]);

  const earningLamportsSafe = (typeof earnings24hLamports === 'number' && Number.isFinite(earnings24hLamports))
    ? earnings24hLamports
    : 0;
  const earningSol24h = earningLamportsSafe / 1_000_000_000;
  const earningBadgeText = isDead
    ? (t.deadKilled)
    : earningLamportsSafe === 0
      ? null
      : `${earningSol24h >= 0 ? '+' : '-'}${Number(Math.abs(earningSol24h).toFixed(6))} SOL ${t?.over24hLabel ?? 'за 24 часа'}`;
  return (
    <div className="relative flex w-full max-w-[396px] flex-col rounded-[24px] bg-[#1C1B20] p-6 sm:p-[30px]">
      {isDead && onHide && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onHide();
          }}
          className="absolute right-[12px] top-[12px] sm:right-[20px] sm:top-[20px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#FF4444] hover:bg-[#FF6666] transition-colors"
          aria-label={t?.hideFishLabel ?? 'Скрыть жителя'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
      <Link
        to={`/fish/${fishId}`}
        className="relative h-[350px] w-full cursor-pointer overflow-hidden rounded-[24px] sm:h-[300px]"
        role="button"
        aria-label="Открыть раздел охоты"
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bg }} />
        {animationUrl && !animationLoaded && (
          <div className="absolute inset-0 bg-[#2A2A2F] animate-pulse" />
        )}
        {animationUrl && (
          <video
            className="absolute inset-0 h-full w-full object-cover pointer-events-none scale-[1.03]"
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setAnimationLoaded(true)}
            onError={(e) => {
              // скрываем видео, если анимация недоступна
              e.currentTarget.style.display = 'none';
              setAnimationLoaded(false);
            }}
          >
            <source src={animationUrl} type="video/webm" />
          </video>
        )}
        {(isDead || earningBadgeText) && (
          <div className="absolute left-4 top-4">
            <div className="backdrop-blur-[8px] bg-white/25 rounded-[8px] px-2 py-2 flex items-center">
              <span className="text-white text-[12px] font-sf-pro-display font-bold leading-[1.3] tracking-[-0.08em]">
                {earningBadgeText ?? ''}
              </span>
            </div>
          </div>
        )}
      </Link>
      <div className="mt-[14px] flex w-full flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="w-[150px] sm:w-[180px] block truncate text-[18px] leading-[1.1] tracking-[-0.04em] text-white sm:text-[20px]">{title}</span>
        </div>
        <div className="text-right">
          <span className="text-[18px] leading-[1.1] tracking-[-0.04em] text-white sm:text-[20px]">{isDead ? '0.00 SOL' : price}</span>
        </div>
      </div>
      {isDead ? (
        <div className="mt-3 h-[40px] w-full rounded-full bg-[rgba(235,23,107,0.15)]">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#404040]">
            <span className="text-[16px] leading-[1.02] tracking-[-0.03em] text-white">{t.deadKilled}</span>
          </div>
        </div>
      ) : (
        <HungerBar secondsUntilHunger={secondsUntilHunger} feedingCooldownSec={feedPeriodSec} />
      )}
      {isDead && (
        <div className="mt-[18px] flex w-full flex-col gap-[14px]">
          <span className="text-[14px] leading-[1.2] tracking-[-0.03em] text-[#DEDEDE]">
            {t.deadInfo}
          </span>
        </div>
      )}
      <div className="mt-[14px] flex w-full flex-col gap-2">
        {isDead ? (
          <button
            className="flex h-[48px] w-full items-center justify-center rounded-full bg-[#0088FF] hover:bg-[#0a7ae4] px-[30px] py-[14px] font-sf-pro-display text-[16px] font-bold tracking-[-0.04em] text-white disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            onClick={() => onRevive && onRevive()}
            disabled={!onRevive}
            aria-disabled={!onRevive}
          >
            {t?.reviveLabel ?? 'Возродить'}
          </button>
        ) : (
          <>
            <button
              className="w-full h-[48px] font-bold rounded-full bg-[#0088FF] hover:bg-[#0a7ae4] px-[30px] font-sf-pro-display text-[15px] tracking-[-0.04em] text-white transition-colors flex items-center justify-center"
              onClick={openFeedConfirmModal}
            >
              {feedText}
            </button>
            <HuntBar secondsUntilHunt={secondsUntilHunt} canHuntAfterSec={canHuntAfterSec} onOpen={onOpen} />
          </>
        )}

        {/* Feed confirm modal */}
        <FishActionModal
          open={showFeedConfirmModal}
          onClose={closeFeedConfirmModal}
          onConfirm={confirmFeed}
          confirmDisabled={isFeedSubmitting}
          confirmLabel={`${t.feed.confirmModal.confirmLabel}: ${((feedBaseLamports || 0) / 1_000_000_000).toFixed(4)} SOL`}
          cancelLabel={t.feed.confirmModal.cancelLabel}
          background="/img/ocean-background.png"
          imageSrc={avatarUrl || '/img/fish-image-7a550f.jpg'}
          fishName={title}
          fishValueText={price}
        >
          <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em]">
            {renderTextToken(t.feed.confirmModal.text, { amount: ((feedBaseLamports || 0) / 1_000_000_000).toFixed(2) })}
          </div>
        </FishActionModal>
      </div>
    </div>
  );
};

export default FishCardImage;

const HungerBar: React.FC<{ secondsUntilHunger: number; feedingCooldownSec: number }> = ({ secondsUntilHunger, feedingCooldownSec }) => {
  const { t } = useLanguage();
  const chainNowSec = useBlockchainNowSec();
  const chainNowSecRef = useRef(chainNowSec);
  chainNowSecRef.current = chainNowSec;
  const targetTsRef = useRef<number>(0);

  useEffect(() => {
    if (secondsUntilHunger > 0) targetTsRef.current = chainNowSecRef.current + secondsUntilHunger;
  }, [secondsUntilHunger]);

  const remain = secondsUntilHunger <= 0 ? 0 : Math.max(0, targetTsRef.current - chainNowSec);
  const percent = Math.min(100, Math.floor(((feedingCooldownSec - remain) / feedingCooldownSec) * 100));
  const fillPercent = Math.max(0, Math.min(100, 100 - percent));
  const label = formatDurationHMS(remain);

  return (
    <div className="mt-3 h-[40px] w-full overflow-hidden rounded-full bg-[rgba(235,23,107,0.15)]">
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${fillPercent}%`,
            background: 'rgba(235, 23, 107, 0.3)',
          }}
        />
        <div className="relative z-[1] text-[15px] leading-[1.02] tracking-[-0.03em] text-white sm:text-[16px]">{remain > 0 ? `${t?.hungerIn ?? 'Голод через'} ${label}` : t?.fishHungry ?? 'Житель голоден'}</div>
      </div>
    </div>
  );
};

const HuntBar: React.FC<{
  secondsUntilHunt: number;
  canHuntAfterSec?: number | null;
  onOpen?: (hunt?: boolean) => void;
}> = ({ canHuntAfterSec, onOpen }) => {
  const { t } = useLanguage();
  const chainNowSec = useBlockchainNowSec();
  const [showTooltip, setShowTooltip] = useState(false);
  const remain = useMemo(() => {
    if (canHuntAfterSec == null || canHuntAfterSec <= 0) return 0;
    return Math.max(0, canHuntAfterSec - chainNowSec);
  }, [canHuntAfterSec, chainNowSec]);
  const disabled = remain > 0;
  const label = disabled ? `${t.huntButtonLabel} ${formatDurationHMS(remain)}` : t.huntButtonLabel;

  return (
    <div className="relative inline-block w-full">
      <button
        className="w-full h-[48px] font-bold rounded-full bg-[#EB176B] hover:bg-[#f32b7a] px-[30px] font-sf-pro-display text-[15px] tracking-[-0.04em] text-white disabled:cursor-not-allowed disabled:opacity-60 transition-colors flex items-center justify-center"
        disabled={disabled}
        aria-disabled={disabled}
        onClick={() => { if (!disabled && onOpen) onOpen(true); }}
      >
        {label}
      </button>
      {disabled && (
        <div
          className="absolute inset-0 cursor-not-allowed rounded-full"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-hidden
        />
      )}
      {showTooltip && disabled && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-[260px] -translate-x-1/2 rounded-lg bg-black/90 px-3 py-2 text-xs text-white shadow-lg">
          {t.cooldownTooltipText}
        </div>
      )}
    </div>
  );
};
