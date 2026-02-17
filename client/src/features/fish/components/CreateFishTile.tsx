import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';

const CreateFishTile: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="w-full rounded-[24px] bg-[#1C1B20] p-3 sm:p-6">
      <div className="flex h-[60px] w-full items-center justify-between gap-4 rounded-[12px] border border-dashed border-[#404040] px-[0.5rem] sm:min-h-[520px] sm:w-full sm:flex-col sm:items-center sm:justify-center sm:gap-4 sm:rounded-[24px] sm:border-[#3A393F] sm:px-10 sm:py-[48px]">
        <div className="flex-1 font-sf-pro-display text-[20px] font-bold leading-[1.02] tracking-[-0.04em] text-white sm:flex sm:flex-none sm:items-center sm:justify-center sm:text-center sm:text-[32px] sm:leading-[1.05]">
          {t.createFish}
        </div>
        <button
          className="flex h-[29px] w-[131px] items-center justify-center rounded-full bg-[#404040] px-3 font-sf-pro-display text-[10px] font-bold text-white transition hover:bg-[#4e4d55] sm:h-[44px] sm:w-[180px] sm:self-center sm:rounded-full sm:bg-[#35343A] sm:px-0 sm:text-[16px] sm:tracking-[-0.02em] sm:hover:bg-[#43424a]"
          onClick={() => navigate('/start-game')}
        >
          + {t.createFishLabel ?? t.createFish}
        </button>
      </div>
    </div>
  );
};

export default CreateFishTile;
