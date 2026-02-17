import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

const HintCard: React.FC<{ type?: 'hunt' | 'myDwellers'; text?: string; values?: {[key:string]: string} }> = ({ type, text, values = {} }) => {
  const [visible, setVisible] = useState(true);
  const { t } = useLanguage();
  const fallback = useMemo(() => {
    if (text) return text;
    const tips = type === 'hunt' ?  t.hint.huntTips : type === 'myDwellers' ? t.hint.myDwellersTips : [...t.hint.huntTips, ...t.hint.myDwellersTips];
    const index = Math.floor(Math.random() * tips.length);
    return tips[index];
  }, [text, t]);
  if (!visible) return null;
  return (
    <div className="relative w-full bg-[#1C1B20] rounded-[24px] p-3 md:p-[30px]">
      {/* Close button */}
      <button
        aria-label="Close"
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-xl"
        onClick={() => setVisible(false)}
      >
        <img src="/img/hint-close-icon.svg" alt="" className="h-6 w-6" />
      </button>

      <div className="flex items-start gap-3 md:gap-[15px] max-md:pr-[30px]">
        <div className="relative h-8 w-8 flex-shrink-0 md:h-10 md:w-10">
          <img src="/img/hint-icon-circle.png" alt="" className="absolute inset-0 h-full w-full" />
          <img
            src="/img/hint-icon-lamp.png"
            alt="hint"
            className="absolute left-[6px] top-[6px] h-[20px] w-[20px] md:left-[10px] md:top-[10px] md:h-[20px] md:w-[20px]"
          />
        </div>

        <p className="font-sf-pro text-[14px] leading-[1.3] tracking-[-0.02em] text-white md:text-[20px] md:leading-[1.4]">
          <span className="font-bold">
            {(t.hint.label)}
            {':'}
            {' '}
          </span>
          <span>{fallback.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')}</span>
        </p>
      </div>
    </div>
  );
};

export default HintCard;
