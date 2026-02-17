import React from 'react';
import { renderHighlightedText } from "../helpers/render-highlighted-text";
interface SingleFishInfoBlockProps {
  backgroundColor?: string;
  title: string;
  description: string;
  icon?: string;
  highlightPhrases?: string[];
}

const SingleFishInfoBlock: React.FC<SingleFishInfoBlockProps> = ({
  backgroundColor = '#1C1B20',
  title,
  description,
  icon,
  highlightPhrases,
}) => {
  return (
    <section className="relative w-full">
      <div
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 rounded-[14px] lg:rounded-[60px] px-4 py-4 sm:px-16 sm:py-16 lg:flex-row lg:items-center lg:justify-between"
        style={{ backgroundColor }}
      >
        <div className="flex flex-col items-start gap-6 lg:min-w-[430px]">
          <div className="flex flex-col w-full items-start lg:items-center gap-4 sm:gap-6">
            <div className="flex sm:h-[116px] h-[85px] w-[85px] sm:w-[116px] items-center justify-center">
              {icon && <img src={icon} alt="" className="sm:h-[100px] h-[85px] w-[85px] sm:w-[100px] object-contain" />}
            </div>
            <h2 className="font-sf-pro-display text-left lg:text-center text-[40px] sm:text-[36px] font-bold leading-[1] tracking-[-0.02em] text-white sm:text-[48px]">
              {title}
            </h2>
          </div>
        </div>
        <div className="mt-[-1.2rem] sm:mt-0 max-w-[760px] font-sf-pro-display text-[16px] sm:text-[18px] lg:text-[20px] min-[1350px]:text-[22px] leading-[1.1] sm:leading-[1.3]">
          {renderHighlightedText(description, highlightPhrases)}
        </div>
      </div>
    </section>
  );
};

export default SingleFishInfoBlock;
