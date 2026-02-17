import React from 'react';
import { useLanguage } from "../../contexts/LanguageContext";
import { renderTextToken } from "../../helpers/render-text-token";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  cancelLabel?: string;
  background?: string; // path to background image
  imageSrc?: string; // fish preview image inside form
  badgeText?: string; // small badge over preview
  fishName?: string;
  fishValueText?: string; // e.g., "0.25 SOL"
  children?: React.ReactNode; // custom body (e.g., warnings)
  hideCloseIcon?: boolean; // when background already has an icon
  hidePreview?: boolean; // hide image/name/value section for pure form modals
  hideNameValueRow?: boolean; // show image but hide name/value row
};

const FishActionModal: React.FC<Props> = (props) => {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-6 sm:px-6">
      <FishActionModalContent {...props} />
    </div>
  );
};

export const FishActionModalContent: React.FC<Props> = ({
  onClose,
  onConfirm,
  confirmLabel = 'OK',
  confirmDisabled = false,
  cancelLabel = 'Отменить',
  background = '/img/tx-error-bg.png',
  imageSrc = "/img/fish-img-3-858cfd.png",
  fishName,
  fishValueText,
  children,
  hideCloseIcon = false,
  hidePreview = false,
  hideNameValueRow = false,
}) => {
  return <div className="relative w-full max-w-[821px] sm:overflow-hidden sm:rounded-[16px]">
    <div className="absolute inset-0 hidden sm:block">
      <img src={background} alt="bg" className="h-full w-full object-cover" />
    </div>
    {/* Close button 44x44 */}
    <button
      type="button"
      aria-label="close"
      onClick={onClose}
      className={`absolute right-[20px] top-[20px] z-20 flex h-[44px] w-[44px] items-center justify-center rounded-[8px] ${
        hideCloseIcon ? 'bg-transparent text-transparent' : 'bg-[#00000066] text-white'
      }`}
    >
      {hideCloseIcon ? '' : '×'}
    </button>
    <div className="relative flex w-full items-center justify-center px-0 py-0 sm:min-h-[420px] sm:px-8 sm:py-10">
      <div className="w-full max-w-[420px] max-h-[85vh] overflow-y-auto rounded-[24px] bg-[#1C1B20] p-6 sm:p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="mx-auto w-full max-w-[336px]">
          {!hidePreview && (
            <>
              <div className="relative h-[300px] w-full overflow-hidden rounded-[24px] sm:h-[300px]">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${imageSrc}')` }} />
              </div>
              {/* name/price row width 335 */}
              {!hideNameValueRow && (
                <div className="mt-[20px] flex flex-wrap items-center justify-between gap-3">
                  <span className="max-w-[210px] sm:max-w-[210px] truncate text-white text-[18px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em] sm:text-[20px]">
                    {fishName}
                  </span>
                  <span className="text-white text-[18px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em] sm:text-[20px]">{fishValueText}</span>
                </div>
              )}
            </>
          )}
          {/* custom body */}
          {children ? (
            <div className="mt-[20px] w-full">
              {children}
            </div>
          ) : null}
          {/* buttons column width 336 gap 14 */}
          <div className="mt-[20px] w-full">
            {onConfirm ? (
              <>
                <button onClick={onConfirm} disabled={confirmDisabled} className={`w-full h-[44px] rounded-[8px] py-[14px] px-[30px] ${confirmDisabled ? 'bg-[#0088FF]/50 cursor-not-allowed' : 'bg-[#0088FF]'} text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.01em] flex items-center justify-center`}>
                  {confirmLabel}
                </button>
                <div className="h-[8px]" />
              </>
            ) : null}
            <button onClick={onClose} className="w-full h-[44px] rounded-[8px] py-[14px] px-[30px] bg-black/40 text-white text-[16px] font-sf-pro-display font-bold tracking-[-0.04em] flex items-center justify-center">
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

export const FishActionBiteChildren: React.FC<{gain?: number}> = ({gain}) => {
  const { language } = useLanguage();
    
  return <div className="text-[#DEDEDE] text-[14px] sm:text-[16px] leading-[1.4] tracking-[-0.03em] space-y-1">
    {(() => {
      const gainText = typeof gain === 'number' && Number.isFinite(gain) ? gain.toFixed(2) : undefined;
      if (!gainText) {
        return (
          <p className="font-bold">
            {language === 'ru'
              ? 'Ты уничтожил жителя'
              : 'You have destroyed the creature'}
          </p>
        );
      }
      return (
        <p>
          {language === 'ru'
            ? <><b>Ты уничтожил жителя</b><br />Твоя добыча +{gainText} SOL</>
            : <><b>You have destroyed the creature</b><br />Your loot +{gainText} SOL</>}
        </p>
      );
    })()}
  </div>;
};

export const FishActionFeedChildren: React.FC<{feedDelta?: number}> = ({feedDelta}) => {
  const { language } = useLanguage();

  return <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em] space-y-2">
    {(() => {
      if (typeof feedDelta === 'number') {
        const deltaText = feedDelta.toFixed(3);
        return (
          <p className="text-[#DEDEDE] text-[14px] sm:text-[16px]">
            {language === 'ru'
              ? <>Ты покормил жителя на <b>+{deltaText} SOL</b></>
              : <>You fed the Dweller for <b>+{deltaText} SOL</b></>}
          </p>
        );
      }
      return (
        <p className="text-[#DEDEDE] text-[14px] sm:text-[16px] font-bold">
          {language === 'ru' ? 'Житель успешно покормлен' : 'The creature has been successfully fed'}
        </p>
      );
    })()}
  </div>;
};

export const FishActionMarkChildren: React.FC = () => {
  const { language } = useLanguage();

  return <div className="text-[#DEDEDE] text-[14px] sm:text-[16px] leading-[1.4] tracking-[-0.03em] space-y-1">
    <p>
      {language === 'ru'
        ? <><b>Метка установлена!</b><br />При переходе жителя в статус жертвы вы получите <b>эксклюзивное окно на укус на 30 минут</b>.<br />Если жителя покормят — метка сгорает</>
        : <><b>The mark has been placed!</b><br />When the Dweller enters the prey state, you will receive an <b>exclusive 30-minute window to bite</b>.<br />If the Dweller is fed, the tag is burned</>}
    </p>
  </div>;
};

export const FishActionSellChildren: React.FC<{amount: string}> = ({ amount }) => {
  const { t } = useLanguage();

  return  <div className="text-white/90 text-[14px] leading-[1.4] tracking-[-0.03em]">
    { renderTextToken(t.sell.modalBody, { amount }) }
  </div>;
};

export default FishActionModal;
