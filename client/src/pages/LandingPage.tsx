import { useWallet } from "../wallet/tonWallet";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AboutInfoBlock from "../components/AboutInfoBlock";
import FaqInfoBlock from "../components/FaqInfoBlock";
import FishInfoBlock from "../components/FishInfoBlock";
import SingleFishInfoBlock from "../components/SingleFishInfoBlock";
import { loadRuntimeConfig } from "../config/runtimeConfig";
import { fetchCompat } from "../shared/api/compat";
import { useLanguage } from "../contexts/LanguageContext";
import { renderTextToken } from "../helpers/render-text-token";
import { Fallback } from "../components/Fallback";
import { EventRow, EventRowView } from "../features/fish/components/OceanHappenings";
import PromoImageBlock from '../components/PromoImageBlock';
import { getApiBaseUrlSync } from '../shared/api/baseUrl';

const apiBaseUrl = getApiBaseUrlSync();

const eventsMocka = [
  {
    "id": "4",
    "eventType": "Возрождение жителя",
    "eventCode": "FishResurrected",
    "title": "Fish → Reborn",
    "fishIdForAvatar": 3,
    "avatarUrl": '7edbe7f9f936a2c2f7cb632fbab3450dc112672c.webp',
    "yourShareLamports": 300536
  },
  {
    "id": "3",
    "eventType": "Охота на жителя",
    "eventCode": "FishHunted",
    "title": "Jelly → Fish",
    "fishIdForAvatar": 2,
    "avatarUrl": "20e419a9cc0609db88eac8535c87a6e31967966e.webp",
    "hunter": {
      "id": 1,
      "name": "Jelly",
      "avatarFile": "20e419a9cc0609db88eac8535c87a6e31967966e.webp",
      "avatarUrl": "20e419a9cc0609db88eac8535c87a6e31967966e.webp"
    },
    "prey": {
      "id": 2,
      "name": "Fish",
      "avatarFile": "7edbe7f9f936a2c2f7cb632fbab3450dc112672c.webp",
      "avatarUrl": "7edbe7f9f936a2c2f7cb632fbab3450dc112672c.webp"
    },
    "yourShareLamports": 3519736
  },
  {
    "id": "2",
    "eventType": "Установка охотничьей метки",
    "eventCode": "HuntingMarkPlaced",
    "title": "Jelly → Fish",
    "fishIdForAvatar": 2,
    "avatarUrl": "20e419a9cc0609db88eac8535c87a6e31967966e.webp",
    "hunter": {
      "id": 1,
      "name": "Jelly",
      "avatarFile": "20e419a9cc0609db88eac8535c87a6e31967966e.webp",
      "avatarUrl": "20e419a9cc0609db88eac8535c87a6e31967966e.webp"
    },
    "prey": {
      "id": 2,
      "name": "Fish",
      "avatarFile": "7edbe7f9f936a2c2f7cb632fbab3450dc112672c.webp",
      "avatarUrl": "7edbe7f9f936a2c2f7cb632fbab3450dc112672c.webp"
    },
    "yourShareLamports": 3005364
  },
  {
    "id": "5",
    "eventType": "Кормление жителя",
    "eventCode": "FishFed",
    "title": "Hungry",
    "fishIdForAvatar": 4,
    "avatarUrl": "d71130161b55ef49b3c09e78f5d2ee9c1d338927.webp",
    "yourShareLamports": 3305900
  },
  {
    "id": "1",
    "eventType": "Создание жителя",
    "eventCode": "FishCreated",
    "title": "Jelly",
    "fishIdForAvatar": 1,
    "avatarUrl": "20e419a9cc0609db88eac8535c87a6e31967966e.webp",
    "yourShareLamports": 300536
  }
].map(e => ({
  ...e, 
  avatarUrl: `${apiBaseUrl}/static/avatars/thumbs/${e.avatarUrl}`, 
  hunter: e.hunter ? {...e.hunter, avatarUrl: `${apiBaseUrl}/static/avatars/thumbs/${e.hunter.avatarFile}`} : undefined,
  prey: e.prey ? {...e.prey, avatarUrl: `${apiBaseUrl}/static/avatars/thumbs/${e.prey.avatarFile}`} : undefined,
}));

