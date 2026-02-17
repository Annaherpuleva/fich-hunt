import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, X, ChevronLeft } from 'lucide-react';
import { useWallet } from '../wallet/tonWallet';
import { WalletReadyState } from '../wallet/tonWallet';
import ConnectWalletButton from './ConnectWalletButton';
import ProfileButton from './ProfileButton';
import DropdownMenu from './DropdownMenu';
import ProfileDropdown from './ProfileDropdown';
import LanguageDropdown from './LanguageDropdown';
import { useLanguage } from '../contexts/LanguageContext';
/* button classes provided via Tailwind utilities in index.css */
import { useOceanStatus } from '../features/ocean/hooks/useOceanStatus';
import { formatDurationHMS, lamportsToSol } from '../core/utils/format';
import { useBlockchainNowSec } from '../core/hooks/useBlockchainNowSec';
import { loadRuntimeConfig } from '../config/runtimeConfig';
import { fetchCompat } from '../shared/api/compat';
import styles from '../css/components/Header.module.css';

const CryptoFishLogo: React.FC = () => {
  return (
    <div className="flex items-center h-[36px]">
      <span className={styles.brandLogo}>
        HODL&nbsp;HUNT
      </span>
    </div>
  );
};

type HeaderProps = {
  showOceanStatus?: boolean;
  // На лендинге шапка шире (1440), в личном кабинете — как у контента (max-w-7xl)
  isLanding?: boolean;
};

