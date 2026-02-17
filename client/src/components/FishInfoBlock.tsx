import React from 'react';

export interface FishInfoBlockProps {
  background: string;
  badge?: string;
  title: string;
  description: string;
  align?: 'left' | 'right';
  showBadge?: boolean;
}

const FishInfoBlock: React.FC<FishInfoBlockProps> = ({
  background,
  badge,
  title,
  description,
  align = 'left',
  showBadge = true,
}) => (
  <div className="max-md:pt-[128%] max-lg:pt-[90%] relative w-full">
    <div
      className="max-lg:absolute max-lg:inset-0 flex lg:min-h-[700px] h-full flex-col gap-6 rounded-[14px] lg:rounded-[60px] p-[20px] lg:p-[30px]"
      style={{
        backgroundImage: `url('${background}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {showBadge && badge && (
        <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} sm:mt-[10px] sm:ml-[10px]`}>
          <span className="rounded-full bg-white/20 px-6 py-2 font-sf-pro-display text-[14px] sm:text-[20px] font-semibold text-white backdrop-blur-[20px]">
            {badge}
          </span>
        </div>
      )}
      <div
        className={`mt-auto rounded-[32px] bg-black/20 px-4 py-4 sm:px-6 sm:py-6 backdrop-blur-[20px] ${
          align === 'right' ? 'text-right' : 'text-left'
        }`}
      >
        <h3 className="mb-3 font-sf-pro-display text-[23px] sm:text-[30px] font-bold leading-[1] tracking-[-0.03em] text-white">
          {title}
        </h3>
        <p className="font-sf-pro-display text-[16px] sm:text-[20px] leading-[1.2] tracking-[-0.03em] text-white/90">
          {description}
        </p>
      </div>
    </div>
  </div>
);

export default FishInfoBlock;
