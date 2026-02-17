import React, { useEffect, useRef, useState } from 'react';

type Props = {
  value: number; // SOL
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  error?: string | null;
  onValueBlur?: (next: number) => void;
  onRawInputChange?: (raw: string) => void;
};

const PriceControl: React.FC<Props> = ({
  value,
  onChange,
  min = 0.01,
  max = 1000,
  step = 0.01,
  label = 'Цена',
  error = null,
  onValueBlur,
  onRawInputChange,
}) => {
  const [input, setInput] = useState<string>(value.toFixed(2));
  const [_width, setWidth] = useState<number>(285);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isInputFocusedRef = useRef<boolean>(false);

  useEffect(() => {
    // Обновляем input только если инпут не в фокусе, чтобы не терять позицию курсора
    if (!isInputFocusedRef.current) {
      setInput(value.toFixed(2));
    }
  }, [value]);

  useEffect(() => {
    const el = measureRef.current; if (!el) return;
    el.textContent = input || '0';
    const w = Math.ceil(el.getBoundingClientRect().width) + 12;
    setWidth(Math.max(58, Math.min(160, w)));
  }, [input]);

  const clamp = (v: number) => Math.min(Math.max(v, min), max);

  const increase = () => {
    const next = clamp(Number((value + step).toFixed(2)));
    onChange(next);
    onRawInputChange?.(next.toFixed(2));
  };
  const decrease = () => {
    const next = clamp(Number((value - step).toFixed(2)));
    onChange(next);
    onRawInputChange?.(next.toFixed(2));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const cursorPosition = inputEl.selectionStart || 0;
    let val = e.target.value.replace(',', '.');
    if (val === '') { setInput(val); return; }
    
    // Проверяем формат и ограничиваем до 2 цифр после запятой
    if (!/^\d*\.?\d*$/.test(val)) return;
    
    // Если есть точка, ограничиваем количество цифр после неё до 2
    const dotIndex = val.indexOf('.');
    if (dotIndex !== -1) {
      const beforeDot = val.substring(0, dotIndex + 1);
      const afterDot = val.substring(dotIndex + 1);
      // Оставляем только первые 2 цифры после запятой
      const limitedAfterDot = afterDot.substring(0, 2);
      val = beforeDot + limitedAfterDot;
    }
    
    setInput(val);
    onRawInputChange?.(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) onChange(clamp(parsed));
    
    // Восстанавливаем позицию курсора после обновления
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = Math.min(cursorPosition, val.length);
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleBlur = () => {
    isInputFocusedRef.current = false;
    const parsed = parseFloat(input);
    const clamped = isNaN(parsed) ? value : clamp(parsed);
    onChange(clamped);
    setInput(clamped.toFixed(2));
    onRawInputChange?.(clamped.toFixed(2));
    onValueBlur?.(clamped);
  };

  return (
    <div className="flex flex-col gap-[6px] w-full">
      <div
        className={`relative h-[44px] sm:h-[40px] rounded-[12px] ${
          error ? 'bg-[#FF4444]/15 border-2 border-[#FF4444]' : 'bg-[#404040]'
        }`}
      >
        <div className="absolute inset-0 flex items-center pointer-events-none gap-[4px] px-[44px] sm:px-[68px] justify-center">
          <span className="text-white text-[14px] sm:text-[16px] font-sf-pro-display leading-[1.02] tracking-[-0.01em] text-center shrink-0">{label}</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            value={input}
            onChange={onInputChange}
            onFocus={() => {
              isInputFocusedRef.current = true;
            }}
            onBlur={handleBlur}
            className="w-[55px] sm:w-[70px] mt-[0px] sm:mt-[0px] text-center bg-transparent outline-none text-white text-[14px] sm:text-[16px] font-sf-pro-display leading-[1.02] tracking-[-0.01em] pointer-events-auto flex-[0_0_auto]"
          />
          <span className="text-white text-[14px] sm:text-[16px] font-sf-pro-display leading-[1.02] tracking-[-0.01em] shrink-0">TON</span>
        </div>

        <button
          className="absolute left-[4px] top-[4px] w-[40px] h-[36px] sm:h-[34px] bg-[#101014] text-white rounded-[8px] text-[14px] font-bold flex items-center justify-center z-10"
          aria-label="minus"
          onClick={decrease}
        >
          -
        </button>

        <button
          className="absolute right-[4px] top-[4px] w-[40px] h-[36px] sm:h-[34px] bg-[#101014] text-white rounded-[8px] text-[14px] font-bold flex items-center justify-center z-10"
          aria-label="plus"
          onClick={increase}
        >
          +
        </button>

        <span ref={measureRef} className="absolute -z-10 opacity-0 pointer-events-none text-[16px] font-bold" />
      </div>
      {error ? (
        <div className="text-[12px] sm:text-[13px] text-[#FF4444] leading-[1.2] font-sf-pro-display">{error}</div>
      ) : null}
    </div>
  );
};

export default PriceControl;