export const LandingPage = () => {
  const { connected, publicKey } = useWallet();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [landingStats, setLandingStats] = useState<{
      oceanVolume: string;
      fishCount: string;
      victims7d: string;
      redistributed: string;
    } | null>(null);
  
  useEffect(() => {
    if (connected) return;
    let cancelled = false;
    const loadStats = async () => {
      try {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const res = await fetchCompat(base, '/api/v1/ocean/summary');
        if (res.ok) {
          const j = await res.json();
          const data = j?.data || j;
          if (cancelled) return;
            
          const tvlLamports = BigInt(data?.tvlLamports || data?.balanceLamports || '0');
          const tvlSol = Number(tvlLamports) / 1_000_000_000;
          const activeFish = Number(data?.activeFish || data?.totalFishCount || 0);
          const eaten7d = Number(data?.eaten7d || 0);
          const redistributedLamports = BigInt(data?.redistributedAllLamports || '0');
          const redistributedSol = Number(redistributedLamports) / 1_000_000_000;
            
          setLandingStats({
            oceanVolume: tvlSol.toFixed(2),
            fishCount: String(activeFish),
            victims7d: String(eaten7d),
            redistributed: redistributedSol.toFixed(2),
          });
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Failed to load landing stats:', e);
        }
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connected]);
  
  // Redirect when wallet becomes connected.
  // Источник истины по прогрессу пользователя — сервер (/api/me/*),
  // а не контрактные/кошелёк-адресные эндпоинты.
  useEffect(() => {
    if (!connected) return;
  
    let cancelled = false;
    (async () => {
      try {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const token = (typeof window !== 'undefined'
          ? (window.localStorage.getItem('authToken') || window.localStorage.getItem('accessToken'))
          : null);
        const res = await fetchCompat(base, '/api/me/fish', {
          cache: 'no-store',
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (cancelled) return;

        if (!res.ok) return;
        const fishList = await res.json();
        const firstTime = !Array.isArray(fishList) || fishList.length === 0;

        navigate(firstTime ? '/start-game' : '/my-fish', { replace: true });
      } catch (e) {
        if (!cancelled) console.error('Failed to check user fish list:', e);
      }
    })();
  
    return () => {
      cancelled = true;
    };
  }, [connected, navigate]);
  
  if (!connected) {
    const handleCtaClick = () => {
      // Открываем наше кастомное меню "Подключить кошелёк" из Header
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cryptofish-open-wallet-menu'));
      }
    };
    const statsConfig = [
      {
        key: 'oceanVolume' as const,
        imagePng: 'https://fish-huting.pro/img/landing-page/stat-ocean-volume.png',
        imageWebp: 'https://fish-huting.pro/img/landing-page/stat-ocean-volume.webp',
      },
      {
        key: 'fishCount' as const,
        imagePng: 'https://fish-huting.pro/img/landing-page/stat-fish-count.png',
        imageWebp: 'https://fish-huting.pro/img/landing-page/stat-fish-count.webp',
      },
      {
        key: 'victims7d' as const,
        imagePng: 'https://fish-huting.pro/img/landing-page/stat-victims.png',
        imageWebp: 'https://fish-huting.pro/img/landing-page/stat-victims.webp',
      },
      {
        key: 'redistributed' as const,
        imagePng: 'https://fish-huting.pro/img/landing-page/stat-players.png',
        imageWebp: 'https://fish-huting.pro/img/landing-page/stat-players.webp',
      },
    ];
    return (
      <main className="relative flex w-full flex-col bg-[#101014] text-white gap-[10px] lg:gap-[20px]">
        <section className="
        relative 
        grid grid-rows-[auto_auto_auto] items-center justify-items-center gap-[10px] 
        w-full min-h-[calc(100vh-68px)] lg:min-h-[calc(100vh-86px)]
        p-[20px] sm:px-[30px] 
        text-center text-[#ffffff] 
        overflow-hidden 
        first_section">
          <img src="https://fish-huting.pro/img/landing-page/landing-tics.png" alt="landing tics" className="max-w-[90%] lg:max-w-[100%]" width={412} height={110} />
          <div className="flex flex-col items-center justify-center self-start">
            {/* <div
              className="text-[#0088FF] uppercase text-[42px] sm:text-[58px] md:text-[68px] lg:text-[78px] xl:text-[100px] min-[2000px]:text-[120px] leading-[1]"
              style={{
                fontFamily:
                "'EuropaGrotBoldEx', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
                }}
                >
                FISH HUNT
                </div> */}
            <h1 className="mb-[32px] text-[40px] sm:text-[48px] md:text-[54px] lg:text-[64px] font-bold max-w-[925px] leading-[0.98]">
              {renderTextToken(t.welcomeTitle)}
            </h1>
            <p className="max-w-[830px] text-[17px] sm:text-[18px] lg:text-[20px] leading-[1.1] lg:leading-[1.3]">
              {renderTextToken(t.welcomeDescription)}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleCtaClick}
              className="flex h-[82px] min-[2000px]:h-[140px] w-full min-w-[300px] max-w-[355px] sm:max-w-[390px] sm:min-w-[390px] min-[2000px]:max-w-[520px] min-[2000px]:min-w-[520px] items-center justify-center rounded-full bg-[#0088FF] px-9 min-[2000px]:px-16 text-[23px] min-[2000px]:text-[44px] font-sf-pro-display font-bold tracking-[-0.02em] text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0A7AE0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#44B0FF]"
            >
              {t.landingCta}
            </button>
          </div>
        </section>
        <section className="relative z-20 w-full">
          <div className="mx-auto w-full max-w-[1440px] rounded-[48px] bg-[#1C1B20] px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
              {statsConfig.map(({ key, imagePng, imageWebp }) => {
                const stat = t.landingStats[key];
                if (!stat) return null;
                // Используем данные из API, если они загружены, иначе fallback на статические значения
                let displayValue = stat.value;
                if (landingStats) {
                  if (key === 'oceanVolume') displayValue = landingStats.oceanVolume;
                  else if (key === 'fishCount') displayValue = landingStats.fishCount;
                  else if (key === 'victims7d') displayValue = landingStats.victims7d;
                  else if (key === 'redistributed') displayValue = landingStats.redistributed;
                }
                return (
                  <div
                    key={key}
                    className="flex items-center gap-5 rounded-[32px] bg-[#242328] px-6 py-6 transition-transform duration-200 hover:-translate-y-1 sm:px-7 sm:py-7"
                  >
                    <div className="relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-[28px]">
                      <picture className="block h-full w-full">
                        <source srcSet={imageWebp} type="image/webp" />
                        <img
                          src={imagePng}
                          alt=""
                          className="h-full w-full object-cover"
                          aria-hidden="true"
                        />
                      </picture>
                    </div>
                    <div className="flex flex-col gap-3">
                      <span className="font-sf-pro-display text-[40px] font-bold leading-none tracking-[-0.04em] text-white sm:text-[44px]">
                        {displayValue}
                      </span>
                      <span className="font-sf-pro-display text-[16px] font-normal leading-[1.3] tracking-[-0.03em] text-[#BDBABA] sm:text-[16px]">
                        {stat.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
  
            <button
              type="button"
              onClick={() => navigate('/top-fish')}
              className="mt-4 xl:mt-6 mx-auto flex h-[80px] w-[300px] sm:w-full sm:max-w-[390px] items-center justify-center rounded-full bg-[#0088FF] px-10 text-[24px] font-sf-pro-display font-bold tracking-[-0.04em] text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0A7AE0]"
            >
              {t.landingStats.oceanRatingButton}
            </button>
  
          </div>
        </section>
        <section className="relative z-10 w-full">
          <div className="mx-auto grid lg:grid-cols-2 w-full max-w-[1440px] gap-2 lg:gap-2 items-center">
            <div className="flex w-full flex-col gap-[30px] rounded-[14px] lg:rounded-[60px] bg-[#1C1B20] px-3 py-6 sm:px-10 sm:py-12 text-center lg:h-[700px] lg:px-14 lg:py-16">
              <div className="flex flex-col items-center gap-2">
                <a href="/blockhat-security-audit.pdf" target="_blank" rel="noreferrer" className="h-[55px] w-[200px] bg-[#101013] rounded-[30px]">
                  <div
                    className="h-full w-[170px] mx-auto"
                    style={{
                      backgroundImage: "url('https://fish-huting.pro/img/blockhat-security-logo.svg')",
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                    }}
                    role="img"
                    aria-label="Audited by Blockhat Security"
                  />
                </a>
                <span className="font-sf-pro-display text-[13px] font-bold leading-[1.3] tracking-[-0.02em] text-white">
                      Audited by Blockhat Security
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center items-center gap-7">
                <h2 className="max-w-[700px] font-sf-pro-display font-normal leading-[1.05] sm:leading-[1.02] tracking-[-0.01em] text-white text-[34px] sm:text-[36px] md:text-[38px] lg:text-[40px] min-[1200px]:text-[44px]">
                  {renderTextToken(t.landingAbout.title)}
                </h2>
                <div className="max-w-[550px] font-sf-pro-display text-[18px] sm:text-[20px] leading-[1.2] tracking-[-0.01em] text-[#DEDEDE]">
                  {renderTextToken(t.landingAbout.description)}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCtaClick}
                className="mt-8 sm:mt-0 mx-auto flex h-[80px] w-[300px] sm:w-full sm:max-w-[390px] items-center justify-center rounded-full bg-[#0088FF] px-10 text-[24px] font-sf-pro-display font-bold tracking-[-0.04em] text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0A7AE0]"
              >
                {t.landingAbout.cta ?? t.createFish}
              </button>
            </div>
            <FishInfoBlock
              background="https://fish-huting.pro/img/landing-page/landing-cute-fish.webp"
              badge={t.landingHowItWorks.steps.createFish.badge}
              title={t.landingHowItWorks.steps.createFish.title}
              description={t.landingHowItWorks.steps.createFish.description}
              align="left"
            />
          </div>
        </section>
        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <div className="w-full lg:w-[715px]">
              <FishInfoBlock
                background={'https://fish-huting.pro/img/landing-page/landing-feed-fish.webp'}
                badge={t.landingHowItWorks.steps.feedFish.badge}
                title={t.landingHowItWorks.steps.feedFish.title}
                description={t.landingHowItWorks.steps.feedFish.description}
              />
            </div>
            <div className="w-full lg:w-[715px]">
              <FishInfoBlock
                background={'https://fish-huting.pro/img/landing-page/landing-hunt-fish.webp'}
                badge={t.landingHowItWorks.steps.hunt.badge}
                title={t.landingHowItWorks.steps.hunt.title}
                description={t.landingHowItWorks.steps.hunt.description}
              />
            </div>
          </div>
        </section>
        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-[10px] lg:gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <div className="w-full lg:w-[715px]">
              <AboutInfoBlock
                titleSpacingMobile="1rem"
                ctaSpacingMobile="0.5rem"
                title={t.landingPassive.left.title}
                description={t.landingPassive.left.description}
                badge={t.landingPassive.left.badge}
                cta={t.landingPassive.left.cta}
                ctaSpacing="2rem"
                onCtaClick={handleCtaClick}
                titleWidth={530}
                descriptionStyle={{
                  fontSize: '18px',
                  lineHeight: 1.4,
                  color: '#DEDEDE',
                }}
                descriptionBoldPhrases={t.landingPassive.left.descriptionBold}
              />
            </div>
            <div className="w-full lg:w-[715px]">
              <div className="relative flex min-h-[540px] h-full w-full items-center justify-center overflow-hidden rounded-[14px] lg:rounded-[60px] bg-[#0088FF] px-6 py-8 sm:px-10 sm:py-10">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage: "url('https://fish-huting.pro/img/landing-page/landing-about-blue.webp')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden="true"
                />
                <div className="relative z-10 flex h-full w-full flex-col items-center justify-between">
                  <h2 className="mt-2 text-center font-sf-pro-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-[38px]">
                    {renderTextToken(t.landingPassive.right.title)}
                  </h2>
                  <div className="w-full max-w-[460px] mt-4 mb-8 flex flex-1 items-center justify-center flex-col gap-[12px] rounded-2xl bg-[#1C1B20] p-5 sm:p-6 ">
                    {
                      eventsMocka.map((ev, idx) => {
                        const bg = ev.hunter?.avatarUrl || ev.avatarUrl || 'https://fish-huting.pro/img/ocean-event-1.png';
                        const code = ev.eventCode;
                        const subtitle = (() => {
                          switch (code) {
                            case 'FishHunted': return t.ocean?.goodHunt ?? 'Successful hunt';
                            case 'FishCreated': return t.ocean?.newInOcean ?? 'New in the ocean';
                            case 'FishExited': return t.ocean?.leftOcean ?? 'Left the ocean';
                            case 'FishResurrected': return (t.eventNames as any)?.FishResurrected || 'Fish resurrected';
                            default: return (t.eventNames as any)?.[code] || (t.eventNames as any)?.Unknown || code;
                          }
                        })();
                        const shareSol = (ev.yourShareLamports || 0) / 1_000_000_000;
                        const shareValue = shareSol > 0 ? `+${shareSol.toFixed(6)} TON` : '+0.000000 TON';
                        const row: EventRow = { bg, title: ev.title, subtitle, shareLabel: t.ocean?.yourShare ?? 'Your share', shareValue };
                        const targetId: number | undefined = (ev as any).hunter?.id || (ev as any).prey?.id || (ev as any).fishIdForAvatar;
                        const onOpen = typeof targetId === 'number' && Number.isFinite(targetId) ? () => navigate(`/fish/${targetId}`) : undefined;
                        return <EventRowView key={ev.id || idx} e={row} onOpen={onOpen} showShare={true} />;
                      })
                    }
                  </div>
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className="flex h-[72px] w-full max-w-[320px] items-center justify-center rounded-full bg-[#101014] px-10 text-[20px] font-sf-pro-display font-bold tracking-[-0.03em] text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-black/80"
                  >
                    {t.landingPassive.right.cta}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-[10px] lg:gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <div className="w-full lg:w-[715px]">
              <AboutInfoBlock
                title={t.landingTrust.transparency.title}
                titleSpacingMobile="2.5rem"
                description={t.landingTrust.transparency.description}
                badge={t.landingTrust.transparency.badge}
                cta={t.landingTrust.transparency.cta}
                ctaSpacingMobile="2.7rem"
                onCtaClick={handleCtaClick}
                titleWidth={480}
                descriptionStyle={{
                  fontSize: '16px',
                  lineHeight: 1.4,
                  color: '#DEDEDE',
                }}
              />
            </div>
            <div className="w-full lg:w-[715px]">
              <FishInfoBlock
                key="trust-proof"
                background="https://fish-huting.pro/img/landing-page/landing-trust-bg.webp"
                title={t.landingTrust.proof.title}
                description={t.landingTrust.proof.description}
                showBadge={false}
              />
            </div>
          </div>
        </section>
        <SingleFishInfoBlock
          icon="/img/landing-page/landing-exit-icon.webp"
          title={t.landingExit.title}
          description={t.landingExit.description}
        />
        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-[10px] lg:gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <div className="w-full lg:w-[715px]">
              <AboutInfoBlock
                title={t.landingAbout2.title}
                description={t.landingAbout2.description}
                badge={t.landingAbout2.badge}
                cta={t.landingAbout2.cta}
                onCtaClick={() => {
                  window.open(`https://tonscan.org/address/${process.env.REACT_APP_PROGRAM_ID}`);
                  // window.open('https://solscan.io/account/B1osUCap5eJ2iJnbRqfCQB87orhJM5EqZqPcGMbjJvXz');
                }}
                titleSpacingMobile="4.3rem"
                ctaSpacing="4.3rem"
                ctaSpacingMobile="3.7rem"
              />
            </div>
            <div className="w-full lg:w-[715px]">
              <FishInfoBlock
                key="about-protect"
                background="https://fish-huting.pro/img/landing-page/landing-feed-protect.webp"
                title={t.landingHowItWorks.steps.rules.title}
                description={t.landingHowItWorks.steps.rules.description}
              />
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-[10px] lg:gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <div className="w-full lg:w-[715px]">
              <AboutInfoBlock
                title={t.landingFairness.title}
                description={t.landingFairness.description}
                badge={t.landingFairness.badge}
                cta={t.landingFairness.cta}
                titleSpacingMobile="2.5rem"
                ctaSpacingMobile="4.7rem"
                onCtaClick={handleCtaClick}
                titleWidth={480}
              />
            </div>
            <div className="w-full lg:w-[715px]">
              <PromoImageBlock
                image="https://fish-huting.pro/img/landing-page/landing-satisfaction-bg.webp"
                alt=""
              />
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-[10px] lg:gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <FaqInfoBlock
              questions={t.landingFaq.questions}
              answers={t.landingFaq.answers}
            />
          </div>
        </section>

        <section className="relative z-10 w-full">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-[10px] lg:gap-2 lg:flex-row lg:justify-center lg:gap-2">
            <div className="w-full lg:w-[715px]">
              <AboutInfoBlock
                title={t.landingPromo.title}
                description={t.landingPromo.description}
                badge={t.landingPromo.tag}
                cta={t.landingPromo.cta}
                onCtaClick={handleCtaClick}
                titleWidth={530}
                titleSpacing="4.5rem"
                ctaSpacing="4rem"
              />
            </div>
            <div className="w-full lg:w-[715px]">
              <img
                src='https://fish-huting.pro/img/landing-page/landing-storm-bg.webp'
                alt={t.landingPromoVisual.alt}
                className="w-full h-full max-h-[800px] object-cover rounded-[14px] lg:rounded-[60px]"
              />
            </div>
          </div>
        </section>
      </main>
    );
  }
  
  // Already redirected
  return <Fallback />;
};
