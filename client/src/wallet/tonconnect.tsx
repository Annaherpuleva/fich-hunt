import React, { createContext, useContext, useMemo, useState } from 'react';

type WalletInfo = { account: { address: string }; device: { appName: string }; imageUrl?: string } | null;

type TonUi = {
  openModal: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (tx: any) => Promise<any>;
  setPreferredWallet: (walletName: string) => void;
  connectWithWallet: (walletName: string) => Promise<void>;
};

export type TonWalletOption = {
  name: string;
  imageUrl?: string;
  installed: boolean;
};

type WalletVisualOption = {
  name: string;
  deepLink?: string;
  webUrl: string;
  badge: string;
  accentClass: string;
};

const Ctx = createContext<{ wallet: WalletInfo; tonUI: TonUi; walletOptions: TonWalletOption[] } | null>(null);
const ADDRESS_KEY = 'tonconnect_address';
const APP_KEY = 'tonconnect_wallet_app';
const TON_ADDRESS_RE = /^(?:EQ|UQ)[A-Za-z0-9_-]{46,70}$/;

const walletOptions: WalletVisualOption[] = [
  { name: 'Tonkeeper', deepLink: 'tonkeeper://', webUrl: 'https://tonkeeper.com/', badge: '◇', accentClass: 'from-[#0A172A] to-[#111827]' },
  { name: 'MyTonWallet', deepLink: 'mytonwallet://', webUrl: 'https://mytonwallet.io/', badge: '◉', accentClass: 'from-[#EEF2FF] to-[#BFD8FF] text-[#2463D4]' },
  { name: 'Tonhub', webUrl: 'https://tonhub.com/', badge: '⬢', accentClass: 'from-[#B422FF] to-[#5B4CFF]' },
  { name: 'Bitget Wallet', webUrl: 'https://web3.bitget.com/', badge: '❯', accentClass: 'from-[#00E3FF] to-[#0076FF]' },
  { name: 'TON Wallet', deepLink: 'ton://', webUrl: 'https://wallet.ton.org/', badge: '◈', accentClass: 'from-[#1E293B] to-[#0F172A]' },
];

const getWindowAny = () => (typeof window === 'undefined' ? null : window as any);

const hasInjectedWallet = (walletName: string) => {
  const w = getWindowAny();
  if (!w) return false;
  if (walletName === 'Tonkeeper') return Boolean(w.tonkeeper || w.tonkeeperWallet || w.tonconnect?.tonkeeper);
  if (walletName === 'MyTonWallet') return Boolean(w.myTonWallet || w.mytonwallet || w.myTonwallet);
  if (walletName === 'TON Wallet') return Boolean(w.tonwallet || w.tonWallet || w.ton);
  return false;
};

const getProvidersForWallet = (walletName: string, w: any) => {
  if (!w) return [];

  if (walletName === 'Tonkeeper') {
    return [w.tonkeeper, w.tonkeeperWallet, w.tonconnect?.tonkeeper, w.tonconnect].filter(Boolean);
  }

  if (walletName === 'MyTonWallet') {
    return [w.myTonWallet, w.mytonwallet, w.myTonwallet].filter(Boolean);
  }

  if (walletName === 'TON Wallet') {
    return [w.tonwallet, w.tonWallet, w.ton].filter(Boolean);
  }

  return [];
};

const parseAddress = (response: any): string => {
  if (!response) return '';
  if (typeof response === 'string') return response;
  if (Array.isArray(response)) return typeof response[0] === 'string' ? response[0] : '';
  if (typeof response?.address === 'string') return response.address;
  if (typeof response?.account?.address === 'string') return response.account.address;
  if (typeof response?.result?.address === 'string') return response.result.address;
  if (Array.isArray(response?.result) && typeof response.result[0] === 'string') return response.result[0];
  return '';
};

