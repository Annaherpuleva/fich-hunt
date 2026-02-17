import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useWallet } from '../../../wallet/tonWallet';
import { lamportsToSol } from '../../../core/utils/format';
import { loadRuntimeConfig } from '../../../config/runtimeConfig';
import { fetchCompat } from '../../../shared/api/compat';
import bs58 from 'bs58';
import { useTx } from '../../../components/TxOverlay';
import type { FishEntity } from '../../../entities/fish/types';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-[#1C1B20] border border-[#1E1E1E] rounded-2xl p-6 ${className || ''}`}>{children}</div>
);

const Badge: React.FC<{ children: React.ReactNode; onClick?: () => void }> = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center justify-center px-3 py-0.5 rounded-md bg-[#404040] text-[#EBEBEB] text-sm">
    {children}
  </button>
);

const Row: React.FC<{
  icon: string;
  children: React.ReactNode;
  iconWidth?: number;
  iconHeight?: number;
}> = ({ icon, children, iconWidth = 24, iconHeight = 24 }) => (
  <div className="flex items-center gap-3">
    <img src={icon} width={iconWidth} height={iconHeight} alt="icon" />
    <div className="text-white text-[14px] leading-[1.4] tracking-[-0.01em]">{children}</div>
  </div>
);

type MyProfilePanelProps = {
  fishItems: FishEntity[];
  loading?: boolean;
};

