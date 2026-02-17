import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOceanEvents } from '../ocean/hooks/useOceanEvents';
import { useWallet } from '../../wallet/tonWallet';
import { useNavigate } from 'react-router-dom';

export type EventRow = {
  bg: string; // background image url
  title: string; // e.g., Soul Killer 33
  subtitle: string; // e.g., Удачная охота / Новый в океане / Покинул океан
  shareLabel: string; // Ваша доля
  shareValue: string; // +0,0132 TON
};

const IconBadge: React.FC<{ bg: string; onClick?: () => void }> = ({ bg, onClick }) => (
  <div
    className="h-[54px] w-[54px] rounded-[8px] bg-cover bg-center sm:h-[60px] sm:w-[60px]"
    style={{ backgroundImage: `url(${bg})`, cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
  />
);

export const EventRowView: React.FC<{ e: EventRow; onOpen?: () => void; showShare: boolean }> = ({ e, onOpen, showShare }) => (
  <div className="flex w-full items-center gap-[12px] sm:gap-[16px]">
    <IconBadge bg={e.bg} onClick={onOpen} />
    <div className="flex flex-1 min-w-0 flex-col justify-center gap-[6px]">
      <div className="truncate font-sf-pro-display text-[16px] font-bold leading-[1.2] text-white sm:text-[18px]">
        {e.title}
      </div>
      <div className="truncate font-sf-pro-display text-[12px] font-bold leading-[1.2] text-[#DEDEDE] sm:text-[14px]">
        {e.subtitle}
      </div>
    </div>
    {showShare && (
      <div className="flex w-[100px] flex-col items-end gap-[8px] sm:w-[115px]">
        <div className="truncate font-sf-pro-display text-[12px] font-bold leading-[1.2] text-[#595959] sm:text-[14px]">
          {e.shareLabel}
        </div>
        <div className="truncate font-sf-pro-display text-[14px] font-bold leading-[1.2] text-[#27C840] sm:text-[16px]">
          {e.shareValue}
        </div>
      </div>
    )}
  </div>
);

const OceanHappenings: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const { t } = useLanguage();
  const { publicKey, connected, connecting } = useWallet();
  const wallet = connected && publicKey ? publicKey.toBase58() : null;
  // Если не connected — гостевой запрос. Если connected — ждём publicKey и идём только с кошельком.
  const { loading, items } = useOceanEvents(wallet, Math.max(count, 10), connected, connecting);
  const navigate = useNavigate();
  const showShare = Boolean(wallet);

  return (
    <div className="w-full rounded-2xl border border-[#1E1E1E] bg-[#1C1B20] p-5 sm:p-6">
      <div className="font-sf-pro-display text-[21px] font-bold leading-[1.1] tracking-[-0.01em] text-white sm:text-[24px]">
        {t.ocean?.happenings ?? 'What is happening in the ocean'}
      </div>
      <div className="mt-[16px] flex flex-col gap-[12px] sm:mt-[24px]">
        {loading && (
          <>
            {Array.from({ length: Math.max(3, count) }).map((_, i) => (
              <div key={`sk-ev-${i}`} className="flex w-full items-center gap-[12px] sm:gap-[16px]">
                <div className="h-[54px] w-[54px] rounded-lg bg-[#2A2A2E] animate-pulse sm:h-[60px] sm:w-[60px]" />
                <div className="flex flex-1 flex-col gap-[7px]">
                  <div className="h-[18px] w-[160px] rounded-md bg-[#2A2A2E] animate-pulse sm:w-[180px]" />
                  <div className="h-[14px] w-[120px] rounded-md bg-[#2A2A2E] animate-pulse sm:w-[140px]" />
                </div>
                {showShare && (
                  <div className="flex w-[100px] flex-col items-end gap-[8px] sm:w-[115px]">
                    <div className="h-[14px] w-[80px] rounded-md bg-[#2A2A2E] animate-pulse" />
                    <div className="h-[16px] w-[100px] rounded-md bg-[#2A2A2E] animate-pulse sm:w-[110px]" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        {!loading && items.length === 0 && (
          <div className="font-sf-pro-display text-[14px] font-bold text-[#DEDEDE]">
            {(t.ocean as any)?.nothingHappened ?? 'В океане ничего не произошло'}
          </div>
        )}
        {!loading && items.slice(0, count).map((ev: any, idx: number) => {
          const bg = (ev as any).hunter?.avatarUrl || ev.avatarUrl || '/img/ocean-event-1.png';
          const code = (ev as any).eventCode || ev.eventType;
          const subtitle = (() => {
            switch (code) {
              case 'FishHunted': return t.ocean?.goodHunt ?? 'Successful hunt';
              case 'FishCreated': return t.ocean?.newInOcean ?? 'New in the ocean';
              case 'FishExited': return t.ocean?.leftOcean ?? 'Left the ocean';
              case 'FishResurrected': return (t.eventNames as any)?.FishResurrected || 'Fish resurrected';
              default: return (t.eventNames as any)?.[code] || (t.eventNames as any)?.Unknown || code;
            }
          })();
          const shareSol = (ev.yourShareLamports || 0) / 1_000_000_000;
          const shareValue = shareSol > 0 ? `+${shareSol.toFixed(6)} TON` : '+0.000000 TON';
          const safeTitle = String(ev.title || '').replace(/\s*\n+\s*/g, ' ').trim();
          const row: EventRow = { bg, title: safeTitle || '—', subtitle, shareLabel: t.ocean?.yourShare ?? 'Your share', shareValue };
          const targetId: number | undefined = (ev as any).hunter?.id || (ev as any).prey?.id || (ev as any).fishIdForAvatar;
          const onOpen = typeof targetId === 'number' && Number.isFinite(targetId) ? () => navigate(`/fish/${targetId}`) : undefined;
          return <EventRowView key={ev.id || idx} e={row} onOpen={onOpen} showShare={showShare} />;
        })}
      </div>
      <div className="mt-[20px] sm:mt-[24px]">
        <button
          type="button"
          className="flex w-full h-[48px] items-center justify-center gap-2 rounded-full bg-[#0088FF] px-[30px] font-sf-pro-display text-[16px] font-bold leading-[1.02] tracking-[-0.04em] text-white transition hover:bg-[#0a7ce0]"
          onClick={() => navigate('/ocean/events')}
        >
          {t.showMore}
        </button>
      </div>
    </div>
  );
};

export default OceanHappenings;
