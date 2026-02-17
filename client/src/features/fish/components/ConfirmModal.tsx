import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  question: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  question,
  confirmLabel,
  cancelLabel,
  confirmDisabled = false,
}) => {
  const { t } = useLanguage();

  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 py-6 sm:px-6 sm:py-12"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[420px] rounded-[24px] bg-[#1C1B20] p-6 sm:p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-[12px] top-[12px] sm:right-[20px] sm:top-[20px] flex h-[44px] w-[44px] items-center justify-center text-[#8F8F8F] hover:text-white transition-colors"
          aria-label={t.shareModal?.close ?? 'Закрыть'}
        >
          <span className="text-[24px] leading-none">×</span>
        </button>

        <div className="mb-[24px] pr-[56px]">
          <div className="text-white text-[20px] sm:text-[24px] font-sf-pro-display font-bold leading-[1.2] tracking-[-0.02em]">
            {question}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-[14px]">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`flex-1 min-h-[44px] rounded-[8px] py-[4px] px-[30px] ${
              confirmDisabled
                ? 'bg-[#0088FF]/50 cursor-not-allowed'
                : 'bg-[#0088FF] hover:bg-[#0077E6]'
            } text-white text-[16px] leading-[1.1] font-sf-pro-display font-bold tracking-[-0.01em] flex items-center justify-center transition-colors`}
          >
            {confirmLabel ?? (t.hideFishModal as any)?.confirm ?? 'Подтвердить'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-[8px] py-[4px] px-[30px] bg-black/40 hover:bg-black/60 text-white text-[16px] leading-[1.1] font-sf-pro-display font-bold tracking-[-0.04em] flex items-center justify-center transition-colors"
          >
            {cancelLabel ?? (t.hideFishModal as any)?.cancel ?? (t?.cancel ?? 'Отменить')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