const MyProfilePanel: React.FC<MyProfilePanelProps> = ({ fishItems, loading }) => {
  const { publicKey, signMessage } = useWallet();
  const { runTx } = useTx();
  const { t } = useLanguage();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [tg, setTg] = useState<string>('');
  const [tw, setTw] = useState<string>('');
  const [dc, setDc] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [socials, setSocials] = useState<{ telegram?: string; x?: string; discord?: string }>({});
  const [errTg, setErrTg] = useState<boolean>(false);
  const [errX, setErrX] = useState<boolean>(false);
  const [errDc, setErrDc] = useState<boolean>(false);
  const [oceanTvlLamports, setOceanTvlLamports] = useState<bigint>(0n);
  const [activeFishCount, setActiveFishCount] = useState<number>(0);
  const [eaten24hCount, setEaten24hCount] = useState<number | null>(null);
  const [redistributed24hLamports, setRedistributed24hLamports] = useState<bigint>(0n);
  const lastProfileWalletRef = useRef<string | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSummaryWalletRef = useRef<string | null>(null);

  const isEmpty = (v?: string) => !v || v.trim().length === 0;
  const tgRe = /^(?:https?:\/\/t\.me\/[A-Za-z0-9_]{5,32}|@?[A-Za-z0-9_]{5,32})$/i;
  const xRe = /^(?:https?:\/\/(?:x\.com|twitter\.com)\/[A-Za-z0-9_]{1,15}|@?[A-Za-z0-9_]{1,15})$/i;
  const dcRe = /^(?:https?:\/\/discord\.(?:gg|com\/invite)\/[A-Za-z0-9-]+|[A-Za-z0-9._]{2,32}(?:#[0-9]{4})?|https?:\/\/discord\.com\/users\/\d{5,20})$/i;
  const validTg = (v?: string) => isEmpty(v) || (v!.trim().length <= 128 && tgRe.test(v!.trim()));
  const validX = (v?: string) => isEmpty(v) || (v!.trim().length <= 128 && xRe.test(v!.trim()));
  const validDc = (v?: string) => isEmpty(v) || (v!.trim().length <= 128 && dcRe.test(v!.trim()));

  const walletAddr = publicKey?.toBase58() || null;

  useEffect(() => {
    (async () => {
      try {
        if (lastProfileWalletRef.current === walletAddr) return;
        lastProfileWalletRef.current = walletAddr;
        if (!walletAddr) { setSocials({}); return; }
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const r = await fetchCompat(base, `/api/v1/wallet/${walletAddr}/profile`);
        if (!r.ok) return;
        const j = await r.json();
        const s = j?.data?.socials || j?.socials || {};
        setSocials({
          telegram: typeof s.telegram === 'string' && s.telegram.length ? s.telegram : undefined,
          x: typeof s.x === 'string' && s.x.length ? s.x : undefined,
          discord: typeof s.discord === 'string' && s.discord.length ? s.discord : undefined,
        });
        // если не в режиме редактирования — синхронизируем инпуты
        if (!editMode) {
          setTg(s.telegram || '');
          setTw(s.x || '');
          setDc(s.discord || '');
        }
      } catch {}
    })();
  }, [walletAddr, editMode]);

  // Fetch ocean summary (TVL/active/eaten/redistributed). Один таймер на текущий кошелёк/гостя.
  useEffect(() => {
    let cancelled = false;
    const addrKey = walletAddr || 'guest';
    if (lastSummaryWalletRef.current === addrKey && statsTimerRef.current) {
      return () => { cancelled = true; };
    }
    lastSummaryWalletRef.current = addrKey;
    const loadStats = async () => {
      if (cancelled) return;
      try {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const ro = await fetchCompat(base, '/api/v1/ocean/summary');
        if (ro.ok) {
          const jo = await ro.json();
          const data = jo?.data || jo;
          const tvl = BigInt(String(data?.tvlLamports ?? data?.balanceLamports ?? 0));
          const active = Number(data?.activeFish ?? data?.totalFishCount ?? 0);
          const eaten = Number(data?.eaten7d ?? 0);
          const red = BigInt(String(data?.redistributedAllLamports ?? 0));
          if (!cancelled) {
            setOceanTvlLamports(tvl);
            setActiveFishCount(Number.isFinite(active) ? active : 0);
            setEaten24hCount(Number.isFinite(eaten) ? eaten : null);
            setRedistributed24hLamports(red);
          }
        } else if (!cancelled) {
          setOceanTvlLamports(0n);
          setActiveFishCount(0);
          setEaten24hCount(null);
          setRedistributed24hLamports(0n);
        }
      } catch {
        if (!cancelled) {
          setEaten24hCount(null);
          setRedistributed24hLamports(0n);
        }
      }
    };
    // сбросить старый таймер и прогрузить сразу
    if (statsTimerRef.current) {
      clearInterval(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    loadStats();
    statsTimerRef.current = window.setInterval(loadStats, 60_000);
    return () => {
      cancelled = true;
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
        statsTimerRef.current = null;
      }
    };
  }, [walletAddr]);

  const buildUrl = (kind: 'telegram'|'x'|'discord', v?: string) => {
    if (!v) return undefined;
    const hasProto = /^https?:\/\//i.test(v);
    if (hasProto) return v;
    const val = v.startsWith('@') ? v.slice(1) : v;
    if (kind === 'telegram') return `https://t.me/${val}`;
    if (kind === 'x') return `https://x.com/${val}`;
    return `https://discord.com/${v}`;
  };
  const short = useMemo(() => {
    const a = publicKey?.toBase58();
    return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '0x0000...0000';
  }, [publicKey]);

  // Баланс считаем только по живым рыбам из /wallet/:addr/fish
  const totalSol = useMemo(() => {
    const totalLamports = (fishItems || []).reduce<number>((acc, f: any) => {
      const isAlive = f?.alive !== false; // null/undefined считаем живой, false — мёртв
      if (!isAlive) return acc;
      const v = Number(f?.valueLamports || 0);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    return lamportsToSol(totalLamports, 3);
  }, [fishItems]);

  const oceanTvlSol = useMemo(
    () => lamportsToSol(Number(oceanTvlLamports || 0n), 3),
    [oceanTvlLamports]
  );
  const isLoading = loading ?? (!publicKey || (fishItems || []).length === 0);

  if (isLoading && !editMode) {
    return (
      <Card>
        <div className="flex flex-col gap-4">
          <div className="animate-pulse" style={{ width: 200, height: 24, borderRadius: 8, background: '#2A2A2E' }} />
          <div className="grid grid-cols-1 gap-3">
            <div className="animate-pulse" style={{ width: '100%', height: 40, borderRadius: 8, background: '#2A2A2E' }} />
            <div className="animate-pulse" style={{ width: '100%', height: 40, borderRadius: 8, background: '#2A2A2E' }} />
            <div className="animate-pulse" style={{ width: '100%', height: 40, borderRadius: 8, background: '#2A2A2E' }} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header row: Мой профиль + Изменить */}
      <div className="flex items-center justify-between gap-5">
        <div className="text-white font-bold text-[24px] leading-[1.1] tracking-[-0.05em] sm:tracking-[-0.01em]">{editMode ? (t.profile?.editModeTitle ?? 'Введите соц.сети') : (t.profile?.widgetTitle ?? t.profile?.title ?? 'My profile')}</div>
        {!editMode ? (
          <Badge onClick={() => { setTg(socials.telegram || ''); setTw(socials.x || ''); setDc(socials.discord || ''); setErrTg(false); setErrX(false); setErrDc(false); setEditMode(true); }}>{t.profile?.edit ?? 'Edit'}</Badge>
        ) : (
          <Badge onClick={async () => {
            try {
              setSaving(true);
              await runTx(async () => {
                const { API_BASE_URL } = await loadRuntimeConfig();
                const base = (API_BASE_URL || '').replace(/\/$/, '');
                const addr = publicKey?.toBase58();
                if (!addr) return 'no-wallet';
                // normalize current inputs
                const nextSocials = {
                  telegram: (tg || '').trim() || undefined,
                  x: (tw || '').trim() || undefined,
                  discord: (dc || '').trim() || undefined,
                } as { telegram?: string; x?: string; discord?: string };
                // validate locally
                const vTg = validTg(nextSocials.telegram);
                const vX = validX(nextSocials.x);
                const vDc = validDc(nextSocials.discord);
                setErrTg(!vTg); setErrX(!vX); setErrDc(!vDc);
                if (!vTg || !vX || !vDc) { return 'invalid'; }
                // check if changed vs loaded socials
                const same = (nextSocials.telegram || undefined) === (socials.telegram || undefined)
                  && (nextSocials.x || undefined) === (socials.x || undefined)
                  && (nextSocials.discord || undefined) === (socials.discord || undefined);
                if (same) { setEditMode(false); return 'nochange'; }
                // 1) challenge
                const chRes = await fetchCompat(base, `/api/v1/wallet/${addr}/profile/challenge`, { method: 'POST', body: JSON.stringify({}) });
                if (!chRes.ok) throw new Error('challenge');
                const ch = await chRes.json();
                const nonce = ch?.data?.nonce ?? ch?.nonce;
                // 2) payload hash
                const socialsPayload = nextSocials;
                const payloadJson = JSON.stringify(socialsPayload);
                const payloadBytes = new TextEncoder().encode(payloadJson);
                const digest = await crypto.subtle.digest('SHA-256', payloadBytes);
                const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('');
                // 3) sign message via connected wallet adapter when available
                const message = [
                  'cryptofish:profile:update',
                  `address=${addr}`,
                  `nonce=${nonce}`,
                  `issuedAt=${ch.issuedAt ?? ''}`,
                  `expiresAt=${ch.expiresAt ?? ''}`,
                  `payloadSha256=${hex}`,
                ].join('\n');
                const msgBytes = new TextEncoder().encode(message);
                let sigAny: any;
                try {
                  if (typeof signMessage === 'function') {
                    const sig = await signMessage(msgBytes);
                    sigAny = sig;
                  }
                } catch {}
                if (!sigAny) {
                  // fallbacks
                  // @ts-ignore
                  sigAny = await (window as any)?.solana?.signMessage?.(msgBytes, 'utf8')
                    // @ts-ignore
                    ?? await (window as any)?.phantom?.solana?.signMessage?.(msgBytes, 'utf8')
                    // @ts-ignore
                    ?? await (window as any)?.backpack?.signMessage?.(msgBytes, 'utf8');
                }
                const signature = bs58.encode(sigAny?.signature || sigAny);
                // 4) PUT profile
                const putRes = await fetchCompat(base, `/api/v1/wallet/${addr}/profile`, {
                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ socials: socialsPayload, nonce, issuedAt: ch.issuedAt, expiresAt: ch.expiresAt, signature, payloadSha256: hex })
                });
                if (!putRes.ok) throw new Error('update_failed');
                setSocials(socialsPayload);
                setEditMode(false);
                return signature || 'updated';
              }, 'Сохранение профиля', { actionText: 'Сохранение профиля', showSuccessModal: false });
            } catch (_) {
            } finally { setSaving(false); }
          }}>{saving ? (t.loading ?? 'Загрузка...') : 'Готово'}</Badge>
        )}
      </div>

      {!editMode && (
        <div className="mt-5 flex flex-col gap-3">
          <Row icon="/img/icon-money.svg">{t.profile?.myBalance ?? 'My balance'}:<br/><b>{totalSol} SOL</b></Row>
          <Row icon="/img/icon-wallet-new.svg">
            <>
              <span className="text-[#fff]">{t.profile?.wallet ?? 'Wallet'}:<br/></span>
              <span className="text-[#0088FF] font-bold">{short}</span>
            </>
          </Row>
          <div className="flex flex-col gap-2">
            <div className="text-white font-bold text-[14px] tracking-[-0.03em]">{t.profile?.social ?? 'Socials'}:</div>
            <div className="flex items-center gap-2">
              {/* X */}
              {socials.x ? (
                <a href={buildUrl('x', socials.x)} target="_blank" rel="noreferrer">
                  <img src="/img/icon-x.svg" width={24} height={24} alt="x" className="opacity-100 hover:opacity-90" />
                </a>
              ) : (
                <img src="/img/icon-x.svg" width={24} height={24} alt="x" className="opacity-30 pointer-events-none" />
              )}
              {/* Telegram */}
              {socials.telegram ? (
                <a href={buildUrl('telegram', socials.telegram)} target="_blank" rel="noreferrer">
                  <img src="/img/icon-telegram.svg" width={24} height={24} alt="telegram" className="opacity-100 hover:opacity-90" />
                </a>
              ) : (
                <img src="/img/icon-telegram.svg" width={24} height={24} alt="telegram" className="opacity-30 pointer-events-none" />
              )}
              {/* Discord */}
              {socials.discord ? (
                <a href={buildUrl('discord', socials.discord)} target="_blank" rel="noreferrer">
                  <img src="/img/icon-discord.svg" width={24} height={24} alt="discord" className="opacity-100 hover:opacity-90" />
                </a>
              ) : (
                <img src="/img/icon-discord.svg" width={24} height={24} alt="discord" className="opacity-30 pointer-events-none" />
              )}
            </div>
          </div>
        </div>
      )}

      {editMode && (
        <div className="mt-4 flex flex-col gap-3">
          {/* Баланс + Соцсети подпись одной строкой из фигмы */}

          {/* Поля соцсетей */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={tg}
              onChange={(e) => setTg(e.target.value)}
              placeholder="Telegram"
              className={`h-[40px] rounded-[12px] px-6 text-[16px] outline-none ${errTg ? 'bg-[#442222] border border-red-500 text-red-200 placeholder-red-300' : 'bg-[#404040] text-[#DEDEDE] placeholder-[#DEDEDE]'}`}
            />
            <input
              type="text"
              value={tw}
              onChange={(e) => setTw(e.target.value)}
              placeholder="X"
              className={`h-[40px] rounded-[12px] px-6 text-[16px] outline-none ${errX ? 'bg-[#442222] border border-red-500 text-red-200 placeholder-red-300' : 'bg-[#404040] text-[#DEDEDE] placeholder-[#DEDEDE]'}`}
            />
            <input
              type="text"
              value={dc}
              onChange={(e) => setDc(e.target.value)}
              placeholder="Discord"
              className={`h-[40px] rounded-[12px] px-6 text-[16px] outline-none ${errDc ? 'bg-[#442222] border border-red-500 text-red-200 placeholder-red-300' : 'bg-[#404040] text-[#DEDEDE] placeholder-[#DEDEDE]'}`}
            />
          </div>
        </div>
      )}

      {/* Океан сегодня: TVL, активные рыбы, съеденные за 24ч, перераспределено */}
      <div className="mt-6">
        <div className="text-white font-bold text-[24px] leading-[1.1] tracking-[-0.02em]">
          {t.profile?.oceanTodayTitle ?? 'Океан сегодня'}
        </div>
        <div className="mt-2 space-y-[0.4em]">
          <Row icon="/img/icon-water.svg">
            {t.profile?.oceanTvl ?? 'Ocean TVL'}: <b>{oceanTvlSol} SOL</b>
          </Row>
          <Row icon="/img/icon-fish.svg" iconWidth={24} iconHeight={16}>
            {t.profile?.activeFish ?? 'Active fish'}: <b>{activeFishCount}</b>
          </Row>
          <Row icon="/img/icon-clock.svg" iconWidth={24} iconHeight={24}>
            {t.profile?.eaten7d ?? 'Eaten in 7 days'}: <b>{eaten24hCount != null ? eaten24hCount : '—'}</b>
          </Row>
          <Row icon="/img/icon-pie.svg">
            {t.profile?.redistributed7d ?? 'Redistributed SOL'}:{' '}
            <b>{lamportsToSol(Number(redistributed24hLamports || 0n), 4)}{' '}
            SOL</b>
          </Row>
        </div>
      </div>
    </Card>
  );
};

export default MyProfilePanel;
