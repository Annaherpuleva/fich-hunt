import React from 'react';
import PriceControl from './PriceControl';

type Props = {
  nameValue?: string;
  onNameChange?: (next: string) => void;
  placeholderName?: string;
  value: number; // SOL
  onChange: (next: number) => void;
  showNameField?: boolean;
  labelPrice?: string;
  min?: number;
  max?: number;
  step?: number;
  nameError?: string | null;
  onNameBlur?: () => void;
  amountError?: string | null;
  onAmountBlur?: (next: number) => void;
  onRawAmountChange?: (raw: string) => void;
};

const DeadFishForm: React.FC<Props> = ({ 
  nameValue = '', 
  onNameChange, 
  placeholderName = 'Имя жителя', 
  value, 
  onChange, 
  showNameField = true, 
  labelPrice = 'Цена', 
  min = 0.00001, 
  max = 1000, 
  step = 0.001,
  nameError = null,
  onNameBlur,
  amountError = null,
  onAmountBlur,
  onRawAmountChange,
}) => {
  return (
    <div className="flex flex-col gap-2 w-full sm:max-w-[760px]">
      {showNameField && (
        <div className="w-full">
          <div className={`rounded-[12px] h-[44px] sm:h-[40px] w-full flex items-center justify-center px-4 sm:px-6 ${
            nameError ? 'bg-[#FF4444]/20 border-2 border-[#FF4444]' : 'bg-[#404040]'
          }`} role="group" aria-label="fish-name">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => onNameChange && onNameChange(e.target.value)}
              onBlur={onNameBlur}
              placeholder={placeholderName}
              className="w-full text-center bg-transparent outline-none text-[#DEDEDE] text-[15px] sm:text-[16px] leading-[1.02] tracking-[-0.03em] font-sf-pro-display placeholder-[#DEDEDE] placeholder:text-center"
            />
          </div>
          {nameError && (
            <div className="mt-1 text-[12px] sm:text-[13px] text-[#FF4444] font-sf-pro-display leading-[1.2]">
              {nameError}
            </div>
          )}
        </div>
      )}
      <PriceControl
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        label={labelPrice}
        error={amountError}
        onValueBlur={onAmountBlur}
        onRawInputChange={onRawAmountChange}
      />
    </div>
  );
};

export default DeadFishForm;
