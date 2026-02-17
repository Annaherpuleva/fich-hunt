import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext.tsx';

interface MyFishHeaderProps {
  className?: string;
  activeTab?: 'fish' | 'profile';
  onTabChange?: (tab: 'fish' | 'profile') => void;
}

const MyFishHeader: React.FC<MyFishHeaderProps> = ({ className, activeTab = 'fish', onTabChange }) => {
  const { t } = useLanguage();
  const fishLabel = t.myFishTitle;
  const profileLabel = t.profile?.title ?? 'Профиль';

  const mobileButtonBase = 'bg-transparent border-none p-0 font-sf-pro-display text-[28px] font-bold leading-[0.9] tracking-[-0.02em] transition-colors';

  return (
    <div className={`w-full ${className || ''}`}>
      <div className="flex items-center gap-[6px] sm:hidden">
        <button
          type="button"
          className={`${mobileButtonBase} ${activeTab === 'fish' ? 'text-white' : 'text-white/40'}`}
          onClick={() => onTabChange && onTabChange('fish')}
          aria-pressed={activeTab === 'fish'}
        >
          {fishLabel}
        </button>
        <span className="font-sf-pro-display text-[28px] font-bold leading-[0.9] tracking-[-0.02em] text-white/20">/</span>
        <button
          type="button"
          className={`${mobileButtonBase} ${activeTab === 'profile' ? 'text-white' : 'text-white/40'}`}
          onClick={() => onTabChange && onTabChange('profile')}
          aria-pressed={activeTab === 'profile'}
        >
          {profileLabel}
        </button>
      </div>
      <div className="hidden sm:block">
        <h1 className="font-sf-pro-display text-[28px] font-bold leading-[0.9] tracking-[-0.02em] text-white sm:text-[32px] sm:leading-[1.1]">
          {fishLabel}
        </h1>
      </div>
    </div>
  );
};

export default MyFishHeader;
