import React, { useState } from 'react';

export interface FaqInfoBlockProps {
  questions: string[];
  answers: string[];
}

const FaqInfoBlock: React.FC<FaqInfoBlockProps> = ({ questions, answers }) => {
  // Первый пункт раскрыт по умолчанию
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="overflow-hidden max-[430px]:h-full max-[480px]:h-[755px] flex h-[710px] sm:h-[720px] md:h-[670px] min-[1400px]:h-[630px] w-full flex-col rounded-[14px] lg:rounded-[60px] bg-[#1C1B20] px-8 py-10 sm:px-10 sm:py-12">
      <div className="flex flex-col gap-3">
        {questions.map((q, idx) => {
          const isOpen = openIndex === idx;
          const answer = answers[idx] ?? '';

          return (
            <div
              key={q}
              className={`overflow-hidden rounded-[40px] bg-[#242328] transition-transform duration-200 pl-3 ${
                isOpen ? 'shadow-[0_16px_40px_rgba(0,0,0,0.45)] -translate-y-0.5 pb-5' : 'hover:-translate-y-0.5'
              }`}
            >
              <button
                type="button"
                onClick={() => !isOpen && setOpenIndex(idx)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 sm:px-6 sm:py-5 text-left transition-all duration-200"
              >
                <span
                  className={`font-sf-pro-display font-semibold leading-[1.2] text-white transition-all duration-200 text-[24px] sm:text-[26px] lg:text-[30px]`}
                >
                  {q}
                </span>
                {!isOpen && (
                  <span className="flex shrink-0 h-10 w-10 items-center justify-center">
                    <picture>
                      <source srcSet="/img/landing-page/landing-quote-icon-3.webp" type="image/webp" />
                      <img
                        src="/img/landing-page/landing-quote-icon-3.png"
                        alt=""
                        className="h-10 w-10 object-contain"
                        aria-hidden="true"
                      />
                    </picture>
                  </span>
                )}
              </button>
              <div
                className={`px-6 pt-0 pb-0 text-[#C0BEC6] transition-all duration-300 ease-out ${
                  isOpen && answer ? 'max-h-[320px] py-4 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}
              >
                <p className="font-sf-pro-display text-[16px] leading-[1.2] sm:text-[18px] lg:text-[20px]">{answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FaqInfoBlock;
