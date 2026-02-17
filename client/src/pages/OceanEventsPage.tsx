import React, { useMemo, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { EnrichedOceanEvent, useOceanEvents } from '../features/ocean/hooks/useOceanEvents';
import TopOceanBlock from '../features/fish/components/TopOceanBlock';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../wallet/tonWallet';
import Paginator from '../features/fish/components/Paginator';

const Row: React.FC<{ ev: EnrichedOceanEvent; title: string; subtitle: string; avatar?: string; shareLamports: number; showShare: boolean }>=({ ev, title, subtitle, avatar, shareLamports, showShare })=>{
  const { t } = useLanguage();
  const shareSol = (shareLamports || 0) / 1_000_000_000;
  const shareValue = shareSol > 0 ? `+${shareSol.toFixed(6)} TON` : '+0.000000 TON';

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-[16px] border border-[#1E1E1E] bg-[#1C1B20]">
      <div className="max-sm:hidden flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {ev.hunter && ev.prey ? (
          <div className="flex items-center gap-2 p-0 m-0 bg-transparent border-none">
            <Link to={`/fish/${ev.hunter.id}`} className="rounded-[8px] w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-cover bg-center" style={{ backgroundImage: `url(${ev.hunter.avatarUrl})` }} />
            <div className="text-[#8A8A8A] text-[18px] sm:text-[20px]">→</div>
            <Link to={`/fish/${ev.prey.id}`} className="rounded-[8px] w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-cover bg-center" style={{ backgroundImage: `url(${ev.prey.avatarUrl})` }} />
          </div>
        ) : (
          <Link
            to={`/fish/${ev.fishIdForAvatar}`}
            className="rounded-[8px] w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-cover bg-center p-0 m-0 bg-transparent border-none"
            style={{ backgroundImage: `url(${avatar || '/img/ocean-event-1.png'})` }}
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="text-white text-[16px] sm:text-[18px] font-sf-pro-display font-bold leading-[1.2] break-words">{title}</div>
          <div className="text-[#DEDEDE] text-[13px] sm:text-[14px] font-sf-pro-display font-bold leading-[1.2] break-words">{subtitle}</div>
        </div>
      </div>
      {ev.hunter && ev.prey ? <div className={`sm:hidden flex-col gap-1 flex-1 min-w-0`}>
        <div
          className="flex items-center gap-2 p-0 m-0 bg-transparent border-none"
        >
          <Link to={`/fish/${ev.hunter.id}`} className="flex flex-col items-start gap-1">
            <div className="rounded-[8px] w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-cover bg-center" style={{ backgroundImage: `url(${ev.hunter.avatarUrl})` }} />
            <div className="text-white text-[16px] sm:text-[18px] font-sf-pro-display font-bold leading-[1.2] break-words">{ev.hunter.name}</div>
          </Link>
          <div className="text-[#8A8A8A] text-[18px] sm:text-[20px]">→</div>
          <Link to={`/fish/${ev.prey.id}`} className="flex flex-col items-start gap-1">
            <div className="rounded-[8px] w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-cover bg-center" style={{ backgroundImage: `url(${ev.prey.avatarUrl})` }} />
            <div className="text-white text-[16px] sm:text-[18px] font-sf-pro-display font-bold leading-[1.2] break-words">{ev.prey.name}</div>
          </Link>
        </div>
        <div className="text-[#DEDEDE] text-[13px] sm:text-[14px] font-sf-pro-display font-bold leading-[1.2] break-words">{subtitle}</div>
      </div> : 
        <div className={`sm:hidden flex items-center gap-3 sm:gap-4 flex-1 min-w-0`}>
          <Link
            to={`/fish/${ev.fishIdForAvatar}`}
            className="rounded-[8px] w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] bg-cover bg-center p-0 m-0 bg-transparent border-none"
            style={{ backgroundImage: `url(${avatar || '/img/ocean-event-1.png'})` }}
          />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-white text-[16px] sm:text-[18px] font-sf-pro-display font-bold leading-[1.2] break-words">{title}</div>
            <div className="text-[#DEDEDE] text-[13px] sm:text-[14px] font-sf-pro-display font-bold leading-[1.2] break-words">{subtitle}</div>
          </div>
        </div>}
      {showShare && (
        <div className="flex flex-col items-end gap-[4px] shrink-0">
          <div className="text-[#595959] text-[12px] sm:text-[14px] font-sf-pro-display font-bold leading-[1.2] text-right">{t.ocean?.yourShare ?? 'Your share'}</div>
          <div className="text-[#27C840] text-[15px] sm:text-[16px] font-sf-pro-display font-bold leading-[1.2]">{shareValue}</div>
        </div>
      )}
    </div>
  );
};

const PAGE_PARAM = 'page';

const OceanEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { publicKey, connected, connecting } = useWallet();
  const wallet = connected && publicKey ? publicKey.toBase58() : null;
  const { loading, items } = useOceanEvents(wallet, 200, connected, connecting);
  const showShare = Boolean(wallet);
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get(PAGE_PARAM);
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const setPage = (next: number | ((prev: number) => number)) => {
    const value = typeof next === 'function' ? next(page) : next;
    const clamped = Math.max(1, value);
    navigate({search: clamped === 1 ? '' : `page=${clamped}`}, {replace: true});
  };

  const PER_PAGE = 20;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const totalPages = useMemo(() => Math.max(0, Math.ceil(items.length / PER_PAGE)), [items.length]);
  useEffect(() => {
    if (totalPages && page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);
  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return items.slice(start, start + PER_PAGE);
  }, [items, page]);

  const subtitleOf = (eventCode: string) => {
    // map raw event code -> translated label at render time
    switch (eventCode) {
      case 'FishHunted': return t.ocean?.goodHunt ?? 'Successful hunt';
      case 'FishCreated': return t.ocean?.newInOcean ?? 'New in the ocean';
      case 'FishExited': return t.ocean?.leftOcean ?? 'Left the ocean';
      case 'FishResurrected': return (t.eventNames as any)?.FishResurrected || 'Fish resurrected';
      default: return (t.eventNames as any)?.[eventCode] || (t.eventNames as any)?.Unknown || eventCode;
    }
  };

  return (
    <div className="text-white flex max-lg:flex-col gap-[30px] lg:gap-[40px] w-full">
      <div className="grow">
        <div className="text-white font-sf-pro-display font-bold text-[24px] sm:text-[28px] leading-[1.1] tracking-[-0.01em]">{t.ocean?.happenings ?? 'What is happening in the ocean'}</div>
        <div className="mt-[20px] sm:mt-[24px] flex flex-col gap-3 w-full">
          {loading && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`sk-oe-${i}`} className="flex items-center justify-between gap-4 p-4 rounded-[16px] border border-[#1E1E1E] bg-[#1C1B20]">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="animate-pulse" style={{ width: 48, height: 48, borderRadius: 8, background: '#2A2A2E' }} />
                    <div className="flex flex-col gap-2">
                      <div className="animate-pulse" style={{ width: 200, height: 18, borderRadius: 6, background: '#2A2A2E' }} />
                      <div className="animate-pulse" style={{ width: 160, height: 14, borderRadius: 6, background: '#2A2A2E' }} />
                    </div>
                  </div>
                  {showShare && (
                    <div className="flex flex-col items-end gap-[6px]">
                      <div className="animate-pulse" style={{ width: 92, height: 14, borderRadius: 6, background: '#2A2A2E' }} />
                      <div className="animate-pulse" style={{ width: 72, height: 16, borderRadius: 6, background: '#2A2A2E' }} />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          {!loading && items.length === 0 && (
            <div className="text-[#DEDEDE] text-[14px] font-sf-pro-display font-bold">{(t.ocean as any)?.nothingHappened ?? 'В океане ничего не произошло'}</div>
          )}
          {!loading && pageItems.map(ev => {
            const eventCode = (ev as any).eventCode || ev.eventType;
            const title = ev.title;
            const subtitle = subtitleOf(eventCode);
            const avatar = ev.avatarUrl;
            const shareLamports = ev.yourShareLamports;
            return (
              <Row
                key={ev.id}
                ev={ev}
                title={title}
                subtitle={subtitle}
                avatar={avatar}
                shareLamports={shareLamports}
                showShare={showShare}
              />
            );
          })}
          {!loading && items.length > PER_PAGE && (
            <Paginator
              page={page}
              totalPages={totalPages}
              onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              onChange={(next) => setPage(next)}
            />
          )}
        </div>
      </div>

      <div className="w-full lg:w-[378px] lg:flex-shrink-0">
        <TopOceanBlock />
      </div>
    </div>
  );
};

export default OceanEventsPage;
