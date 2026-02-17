import React from 'react';

type Props = {
  imageUrl?: string;
  rankLabel: string;
  borderRadius?: number; // default 24
};

const LeaderboardAvatar: React.FC<Props> = ({
  imageUrl,
  rankLabel,
  borderRadius: _borderRadius = 24,
}) => {
  const bg = imageUrl && imageUrl.length > 0 ? `url('${imageUrl}')` : `url('/img/fish-image-7a550f.jpg')`;
  return (
    <div
      className="relative rounded-[10px] sm:rounded-[24px] flex-shrink-0 w-[60px] h-[60px] sm:w-[180px] sm:h-[180px]"
      style={{
        overflow: 'hidden',
        backgroundImage: bg,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="hidden sm:block absolute left-[16px] top-[16px]">
        <div className="backdrop-blur-[8px] rounded-[8px] px-2 py-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <span className="text-white text-[12px] font-sf-pro-display font-bold leading-[1.3] tracking-[-0.08em]">
            {rankLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardAvatar;