const Header: React.FC<HeaderProps> = ({ showOceanStatus = true, isLanding = false }) => {
  const { connected, publicKey, disconnect, select, connect, connecting, wallets } = useWallet();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [mobileMenuView, setMobileMenuView] = useState<'main' | 'wallets'>('main');
  const { language, setLanguage, t } = useLanguage();
  const { isStorm, nextModeChangeTime } = useOceanStatus();
  const chainNowSec = useBlockchainNowSec();
  const [countdown, setCountdown] = useState<string>('');
  const [topHunters, setTopHunters] = useState<Array<{
    fishId: number;
    fishName: string;
    avatarUrl?: string;
    receivedFromHuntValue?: number;
  }>>([]);
  const [topHuntersLoading, setTopHuntersLoading] = useState(false);
  const walletPriority = useMemo(() => ['Tonkeeper', 'TON Wallet', 'MyTonWallet'], []);
  const installUrls = useMemo(
    () => ({
      Tonkeeper: 'https://tonkeeper.com/',
      'TON Wallet': 'https://wallet.ton.org/',
      MyTonWallet: 'https://mytonwallet.io/',
    }),
    []
  );

  const mobileWalletOptions = useMemo(() => {
    const normalized = wallets.map((wallet) => ({
      name: wallet.adapter.name,
      icon: wallet.adapter.icon,
      readyState: wallet.readyState,
      wallet,
    }));
    const prioritySet = new Set(walletPriority.map((n) => n.toLowerCase()));
    const prioritized = walletPriority
      .map((p) => normalized.find((w) => w.name.toLowerCase() === p.toLowerCase()))
      .filter((w): w is (typeof normalized)[number] => Boolean(w));
    const rest = normalized.filter((w) => !prioritySet.has(w.name.toLowerCase()));
    return [...prioritized, ...rest];
  }, [walletPriority, wallets]);

  const handleMobileWalletSelect = async (walletOption: (typeof mobileWalletOptions)[number]) => {
    if (connected || connecting) return;
    try {
      if (walletOption.readyState !== WalletReadyState.Unsupported) {
        select(walletOption.wallet.adapter.name);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await connect().catch((error) => {
          console.error('WalletDropdown.handleWalletSelect connect error:', error);
        });
        closeMobileMenu();
      } else {
        const url = installUrls[walletOption.name as keyof typeof installUrls];
        if (url && typeof window !== 'undefined') {
          window.open(url, '_blank');
        }
      }
    } catch (error) {
    }
  };

  const languageLabel = useMemo(
    () => (language === 'ru'
      ? t.languages?.russian ?? 'Русский'
      : t.languages?.english ?? 'English'),
    [language, t.languages]
  );

  const shortWallet = useMemo(() => {
    if (!publicKey) return '';
    const addr = publicKey.toBase58();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, [publicKey]);

  useEffect(() => {
    if (!nextModeChangeTime) {
      setCountdown('');
      return;
    }
    const diff = Math.max(0, nextModeChangeTime - chainNowSec);
    setCountdown(formatDurationHMS(diff));
  }, [nextModeChangeTime, chainNowSec]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTopHuntersLoading(true);
      try {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const res = await fetchCompat(base, '/api/events?ocean=OceanTON&limit=200');
        if (!res.ok) return;
        const data = await res.json();
        const raw: any[] = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        const hunted = raw.filter((item) => item?.eventType === 'fish_hunted');
        const score = new Map<number, { fishId: number; fishName: string; receivedFromHuntValue: number }>();
        for (const item of hunted) {
          const hunterId = Number(item?.payload?.actorFishId || 0);
          if (!hunterId) continue;
          const prev = score.get(hunterId) || { fishId: hunterId, fishName: `Fish #${hunterId}`, receivedFromHuntValue: 0 };
          prev.receivedFromHuntValue += 1;
          score.set(hunterId, prev);
        }
        const mapped = Array.from(score.values())
          .sort((a, b) => b.receivedFromHuntValue - a.receivedFromHuntValue)
          .slice(0, 10)
          .map((item) => ({ ...item, avatarUrl: undefined }));
        if (!cancelled) {
          setTopHunters(mapped);
        }
      } catch (error) {
      } finally {
        if (!cancelled) setTopHuntersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Treat unknown (null) status as calm to ensure banner is always visible
  const resolvedIsStorm = isStorm === null ? false : isStorm;
  const statusText = resolvedIsStorm ? 'STORM HERE' : 'OCEAN CALM';
  const topHuntersSegments = useMemo(() => {
    if (topHunters.length < 3) return [];
    return [...topHunters, ...topHunters];
  }, [topHunters, topHuntersLoading, language]);

  const closeAllDropdowns = () => {
    setIsProfileDropdownOpen(false);
    setIsLanguageDropdownOpen(false);
  };

  const openTonConnect = async () => {
    if (publicKey || connecting) return;
    try {
      await connect();
    } catch (error) {
      console.error('TON wallet connect failed', error);
    }
  };

  // Глобальный хэндлер, чтобы открыть меню "Подключить кошелёк"
  // при клике по CTA на лендинге (Start the hunt).
  useEffect(() => {
    const handleOpenWalletMenu = () => {
      closeAllDropdowns();
      if (publicKey) return;

      openTonConnect();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cryptofish-open-wallet-menu', handleOpenWalletMenu);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('cryptofish-open-wallet-menu', handleOpenWalletMenu);
      }
    };
  }, [publicKey, connecting, connect]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
    setMobileMenuView('main');
  };

  const toggleMobileMenu = () => {
    closeAllDropdowns();
    setIsMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setMobileMenuView('main');
        document.body.style.overflow = next ? 'hidden': '';
      }
      return next;
    });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  const renderMobileMainMenu = () => (
    <div className="rounded-[24px] border border-[#2B2B2B] bg-[#1C1B20] p-6 space-y-6 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between">
        <span className="font-sf-pro-display text-[24px] font-bold leading-[1.1] tracking-[-0.01em] text-white">
          {t.menu}
        </span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#252429] text-white"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        >
          <X size={18} strokeWidth={1.6} />
        </button>
      </div>
      {publicKey ? (
        <div className="rounded-[18px] border border-[#2B2B2B] bg-[#151418] px-5 py-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1C1B20]">
                <img src="/img/icon-wallet-new.svg" alt="wallet" className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-[6px]">
                <span className="font-sf-pro-display text-[18px] font-bold leading-[1.2] text-white">
                  {t.profile?.wallet ?? 'Wallet'}
                </span>
                <span className="font-sf-pro-display text-[16px] font-semibold leading-[1.2] text-[#0088FF]">
                  {shortWallet || 'TON wallet'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await disconnect();
                closeMobileMenu();
              } catch (error) {
              }
            }}
            className="mt-1 flex w-full items-center justify-center rounded-[14px] bg-[#101014] px-4 py-3 text-[15px] font-sf-pro-display font-bold tracking-[-0.03em] text-white transition-colors hover:bg-[#2A2A2E]"
          >
            {t.disconnectWallet}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="flex items-center gap-4 rounded-[18px] bg-[#0088FF] px-5 py-4 text-left transition-colors hover:bg-[#0a7ae0]"
          onClick={async () => {
            await openTonConnect();
            closeMobileMenu();
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <img src="/img/icon-wallet-new.svg" alt="wallet" className="h-6 w-6" />
          </div>
          <div className="flex flex-1 flex-col gap-[6px]">
            <span className="font-sf-pro-display text-[18px] font-bold leading-[1.2] text-white">
              {t.connectWalletTitle}
            </span>
            <span className="text-[13px] font-medium text-white/70">{t.signIn}</span>
          </div>
          <span className="text-[20px] font-bold text-white/70">›</span>
        </button>
      )}
      <button
        type="button"
        onClick={toggleLanguage}
        className="flex w-full items-center gap-4 rounded-[18px] bg-[#252429] px-5 py-4 text-left transition-colors hover:bg-[#313037]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111013] text-sm font-semibold text-white">
          {language.toUpperCase()}
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="font-sf-pro-display text-[18px] font-bold leading-[1.2] text-white">
            {languageLabel}
          </span>
          <span className="text-[13px] font-medium text-[#8F8F8F]">
              Language
          </span>
        </div>
      </button>

      <Link
        to="/about-game"
        className="flex items-center gap-4 rounded-[18px] bg-[#252429] px-5 py-4 transition-colors hover:bg-[#313037]"
        onClick={closeMobileMenu}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111013] text-white">
          <span className="text-lg font-bold">?</span>
        </div>
        <div className="flex flex-1 flex-col gap-[6px] text-left">
          <span className="font-sf-pro-display text-[18px] font-bold leading-[1.2] text-white">
            About
          </span>
        </div>
        <span className="text-[18px] font-bold text-[#3E3E44]">›</span>
      </Link>

      {connected ? <Link
        to="/my-fish"
        className="flex items-center gap-4 rounded-[18px] bg-[#252429] px-5 py-4 transition-colors hover:bg-[#313037]"
        onClick={closeMobileMenu}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111013] text-white">
          <User size={18} strokeWidth={1.6} />
        </div>
        <div className="flex flex-1 flex-col gap-[6px] text-left">
          <span className="font-sf-pro-display text-[18px] font-bold leading-[1.2] text-white">
            {t.profile?.widgetTitle ?? t.profile?.title ?? 'My profile'}
          </span>
          <span className="text-[13px] font-medium text-[#8F8F8F]">{t.myFishTitle}</span>
        </div>
        <span className="text-[18px] font-bold text-[#3E3E44]">›</span>
      </Link> : null}
    </div>
  );

  const renderMobileWalletMenu = () => (
    <div className="rounded-[24px] border border-[#2B2B2B] bg-[#1C1B20] p-6 space-y-5 shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#252429] text-white"
          onClick={() => setMobileMenuView('main')}
          aria-label="Back to menu"
        >
          <ChevronLeft size={18} strokeWidth={1.6} />
        </button>
        <span className="font-sf-pro-display text-[20px] font-bold leading-[1.2] tracking-[-0.01em] text-white">
          {t.connectWalletTitle}
        </span>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#252429] text-white"
          onClick={closeMobileMenu}
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.6} />
        </button>
      </div>
      <div className="flex w-full justify-center">
        <div className="w-full max-w-[312px] space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {mobileWalletOptions.map((walletOption, index) => {
            const isTrust = walletOption.name.toLowerCase().includes('trust');
            const iconSrc = isTrust ? '/img/wallets/trust.png' : walletOption.icon;
            const iconSizeClass = isTrust ? 'w-10 h-10' : 'w-8 h-8';
            return (
              <button
                key={`${walletOption.name}-${index}`}
                type="button"
                onClick={() => handleMobileWalletSelect(walletOption)}
                disabled={connecting}
                className="w-full flex items-center gap-4 rounded-[14px] bg-[#252429] px-4 py-3 text-left transition-colors hover:bg-[#313037] disabled:opacity-60"
              >
                <div className="w-12 h-12 bg-[#1C1B20] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {iconSrc ? (
                    <img
                      src={iconSrc}
                      alt={walletOption.name}
                      className={`${iconSizeClass} object-contain`}
                    />
                  ) : (
                    <span className="text-[18px] font-sf-pro-display text-white">
                      {walletOption.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-[4px]">
                  <span className="text-[17px] font-bold leading-[1.2] text-white font-sf-pro-display">
                    {walletOption.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const countdownMapped = <div className={styles.countdown}>{
    countdown.split(':').map((part, index) => (
      <Fragment key={index}>
        {index !== 0 ? <span className="px-[5px]">:</span> : ''}
        <div className="flex">{part.split('').map((num, i) => (
          <div key={`${index}_${i}`} className="w-[39px] md:w-[45px]">{num}</div>
        ))}
        </div>
      </Fragment>
    ))}
  </div>;

  return (
    <>
      <div className="sticky top-0 z-50">
        <header className="bg-[#101014] border-[#2B2B2B] backdrop-blur-[20px]">
          <div
            className={
              isLanding && !connected
                ? 'w-full max-w-[1440px] mx-auto px-[15px] py-4 sm:px-6 lg:px-[30px] sm:py-4 lg:py-[25px]'
                : 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-[20px]'
            }
          >
            <div className="flex items-center justify-between gap-4 lg:gap-[101px]">
              {/* Logo */}
              <div className="flex-shrink-0">
                <Link to="/" className="block">
                  <CryptoFishLogo />
                </Link>
              </div>

              {/* Right side actions */}
              <div className="flex items-center justify-end gap-2">
                {/* Mobile Menu Button */}
                <button
                  className="inline-flex h-[34px] w-10 items-center justify-center rounded-lg border border-[#2B2B2B] bg-[#1C1B20] text-white transition-colors hover:bg-[#252429] lg:hidden"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X size={18} strokeWidth={1.75} /> : <User size={18} strokeWidth={1.5} />}
                </button>

                <div className="hidden lg:flex items-center gap-2">
                  <ConnectWalletButton onClick={() => void openTonConnect()} />

                  {/* Language Button with Dropdown */}
                  <DropdownMenu
                    trigger={
                      <button className="btn-primary hidden sm:block">
                        {language.toUpperCase()}
                      </button>
                    }
                    isOpen={isLanguageDropdownOpen}
                    onToggle={() => {
                      closeAllDropdowns();
                      setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                    }}
                    onClose={() => setIsLanguageDropdownOpen(false)}
                    align="right"
                  >
                    <LanguageDropdown onClose={() => setIsLanguageDropdownOpen(false)} />
                  </DropdownMenu>

                  {/* Profile Button with Dropdown */}
                  <DropdownMenu
                    trigger={
                      <ProfileButton
                        className="btn-primary hidden sm:flex"
                        style={{ padding: '9px 30px', minWidth: '60px', height: '34px' }}
                      />
                    }
                    isOpen={isProfileDropdownOpen}
                    onToggle={() => {
                      closeAllDropdowns();
                      setIsProfileDropdownOpen(!isProfileDropdownOpen);
                    }}
                    onClose={() => setIsProfileDropdownOpen(false)}
                    align="right"
                  >
                    <ProfileDropdown onClose={() => setIsProfileDropdownOpen(false)} />
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
      {showOceanStatus && (
        <div className="w-full bg-black">
          <div
            className="relative w-full h-[68.16px] sm:h-28 md:h-32 bg-cover bg-center transition-all"
            style={{
              backgroundImage: resolvedIsStorm
                ? "url('/img/storm-banner.png')"
                : "url('/img/calm-banner.png')",
            }}
            aria-label={resolvedIsStorm ? 'STORM' : 'CALM'}
            role="img"
          >
            <div className={styles.marquee} aria-hidden="true">
              <div className={styles.track}>
                {Array.from({length: 8}).map((_, index) => 
                  <div className={styles.segment} key={index}>
                    {countdown && countdownMapped}
                    <span className={styles.text}>{statusText}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {topHuntersSegments.length > 0 && <div className="w-full bg-black">
        <div
          className="relative w-full h-[40px] sm:h-[45px] md:h-[60px] bg-cover bg-center transition-all"
          style={{
            backgroundImage: "url('/img/top-fish-bg.png')",
          }}
          aria-label={language === 'ru' ? 'ТОП ОХОТНИКИ' : 'TOP HUNTERS'}
          role="img"
        >
          <div className={styles.marquee} aria-hidden="true">
            <div className={styles.track}>
              {topHuntersSegments.map((hunter, index) => {
                const name = hunter.fishName || (hunter.fishId ? `Fish #${hunter.fishId}` : '');
                const valueSol = lamportsToSol(Number(hunter.receivedFromHuntValue || 0), 2);
                return (
                  <div className={`${styles.segment} font-sf-pro-display`} key={`${hunter.fishId}-${index}`}>
                    <Link to={`/fish/${hunter.fishId}`} className={styles.hunterChip}>
                      {hunter.avatarUrl ? (
                        <img src={hunter.avatarUrl} alt={name} className={styles.hunterAvatar} />
                      ) : null}
                      <span className={styles.hunterName}>
                        {name}
                      </span>
                      <span className={styles.hunterValue}>
                        +{valueSol} SOL
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>}

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#060509]/70 backdrop-blur-[6px] lg:hidden"
            onClick={closeMobileMenu}
          />
          <div className="fixed inset-0 z-50 px-[15px] py-10 lg:hidden overflow-y-auto">
            <div className="mx-auto max-w-[360px]">
              {mobileMenuView === 'wallets' ? renderMobileWalletMenu() : renderMobileMainMenu()}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
