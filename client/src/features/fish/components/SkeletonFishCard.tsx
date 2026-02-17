import React from 'react';

type Props = {
  className?: string;
};

const SkeletonFishCard: React.FC<Props> = ({ className }) => {
  return (
    <div className={`flex w-full max-w-[396px] flex-col rounded-[24px] bg-[#1C1B20] p-5 sm:p-[30px] animate-pulse ${className ?? ''}`}>
      <div className="relative h-[350px] sm:h-[300px] w-full rounded-[24px] bg-[#2A2A2F]" />
      <div className="mt-[14px] flex w-full items-center justify-between gap-3">
        <div className="h-[22px] sm:h-[24px] w-[60%] rounded bg-[#2A2A2F]" />
        <div className="h-[22px] sm:h-[24px] w-[30%] rounded bg-[#2A2A2F]" />
      </div>
      <div className="mt-3 h-[40px] w-full rounded-[12px] bg-[#2A2A2F]" />
      <div className="mt-[14px] flex w-full flex-col gap-2">
        <div className="h-[44px] w-full rounded-[8px] bg-[#2A2A2F]" />
        <div className="h-[44px] w-full rounded-[8px] bg-[#2A2A2F]" />
      </div>
    </div>
  );
};

export default SkeletonFishCard;
