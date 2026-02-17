import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useFishEvents } from '../features/fish/hooks/useFishEvents';
import FishEventRow from '../features/fish/components/FishEventRow';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { fetchCompat } from '../shared/api/compat';
import TopOceanBlock from '../features/fish/components/TopOceanBlock';
import OceanHappenings from '../features/fish/components/OceanHappenings';
import Paginator from '../features/fish/components/Paginator';
import { ArrowLeft } from 'lucide-react';

const skeletonItems = Array.from({ length: 8 });
const PAGE_SIZE = 25;

const FishEventsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fishId = Number(id);
  const isValidFish = Number.isFinite(fishId);
  const { events, loading } = useFishEvents(isValidFish ? fishId : null, { limit: 500 });
  const [fishName, setFishName] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isValidFish) return;
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const response = await fetchCompat(base, `/api/v1/fish/${fishId}/info`);
        if (!response.ok) return;
        const data = await response.json();
        const payload = data?.data ?? data;
        if (!cancelled) {
          const name = payload?.fishName;
          if (typeof name === 'string' && name.trim().length > 0) {
            setFishName(name);
          }
        }
      } catch {
        // ignore errors silently for this view
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fishId, isValidFish]);

  useEffect(() => {
    setPage(1);
  }, [fishId, events.length]);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return events.slice(start, end);
  }, [events, page]);

  const heading = fishName
    ? `${t.fishEventsTitle ?? 'История событий'} — ${fishName}`
    : `${t.fishEventsTitle ?? 'История событий'}${isValidFish ? ` #${fishId}` : ''}`;

  return (
    <div className="grid grid-cols-1 gap-6 text-white lg:grid-cols-[minmax(0,1fr)_378px] lg:gap-[80px]">
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-[6px] self-start text-[14px] sm:text-[15px] font-sf-pro-display text-[#b8b8b9] hover:text-white transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {t.backButtonLabel}
        </button>

        <div>
          <h1 className="text-[26px] sm:text-[32px] font-sf-pro-display font-bold leading-[1.1] tracking-[-0.02em]">
            {heading}
          </h1>
          <p className="text-white/60 text-[14px] sm:text-[15px] mt-2">
            {t.fishEventsSubtitle ?? 'Полная история действий выбранного жителя.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {loading && (
            <>
              {skeletonItems.map((_, idx) => (
                <div
                  key={`sk-fe-${idx}`}
                  className="flex flex-row items-start sm:items-center justify-between gap-3 rounded-[16px] bg-[#1C1B20] border border-[#1E1E1E] p-4"
                >
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="animate-pulse" style={{ width: '60%', height: 16, borderRadius: 6, background: '#2A2A2E' }} />
                    <div className="animate-pulse" style={{ width: '45%', height: 14, borderRadius: 6, background: '#2A2A2E' }} />
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="animate-pulse" style={{ width: 80, height: 12, borderRadius: 6, background: '#2A2A2E' }} />
                    <div className="animate-pulse" style={{ width: 70, height: 14, borderRadius: 6, background: '#2A2A2E' }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && !events.length && (
            <div className="text-white/60 text-[14px] sm:text-[15px] rounded-[16px] border border-dashed border-[#2A2A2E] bg-[#1C1B20] p-5">
              {t.fishEventsEmpty ?? 'События отсутствуют'}
            </div>
          )}

          {!loading &&
            pageEvents.map((ev, idx) => (
              <div
                key={`${ev?.id ?? idx}`}
                className="rounded-[16px] border border-[#1E1E1E] bg-[#1C1B20] p-4"
              >
                <FishEventRow event={ev} translations={t} />
              </div>
            ))}
        </div>

        {!loading && events.length > 0 && (
          <Paginator
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            onChange={(next) => setPage(next)}
          />
        )}
      </div>

      <div className="hidden lg:flex lg:flex-col lg:gap-6">
        <TopOceanBlock limit={3} />
        <OceanHappenings count={5} />
      </div>
    </div>
  );
};

export default FishEventsPage;
