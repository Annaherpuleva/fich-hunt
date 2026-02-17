import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatDurationHMS } from '../../../core/utils/format';
import { useTimersConfig } from '../../../core/hooks/useTimersConfig';
import { useBlockchainNowSec } from '../../../core/hooks/useBlockchainNowSec';

export type HungerBarProps = {
  /** Оставшиеся секунды до голода (используется, если не передан targetTs) */
  secondsUntilHunger: number | null;
  targetTs?: number;
};

export const HungerBar: React.FC<HungerBarProps> = ({ secondsUntilHunger, targetTs: targetTsProp }) => {
  const { t } = useLanguage();
  const { feedPeriodSec } = useTimersConfig();
  const chainNowSec = useBlockchainNowSec();
  const chainNowSecRef = useRef(chainNowSec);
  chainNowSecRef.current = chainNowSec;
  const targetTsRef = useRef<number>(typeof targetTsProp === 'number' && targetTsProp > 0 ? targetTsProp : chainNowSecRef.current + (secondsUntilHunger || 0));

  // Фиксируем targetTs только при смене пропов, чтобы тик шёл от одного chainNowSec
  useEffect(() => {
    if (typeof targetTsProp === 'number' && targetTsProp > 0) {
      targetTsRef.current = targetTsProp;
      return;
    }
    targetTsRef.current = chainNowSecRef.current + (secondsUntilHunger || 0);
  }, [targetTsProp, secondsUntilHunger]);
  
  const targetTs = typeof targetTsProp === 'number' && targetTsProp > 0 ? targetTsProp : targetTsRef.current;
  const remain = Math.max(0, targetTs - chainNowSec);
  const victimCountdown = formatDurationHMS(remain);
  const victimLabel = remain > 0 ? `${t?.willBeVictimIn ?? 'Станет жертвой через'} ${victimCountdown}` : (t?.victim ?? 'Жертва');
  const percentElapsed = remain !== null ? (feedPeriodSec - remain) / feedPeriodSec : 0;
  const fillPercent = Math.max(0, Math.min(100, 100 - percentElapsed * 100));

  return (
    <div className="relative h-[26px] sm:h-[32px] w-full rounded-full" style={{ background: 'rgba(235, 23, 107, 0.15)' }}>
      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${fillPercent}%`, background: 'rgba(235, 23, 107, 0.3)' }} />
      <div className="absolute inset-0 flex items-center justify-center px-2">
        <div className="text-white text-[13px] sm:text-[17px] font-sf-pro-display font-medium leading-[1.02] tracking-[-0.03em] whitespace-nowrap">{victimLabel}</div>
      </div>
    </div>
  );
};

export default HungerBar;