export const TonConnectUIProvider: React.FC<{ children: React.ReactNode; manifestUrl?: string }> = ({ children, manifestUrl: _manifestUrl }) => {
  const [address, setAddress] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem(ADDRESS_KEY) || '' : ''));
  const [walletApp, setWalletApp] = useState<string>(() => (typeof window !== 'undefined' ? localStorage.getItem(APP_KEY) || 'TON Wallet' : 'TON Wallet'));
  const [modalOpen, setModalOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [inputAddress, setInputAddress] = useState(address);
  const [manualAddressError, setManualAddressError] = useState<string>('');

  const availableWallets = useMemo<TonWalletOption[]>(() => walletOptions.map((wallet) => ({
    name: wallet.name,
    imageUrl: '/img/icon-wallet-new.svg',
    installed: hasInjectedWallet(wallet.name),
  })), []);

  const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

  const tryOpenCustomScheme = (url: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    window.setTimeout(() => {
      iframe.remove();
    }, 1200);
  };

  const openExternal = (url: string, newTab = false) => {
    if (typeof window === 'undefined') return;

    const telegramOpenLink = (window as any)?.Telegram?.WebApp?.openLink;
    if (typeof telegramOpenLink === 'function' && isHttpUrl(url)) {
      telegramOpenLink(url, { try_instant_view: false });
      return;
    }

    if (newTab && isHttpUrl(url)) {
      const openedWindow = window.open(url, '_blank', 'noopener,noreferrer');
      if (!openedWindow) {
        window.location.assign(url);
      }
      return;
    }

    if (isHttpUrl(url)) {
      window.location.assign(url);
      return;
    }

    tryOpenCustomScheme(url);
  };

  const openWalletLink = (walletName: string) => {
    const selected = walletOptions.find((option) => option.name === walletName);
    if (selected && typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(window.navigator.userAgent);
      const isTelegramMiniApp = Boolean((window as any)?.Telegram?.WebApp);

      if (isTelegramMiniApp) {
        openExternal(selected.webUrl, true);
        return;
      }

      if (!isMobile && selected.deepLink && hasInjectedWallet(walletName)) {
        openExternal(selected.deepLink);
        return;
      }

      if (isMobile && selected.deepLink) {
        let fallbackTimer: number | null = window.setTimeout(() => {
          openExternal(selected.webUrl, true);
        }, 2200);

        const cancelFallback = () => {
          if (fallbackTimer !== null) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
        };

        const onVisibilityChange = () => {
          if (document.hidden) {
            cancelFallback();
          }
        };

        document.addEventListener('visibilitychange', onVisibilityChange, { once: true });
        openExternal(selected.deepLink);
        return;
      }
      openExternal(selected.webUrl, true);
    }
  };

  const openTelegramWallet = () => {
    if (typeof window === 'undefined') return;
    const telegram = (window as any)?.Telegram?.WebApp;
    if (telegram?.openTelegramLink) {
      telegram.openTelegramLink('https://t.me/wallet');
      return;
    }
    openExternal('https://t.me/wallet', true);
  };

  const persist = (nextAddress: string, nextWalletApp: string) => {
    localStorage.setItem(ADDRESS_KEY, nextAddress);
    localStorage.setItem(APP_KEY, nextWalletApp);
    setAddress(nextAddress);
    setWalletApp(nextWalletApp);
  };

  const tonUI = useMemo<TonUi>(() => ({
    openModal: async () => {
      setInputAddress(address);
      setShowManualInput(false);
      setManualAddressError('');
      setModalOpen(true);
    },
    disconnect: async () => {
      localStorage.removeItem(ADDRESS_KEY);
      localStorage.removeItem(APP_KEY);
      setAddress('');
      setWalletApp('TON Wallet');
    },
    sendTransaction: async (tx) => {
      console.info('Mock sendTransaction', tx);
      return { boc: 'mock' };
    },
    setPreferredWallet: (walletName: string) => {
      setWalletApp(walletName);
    },
    connectWithWallet: async (walletName: string) => {
      setWalletApp(walletName);
      setManualAddressError('');

      const w = getWindowAny();
      const providers = getProvidersForWallet(walletName, w);

      for (const provider of providers) {
        try {
          const viaConnect = typeof provider.connect === 'function' ? await provider.connect() : null;
          const addrFromConnect = parseAddress(viaConnect);
          if (addrFromConnect) {
            persist(addrFromConnect, walletName);
            setModalOpen(false);
            return;
          }

          if (typeof provider.request === 'function') {
            const methods = ['ton_requestAccounts', 'requestAccounts', 'eth_requestAccounts'];
            for (const method of methods) {
              try {
                const result = await provider.request({ method });
                const addr = parseAddress(result);
                if (addr) {
                  persist(addr, walletName);
                  setModalOpen(false);
                  return;
                }
              } catch (_error) {
              }
            }
          }

          if (typeof provider.send === 'function') {
            const result = await provider.send('ton_requestAccounts');
            const addr = parseAddress(result);
            if (addr) {
              persist(addr, walletName);
              setModalOpen(false);
              return;
            }
          }
        } catch (_error) {
        }
      }

      openWalletLink(walletName);
    },
  }), [address]);

  const saveManualAddress = () => {
    const nextAddress = inputAddress.trim();
    if (!TON_ADDRESS_RE.test(nextAddress)) {
      setManualAddressError('Введите корректный TON-адрес (начинается с EQ или UQ).');
      return;
    }
    setManualAddressError('');
    persist(nextAddress, walletApp);
    setModalOpen(false);
  };

  const wallet: WalletInfo = address ? { account: { address }, device: { appName: walletApp }, imageUrl: '/img/icon-wallet-new.svg' } : null;

  return (
    <Ctx.Provider value={{ wallet, tonUI, walletOptions: availableWallets }}>
      {children}

      {modalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[26px] border border-[#1D2027] bg-[#10131B] text-white shadow-[0_24px_64px_rgba(0,0,0,0.55)]">
            <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7">
              <button
                type="button"
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white/80 hover:bg-white/15"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>

              <div className="mx-auto mt-8 max-w-[360px] text-center sm:mt-10">
                <h3 className="text-[42px] font-extrabold leading-[1.05] tracking-[-0.02em]">Подключите кошелёк</h3>
                <p className="mt-4 text-[24px] leading-[1.3] text-[#A4A8B3]">
                  Подключите Wallet в Telegram
                  <br />
                  или выберете кошелёк
                  <br />
                  для подключения
                </p>
              </div>

              <button
                type="button"
                className="mt-8 flex h-[74px] w-full items-center justify-center gap-3 rounded-[20px] bg-gradient-to-r from-[#2AA4FF] to-[#2281F4] px-4 text-[33px] font-bold text-white shadow-[0_8px_24px_rgba(34,129,244,0.45)] hover:brightness-110"
                onClick={openTelegramWallet}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-[22px] text-[#2281F4]">◍</span>
                Открыть Wallet в Telegram
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-[22px] text-[#2281F4]">✈</span>
              </button>

              <div className="mt-7 overflow-x-auto pb-1">
                <div className="flex min-w-max gap-4 pr-2">
                  {walletOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      className="w-[92px] shrink-0 text-center"
                      onClick={async () => {
                        await tonUI.connectWithWallet(option.name);
                      }}
                    >
                      <span className={`mx-auto flex h-[82px] w-[82px] items-center justify-center rounded-[20px] bg-gradient-to-br text-[34px] font-bold text-white ${option.accentClass}`}>
                        {option.badge}
                      </span>
                      <span className="mt-2 block text-[25px] leading-tight text-white">{option.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <button
                  type="button"
                  className="w-full text-left text-sm font-semibold text-[#AFC8FF]"
                  onClick={() => setShowManualInput((prev) => !prev)}
                >
                  {showManualInput ? 'Скрыть ручной ввод адреса' : 'Ввести адрес вручную'}
                </button>
                {showManualInput && (
                  <>
                    <input
                      id="ton-address-input"
                      value={inputAddress}
                      onChange={(event) => setInputAddress(event.target.value)}
                      placeholder="EQ..."
                      className="mt-2 w-full rounded-xl border border-white/15 bg-[#121117] px-3 py-2 text-sm text-white outline-none focus:border-[#6B6B6B]"
                    />
                    {manualAddressError ? (
                      <div className="mt-2 text-xs text-[#F48A8A]">{manualAddressError}</div>
                    ) : null}
                    <button
                      type="button"
                      className="mt-3 rounded-xl bg-[#2A8DF8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3998FB] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!inputAddress.trim()}
                      onClick={saveManualAddress}
                    >
                      Подтвердить адрес
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-[#171B24] px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2 text-[24px] font-semibold">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#0C6CFF] text-white">◈</span>
                TON Connect
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg text-white/80">?</span>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
};

export function useTonConnectUI(): [TonUi] {
  const v = useContext(Ctx);
  if (!v) throw new Error('TonConnect provider missing');
  return [v.tonUI];
}

export function useTonWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error('TonConnect provider missing');
  return v.wallet;
}

export function useTonWalletOptions() {
  const v = useContext(Ctx);
  if (!v) throw new Error('TonConnect provider missing');
  return v.walletOptions;
}

export function useTonAddress(_userFriendly?: boolean) {
  const v = useContext(Ctx);
  if (!v) throw new Error('TonConnect provider missing');
  return v.wallet?.account.address || '';
}
