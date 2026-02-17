import React from 'react';

const SkeletonBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-[#2A2A2E] ${className ?? ''}`} />
);

const SkeletonFishMain: React.FC = () => {
  return (
    <div className="rounded-[24px] bg-[#1C1B20] p-5 sm:p-[30px] w-full max-w-[820px]">
      {/* Изображение */}
      <div className="rounded-[12px] overflow-hidden animate-pulse bg-[#2A2A2E] w-full h-[300px] sm:h-[420px] lg:h-[600px]" />

      {/* Название и цена */}
      <div className="mt-[20px] sm:mt-[30px] w-full flex flex-row flex-nowrap items-center justify-between gap-3 sm:gap-4">
        <SkeletonBar className="h-[24px] sm:h-[34px] w-[60%] sm:w-[55%] rounded-[12px]" />
        <SkeletonBar className="h-[24px] sm:h-[34px] w-[35%] sm:w-[28%] rounded-full" />
      </div>

      {/* Управление ценой и CTA (рядом, gap 30) */}
      <div className="mt-[20px] sm:mt-[30px] flex flex-col lg:flex-row items-stretch gap-4 lg:gap-[30px] w-full">
        <div className="w-full lg:w-1/2">
          <SkeletonBar className="w-full h-[40px] rounded-full" />
        </div>
        <div className="w-full lg:w-1/2">
          <SkeletonBar className="w-full h-[48px] rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonFishMain;
