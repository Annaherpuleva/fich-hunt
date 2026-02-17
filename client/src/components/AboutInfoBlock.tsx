import React, { CSSProperties } from 'react';
import { TextToken } from "../locales/translations";
import { renderTextToken } from "../helpers/render-text-token";

interface AboutInfoBlockProps {
  title: TextToken;
  description: TextToken;
  badge: string;
  cta: string;
  backgroundColor?: string;
  backgroundImage?: string;
  ctaColor?: string;
  titleWidth?: number | string;
  titleSpacing?: number | string;
  titleSpacingMobile?: number | string;
  ctaHeight?: number | string;
  ctaSpacing?: number | string;
  ctaSpacingMobile?: number | string;
  descriptionBoldPhrases?: string[];
  descriptionStyle?: CSSProperties;
  onCtaClick?: () => void;
}

const AboutInfoBlock: React.FC<AboutInfoBlockProps> = ({
  title,
  description,
  badge,
  cta,
  backgroundColor = '#1C1B20',
  backgroundImage,
  ctaColor = '#0088FF',
  titleWidth,
  titleSpacing,
  titleSpacingMobile,
  ctaHeight,
  ctaSpacing,
  ctaSpacingMobile,
  descriptionStyle,
  onCtaClick,
}) => {
  const normalize = (value: number | string | undefined, fallback: string): string =>
    typeof value === 'number' ? `${value}px` : value ?? fallback;

  const titleMobile = normalize(titleSpacingMobile, normalize(titleSpacing, '6rem'));
  const titleDesktop = normalize(titleSpacing, titleMobile);
  const ctaMobile = normalize(ctaSpacingMobile, normalize(ctaSpacing, '4.7rem'));
  const ctaDesktop = normalize(ctaSpacing, ctaMobile);

  return (
    <div
      className="flex w-full h-full flex-col  gap-[40px] lg:gap-[32px] rounded-[14px] lg:rounded-[60px] px-5 py-10 text-center sm:px-14 sm:py-14"
      style={{
        backgroundColor,
        ...(backgroundImage
          ? {
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
          : {}),
        // CSS-переменные для адаптивных отступов
        '--title-spacing-mobile': titleMobile,
        '--title-spacing-desktop': titleDesktop,
        '--cta-spacing-mobile': ctaMobile,
        '--cta-spacing-desktop': ctaDesktop,
      } as React.CSSProperties}
    >
      <div className="rounded-[40px] max-w-[450px] mx-auto bg-[rgba(64,64,64,0.3)] px-4 py-2 sm:px-6 sm:py-3 font-sf-pro-display text-[16px] sm:text-[24px] font-semibold text-white tracking-[-0.02em]">
        {badge}
      </div>
      <div className="mx-auto flex grow flex-col justify-center gap-6">
        <h2
          className="mx-auto font-sf-pro-display text-[30px] sm:text-[36px] font-bold leading-[1] tracking-[-0.02em] text-white sm:text-[44px] mt-[30px] lg:mt-0"
          style={{ maxWidth: titleWidth ?? 350 }}
        >
          {renderTextToken(title)}
        </h2>
        <div
          className={`mt-2 mx-auto max-w-[580px] font-sf-pro-display text-[18px] sm:text-[20px] leading-[1.3] text-[#DEDEDE]`}
          style={descriptionStyle}
        >{renderTextToken(description)}
        </div>
      </div>
      <button
        type="button"
        onClick={onCtaClick}
        className="mx-auto flex h-[80px] w-full max-w-[370px] items-center justify-center rounded-full px-12 text-[24px] font-sf-pro-display font-bold tracking-[-0.02em] text-white transition-transform duration-200 hover:-translate-y-0.5 leading-[1.2]"
        style={{
          backgroundColor: ctaColor,
          height: typeof ctaHeight === 'number' ? `${ctaHeight}px` : ctaHeight ?? '80px',
        }}
      >
        {cta}
      </button>
    </div>
  );
};

export default AboutInfoBlock;
