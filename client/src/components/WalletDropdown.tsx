import React, { useMemo } from 'react';
import { useWallet, WalletReadyState } from '../wallet/tonWallet';
import { useLanguage } from '../contexts/LanguageContext';

interface WalletDropdownProps {
  onClose: () => void;
  showTitle?: boolean;
}

const installUrls: Record<string, string> = {
  Tonkeeper: 'https://tonkeeper.com/',
  'TON Wallet': 'https://wallet.ton.org/',
  MyTonWallet: 'https://mytonwallet.io/',
};

const WalletDropdown: React.FC<WalletDropdownProps> = ({ onClose, showTitle = true }) => {
  const { select, connect, connecting, connected, wallets } = useWallet();
  const { t } = useLanguage();

  const options = useMemo(
    () => wallets.map((wallet) => ({ name: wallet.adapter.name, icon: wallet.adapter.icon, readyState: wallet.readyState, wallet })),
    [wallets]
  );

  return (
    <div className="space-y-3">
      {showTitle && (
        <h3 className="text-[22px] font-bold leading-[1.1] tracking-[-0.01em] text-white font-sf-pro-display">
          {t.connectWalletTitle}
        </h3>
      )}

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.name}
            type="button"
            className="w-full flex items-center justify-between rounded-xl border border-[#2B2B2B] bg-[#1C1B20] px-4 py-3 text-left hover:bg-[#252429] disabled:opacity-60"
            disabled={connecting || connected}
            onClick={async () => {
              try {
                if (opt.readyState === WalletReadyState.Unsupported) {
                  const url = installUrls[opt.name];
                  if (url && typeof window !== 'undefined') window.open(url, '_blank');
                  return;
                }
                select(opt.wallet.adapter.name);
                await connect();
                onClose();
              } catch (error) {
                console.error('TON wallet connect failed', error);
              }
            }}
          >
            <span className="flex items-center gap-3">
              <img src={opt.icon || '/img/icon-wallet-new.svg'} alt={opt.name} className="h-6 w-6" />
              <span className="font-sf-pro-display text-[16px] font-bold text-white">{opt.name}</span>
            </span>
            <span className="text-[12px] text-[#909090]">TON</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WalletDropdown;
