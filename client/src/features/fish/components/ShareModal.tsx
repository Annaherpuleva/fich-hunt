import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

type ShareModalProps = {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  shareText: string;
};

const ShareModal: React.FC<ShareModalProps> = ({ open, onClose, shareUrl, shareText }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const encUrl = encodeURIComponent(shareUrl);
  const encText = encodeURIComponent(shareText);

  const shareOptions = [
    {
      id: 'twitter',
      label: 'X (Twitter)',
      bg: '#1DA1F2',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.633 7.997c.013.18.013.361.013.543 0 5.543-4.22 11.93-11.93 11.93-2.371 0-4.576-.693-6.432-1.902.329.039.645.052.987.052 1.961 0 3.763-.667 5.199-1.785-1.832-.04-3.379-1.245-3.912-2.908.26.039.52.065.793.065.381 0 .761-.052 1.116-.143-1.912-.386-3.349-2.068-3.349-4.091v-.052c.557.312 1.2.507 1.882.533a4.162 4.162 0 0 1-1.84-3.46c0-.78.208-1.495.572-2.118a11.899 11.899 0 0 0 8.646 4.387c-.598-2.86 1.549-5.131 4.035-5.131 1.159 0 2.2.494 2.933 1.29a7.898 7.898 0 0 0 2.607-.993 4.142 4.142 0 0 1-1.82 2.285 8.404 8.404 0 0 0 2.375-.645 8.925 8.925 0 0 1-2.063 2.123z" />
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encText}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      bg: '#2AABEE',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9.04 15.492 8.94 20c.437 0 .626-.187.852-.414l2.046-1.961 4.246 3.103c.779.43 1.334.204 1.542-.72l2.794-13.11c.251-1.16-.407-1.612-1.168-1.325L3.71 10.345c-1.13.441-1.118 1.076-.193 1.362l4.31 1.344 9.98-6.298c.469-.307.896-.137.546.17l-9.313 8.569z" />
        </svg>
      ),
      href: `https://t.me/share/url?url=${encUrl}&text=${encText}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      bg: '#1877F2',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.675 0H1.325C.593 0 0 .593 0 1.326v21.348C0 23.407.593 24 1.325 24h11.495V14.708h-3.13V11.08h3.13V8.412c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.764v2.313h3.587l-.467 3.628h-3.12V24h6.116C23.407 24 24 23.407 24 22.674V1.326C24 .593 23.407 0 22.675 0z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      bg: '#25D366',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.004 2.004c-5.508 0-9.98 4.472-9.98 9.98 0 1.761.471 3.48 1.368 4.998L2 22.004l5.186-1.352a9.934 9.934 0 0 0 4.818 1.228h.002c5.507 0 9.98-4.472 9.98-9.98 0-2.667-1.04-5.175-2.932-7.068a9.94 9.94 0 0 0-7.05-2.828zm5.83 14.268c-.245.69-1.435 1.317-1.978 1.402-.507.078-1.159.111-1.873-.114-.432-.137-.99-.32-1.707-.622-3.004-1.25-4.951-4.163-5.104-4.361-.15-.197-1.219-1.621-1.219-3.086 0-1.465.77-2.184 1.043-2.48.27-.296.587-.37.783-.37.195 0 .392.002.563.01.182.008.426-.069.668.51.245.59.832 2.036.905 2.183.075.147.125.32.025.517-.1.197-.15.319-.295.49-.147.173-.312.39-.447.523-.15.147-.308.308-.132.605.175.296.778 1.28 1.67 2.073 1.147 1.022 2.112 1.34 2.408 1.489.295.147.47.123.643-.074.175-.197.74-.861.938-1.158.196-.296.393-.247.664-.148.27.098 1.706.805 1.996.951.293.147.487.22.56.343.074.123.074.714-.17 1.404z" />
        </svg>
      ),
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
  ];

  const handleShareClick = (href: string) => {
    if (!shareUrl) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4 py-6 sm:px-6 sm:py-12"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[360px] rounded-[24px] bg-[#1C1B20] p-6 sm:p-[30px] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
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
        <div className="mb-[20px] pr-[56px]">
          <div className="text-white text-[20px] font-sf-pro-display font-bold leading-[1.2]">
            {t.shareModal?.title ?? 'Поделиться'}
          </div>
        </div>

        <div className="flex flex-col gap-[12px]">
          {shareOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleShareClick(option.href)}
              className="flex items-center gap-[12px] rounded-[12px] bg-[#2A2A31] hover:bg-[#34343b] px-[12px] py-[10px] transition-colors text-left"
            >
              <span
                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-white"
                style={{ backgroundColor: option.bg }}
              >
                {option.icon}
              </span>
              <span className="text-white text-[15px] font-sf-pro-display font-semibold leading-[1.2]">{option.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-[12px] rounded-[12px] border border-[#3A3A40] hover:border-[#4B4B52] px-[12px] py-[10px] transition-colors text-left"
          >
            <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#35343a] text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
            </span>
            <span className="text-white text-[15px] font-sf-pro-display font-semibold leading-[1.2]">
              {copied 
                ? (t.shareModal?.linkCopied ?? 'Ссылка скопирована')
                : (t.shareModal?.copyLink ?? 'Скопировать ссылку')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
