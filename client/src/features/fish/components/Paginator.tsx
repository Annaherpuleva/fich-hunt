import React from 'react';

type Props = {
  page: number;
  totalPages?: number | null; // если неизвестно — рисуем только стрелки и текущую
  onPrev: () => void;
  onNext: () => void;
  onChange?: (page: number) => void;
};

function buildPageItems(current: number, total: number | null): (number | string)[] {
  if (!total || total <= 1) return [current];
  const pages: (number | string)[] = [];
  const add = (v: number | string) => pages.push(v);
  const first = 1;
  const last = total;
  const windowStart = Math.max(first + 1, current - 1);
  const windowEnd = Math.min(last - 1, current + 1);

  add(first);
  if (windowStart > first + 1) add('…');
  for (let p = windowStart; p <= windowEnd; p++) add(p);
  if (windowEnd < last - 1) add('…');
  if (last > first) add(last);
  return Array.from(new Set(pages));
}

const Paginator: React.FC<Props> = ({ page, totalPages = null, onPrev, onNext, onChange }) => {
  const items = buildPageItems(page, totalPages);
  return (
    <div
      className="mt-[12px] w-full flex items-center justify-center gap-[32px] rounded-[24px] bg-[#1C1B20] px-[20px] py-2"
      style={{ boxShadow: '0px 4px 20px rgba(0,0,0,0.25)' }}
    >
      <button
        aria-label="prev"
        onClick={onPrev}
        className="h-[18px] w-[18px] flex items-center justify-center disabled:opacity-50"
        disabled={page <= 1}
      >
        <img src="/img/icon-arrow-left.svg" width={18} height={18} alt="prev" />
      </button>

      {items.map((it, idx) => {
        if (typeof it === 'string') {
          return (
            <div key={`dots-${idx}`} className="h-8 flex items-center text-white text-[14px] font-[700]">{it}</div>
          );
        }
        const isActive = it === page;
        return (
          <button
            key={`p-${it}`}
            type="button"
            onClick={() => onChange?.(it)}
            className={
              isActive
                ? 'h-8 min-w-8 px-2 rounded-[8px] text-[#0088FF] text-[14px] font-[700]'
                : 'h-8 min-w-8 px-2 rounded-[8px] text-white text-[14px] font-[700]'
            }
          >
            {it}
          </button>
        );
      })}

      <button
        aria-label="next"
        onClick={onNext}
        className="h-[18px] w-[18px] flex items-center justify-center disabled:opacity-50"
        disabled={!totalPages || page >= totalPages}
      >
        <img src="/img/icon-arrow-right.svg" width={18} height={18} alt="next" />
      </button>
    </div>
  );
};

export default Paginator;
