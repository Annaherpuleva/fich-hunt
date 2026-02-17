import React from 'react';
import { formatDurationHMS } from '../../../core/utils/format';
import { FishEvent, FishEventType } from "../hooks/fish-events.types";
import { Translations } from "../../../locales/translations";
export interface FishEventRowProps {
  event: FishEvent;
  translations: Translations;
}

const lamportsToSolDisplay = (lamports: number) => {
  const sol = lamports / 1_000_000_000;
  if (!Number.isFinite(sol)) return '';
  const sign = sol > 0 ? '+' : sol < 0 ? '-' : '';

  if (!sol) return null;

  return <span className={`${sol > 0 ?'text-[#27C840]' : 'text-[#FFFFFF]'} text-[13px] sm:text-[16px] font-sf-pro-display font-bold leading-[1.2] tracking-[-0.03em] whitespace-nowrap`}>
    {sign}{Number(Math.abs(sol).toFixed(6))} SOL
  </span>;
};

const EventTypeToName = {
  [FishEventType.FishHunted]: 'goodHunt',
  [FishEventType.FishCreated]: 'newInOcean',
  [FishEventType.FishExited]: 'leftOcean',
  [FishEventType.FishFed]: 'FishFed',
  [FishEventType.FishResurrected]: 'FishResurrected',
  [FishEventType.HuntingMarkPlaced]: 'HuntingMarkPlaced',
};

const humanizeCode = (type: FishEventType, t: Translations) => {
  const dict = t.eventNames;
  if (dict[type]) return dict[type];
  return t.ocean[EventTypeToName[type]] || type.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const EventTypeToComment = {
  [FishEventType.FishCreated]: 'fishCreated',
  [FishEventType.FishResurrected]: 'Fish resurrected',
  [FishEventType.FishExited]: 'fishExited',
  [FishEventType.FishFed]: 'fishWasHungry',
  [FishEventType.FishHunted]: 'fishAtePrey',
  [FishEventType.HuntingMarkPlaced]: 'markPlaced',
};

const commentForEvent = (ev: FishEvent, t: Translations) => {
  if (ev.eventType === FishEventType.FishFed) {
    const remain = typeof ev._remainBeforeSec === 'number' ? ev._remainBeforeSec : null;
    const THRESHOLD_SEC = 60; // считаем "была голодна", если осталось меньше минуты или уже 0
    if (remain != null && remain <= THRESHOLD_SEC) {
      return t.fishWasHungry;
    }
    if (remain != null && remain > 0) {
      return `${t.hungerIn} ${formatDurationHMS(remain)}`;
    }
    return '';
  }
  return t[EventTypeToComment[ev.eventType]];
};

const lamportsDeltaForEvent = (ev: FishEvent): number => {
  const num = (v: any) => {
    if (v == null) return 0;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
    try {
      return Number(BigInt(String(v)));
    } catch {
      return 0;
    }
  };
  if (ev.eventType === FishEventType.FishHunted) {
    const exact = num(ev.payloadDec.receivedFromHuntValue);
    if (exact) return exact;
    const toHunter = num(ev.payloadDec.toHunter);
    if (toHunter) return toHunter;
    const toPoolValue = num(ev.payloadDec.toPoolValue);
    if (toPoolValue) return toPoolValue;
    return 0;
  }
  if (ev.eventType === FishEventType.FishFed) {
    // Show base feeding value from event (no extra fee subtraction).
    const base = num((ev.payloadDec as any).baseCost);
    if (base) return base;
    return num((ev.payloadDec as any).cost);
  }
  if (ev.eventType === FishEventType.FishCreated || ev.eventType === FishEventType.FishResurrected) {
    return num(ev.payloadDec.deposit);
  }
  if (ev.eventType === FishEventType.FishExited) {
    return num(ev.payloadDec.toPlayer);
  }
  if (ev.eventType === FishEventType.HuntingMarkPlaced) {
    return num(-ev.payloadDec.cost);
  }
  return 0;
};

export const FishEventRow: React.FC<FishEventRowProps> = ({ event, translations }) => {
  if (event.eventType === 'OceanModeChanged') return null;
  const leftTitle = humanizeCode(event.eventType, translations);
  const leftSubtitle = commentForEvent(event, translations);
  const rightTitle = event.eventType;
  const deltaLamports = lamportsDeltaForEvent(event);
  const rightValue = deltaLamports ? lamportsToSolDisplay(Number(deltaLamports)) : '';

  return (
    <div className="flex flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 w-full">
      <div className="flex flex-col gap-[4px] flex-1 min-w-[160px]">
        <span className="text-white text-[14px] sm:text-[16px] font-sf-pro-display font-bold leading-[1.1] tracking-[-0.03em]">
          {leftTitle}
        </span>
        {leftSubtitle && (
          <span className="text-[#DEDEDE] text-[12px] sm:text-[14px] font-sf-pro-display leading-[1.2] tracking-[-0.03em]">
            {leftSubtitle}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-[4px] min-w-[92px] text-right">
        <span className="text-[#808080] text-[10px] sm:text-[12px] font-sf-pro-display leading-[1.2] tracking-[-0.02em] uppercase w-full overflow-hidden text-ellipsis whitespace-nowrap">
          {rightTitle}
        </span>
        {rightValue}
      </div>
    </div>
  );
};

export default FishEventRow;
