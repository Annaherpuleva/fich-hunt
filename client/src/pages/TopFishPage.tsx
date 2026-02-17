import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LeaderboardListItem from '../features/fish/components/LeaderboardListItem';
import { useLanguage } from '../contexts/LanguageContext';
import OceanHappenings from '../features/fish/components/OceanHappenings';
import { useTopLeaderboard } from '../features/fish/hooks/useTopLeaderboard';
import Paginator from '../features/fish/components/Paginator';
import { useDebounce } from '../core/hooks/useDebounce';
// Removed MyProfilePanel from this page per spec

const SEARCH_DEBOUNCE_MS = 600;
const PAGE_PARAM = 'page';

const TopFishPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get(PAGE_PARAM);
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);

  const setPage = (next: number | ((prev: number) => number)) => {
    const value = typeof next === 'function' ? next(page) : next;
    const clamped = Math.max(1, value);
    navigate({search: clamped === 1 ? '' : `page=${clamped}`}, {replace: true});
  };

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const pageSize = 10;
  const { items, pagination, loading } = useTopLeaderboard(page, pageSize, debouncedQuery);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="text-white flex max-lg:flex-col gap-6 lg:gap-[40px]">
      <div className="grow">
        <div className="space-y-[24px] sm:space-y-[30px]">
          <div className="flex flex-col gap-[16px] sm:gap-[20px] w-full">
            <div className="text-white font-sf-pro-display font-bold text-[28px] leading-[1.02] tracking-[-0.03em] sm:text-[42px]">{t.topFish}</div>
            <div className="relative h-[42px] sm:h-10 w-full rounded-[12px] bg-[#404040]">
              <div
                className="absolute left-[6px] top-1/2 -translate-y-1/2 flex items-center justify-center rounded-[8px] bg-[#101014] px-[12px] py-[8px]"
                aria-hidden="true"
              >
                <img src="https://fish-huting.pro/img/icon-search.svg" width={18} height={18} alt="search" onError={(e)=>{const p=e.currentTarget; p.style.display='none';}} />
              </div>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder={(t as any).search ?? 'Поиск'}
                className="h-full w-full rounded-[12px] bg-transparent pl-[58px] pr-[14px] text-[14px] sm:text-[16px] text-[#EBEBEB] outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-[20px] sm:gap-[30px] w-full">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={`sk-${i}`} className="h-[140px] rounded-[24px] bg-[#1C1B20]/60 animate-pulse" />
              ))
            ) : (
              items.length ?
                items.map((it) => (
                  <LeaderboardListItem
                    key={it.fishId}
                    fishId={Number(it.fishId)}
                    rank={it.rank}
                    name={it.fishName || `Fish #${it.fishId}`}
                    valueText={it.valueText || '—'}
                    address={`${String(it.owner).slice(0,6)}...${String(it.owner).slice(-4)}`}
                    avatarUrl={it.avatarUrl}
                    socials={it.socials}
                    secondsUntilHunger={it.secondsUntilHunger}
                  />
                )) : (
                  <p className="text-center">{debouncedQuery.length ? t.noFishFound : t.noFishYet}</p>
                )
            )}
          </div>
          <Paginator
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            onChange={(p)=> setPage(p)}
          />
        </div>
      </div>
      <div className="w-full lg:w-[378px] lg:shrink-0">
        <OceanHappenings count={10} />
      </div>
    </div>
  );
};

export default TopFishPage;
