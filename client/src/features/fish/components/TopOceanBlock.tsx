import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadRuntimeConfig } from '../../../config/runtimeConfig';
import { fetchCompat } from '../../../shared/api/compat';
import { useLanguage } from '../../../contexts/LanguageContext';
import { formatDurationHMS } from '../../../core/utils/format';
import { useTimersConfig } from '../../../core/hooks/useTimersConfig';
import { useBlockchainNowSec } from '../../../core/hooks/useBlockchainNowSec';

type TopCacheEntry = { data: any[]; ts: number };
const topCache = new Map<number, TopCacheEntry>();
const TOP_TTL_MS = 15000;

// Exact Figma block (node 2950:733): header + three ranked items + CTA button
// Width is limited by parent (profile column 378px). Spacing/typography matches extracted styles.

const RankBadge: React.FC<{ label: string; avatarUrl?: string; onClick?: () => void }> = ({ label, avatarUrl, onClick }) => {
  return (
    <div
      className="relative h-[90px] w-[90px]"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        backgroundImage: avatarUrl ? `url('${avatarUrl}')` : undefined,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        borderRadius: 12,
      }}
    >
      <div
        className="absolute px-[6px] py-[4px] left-0 top-0 flex items-center justify-center"
        style={{
          backdropFilter: 'blur(8px)',
          borderRadius: 12,
        }}
      >
        <span className="text-white text-[10px] leading-[1.2] tracking-[-0.03em] font-sf-pro-display">{label}</span>
      </div>
    </div>
  );
};

export type SocialsType = { x?: string; telegram?: string; discord?: string };

export const Socials: React.FC<{ socials?: SocialsType; hiddenEmpty?: boolean }>=({ socials, hiddenEmpty = false }) => {
  const buildUrl = (kind: 'telegram'|'x'|'discord', v?: string) => {
    if (!v) return undefined;
    const hasProto = /^https?:\/\//i.test(v);
    if (hasProto) return v;
    const val = v.startsWith('@') ? v.slice(1) : v;
    if (kind === 'telegram') return `https://t.me/${val}`;
    if (kind === 'x') return `https://x.com/${val}`;
    return `https://discord.com/${v}`;
  };
  return (
    <div className="flex w-[80px] sm:w-[88px] items-center justify-end gap-[6px] sm:gap-[6px]">
      {socials?.discord ? (
        <a href={buildUrl('discord', socials.discord)} target="_blank" rel="noreferrer"><img src="/img/icon-discord.svg" width={24} height={24} alt="discord" /></a>
      ) : hiddenEmpty ? null : (<img src="/img/icon-discord.svg" width={24} height={24} alt="discord" className="opacity-30" />)}
      {socials?.telegram ? (
        <a href={buildUrl('telegram', socials.telegram)} target="_blank" rel="noreferrer"><img src="/img/icon-telegram.svg" width={24} height={24} alt="telegram" /></a>
      ) : hiddenEmpty ? null : (<img src="/img/icon-telegram.svg" width={24} height={24} alt="telegram" className="opacity-30" />)}
      {socials?.x ? (
        <a href={buildUrl('x', socials.x)} target="_blank" rel="noreferrer"><img src="/img/icon-x.svg" width={24} height={24} alt="x" /></a>
      ) : hiddenEmpty ? null : (<img src="/img/icon-x.svg" width={24} height={24} alt="x" className="opacity-30" />)}
    </div>
  );
};

const Row: React.FC<{ fishId: number; rank: string; name: string; value: string; addr: string; avatarUrl?: string; socials?: { x?: string; telegram?: string; discord?: string }; secondsUntilHunger?: number }>=({ fishId, rank, name, value, addr, avatarUrl, socials, secondsUntilHunger })=>{
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { feedPeriodSec } = useTimersConfig();
  const chainNowSec = useBlockchainNowSec();
  const chainNowSecRef = useRef(chainNowSec);
  chainNowSecRef.current = chainNowSec;
  const targetTsRef = useRef<number>(0);

  useEffect(() => {
    if (typeof secondsUntilHunger === 'number' && secondsUntilHunger >= 0) {
      targetTsRef.current = chainNowSecRef.current + secondsUntilHunger;
    }
  }, [secondsUntilHunger]);

  const remain = typeof secondsUntilHunger === 'number' && secondsUntilHunger >= 0
    ? Math.max(0, targetTsRef.current - chainNowSec)
    : feedPeriodSec;
  const victimCountdown = formatDurationHMS(remain);
  const victimLabel = remain > 0 ? `${(t as any)?.willBeVictimIn ?? 'Victim in'} ${victimCountdown}` : ((t as any)?.victim ?? 'Victim');
  const fillPercentRaw = Math.max(0, Math.min(100, Math.floor((remain / feedPeriodSec) * 100)));
  const barWidth = remain <= 0 ? 0 : Math.max(4, fillPercentRaw); // минимум ширины, чтобы не ломало UI при почти нуле
  return (
    <div className="flex flex-col mt-[12px] gap-[12px] bg-[#1C1B20] rounded-xl">
      <div className="flex items-center gap-[12px] sm:gap-[16px] w-full">
        <RankBadge label={rank} avatarUrl={avatarUrl} onClick={() => navigate(`/fish/${fishId}`)} />
        <div className="flex flex-1 min-w-0 flex-col gap-[12px]">
          <div className="text-white text-[18px] font-sf-pro-display font-bold leading-[1.2] truncate">{name}</div>
          <div className="text-[#DEDEDE] text-[12px] sm:text-[14px] font-sf-pro-display font-bold leading-[1.2] truncate">{value}</div>
        </div>
        <div className="flex flex-col items-end gap-[8px] w-[100px] sm:w-[92px] sm:items-end ">
          <Socials socials={socials} />
          <div className="text-[#0088FF] text-[12px] sm:text-[16px] font-sf-pro-display font-bold leading-[1.2] truncate">{addr}</div>
        </div>
      </div>
      <div className="h-6 relative rounded-full" style={{ background: 'rgba(235, 23, 107, 0.15)', width: '100%' }}>
        <div
          className="absolute left-0 top-0 h-6 rounded-full"
          style={{
            width: `${barWidth}%`,
            background: 'rgba(235, 23, 107, 0.3)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-[14px] leading-[1.02] tracking-[-0.03em]">
            {victimLabel}
          </div>
        </div>
      </div>
    </div>
  );
};

type TopProps = { limit?: number; showCTA?: boolean };
const TopOceanBlock: React.FC<TopProps> = ({ limit = 3, showCTA = true }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const loadedKeyRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    const key = `top:${limit}`;
    if (loadedKeyRef.current === key) return () => { cancelled = true; };
    loadedKeyRef.current = key;
    const cached = topCache.get(limit);
    const now = Date.now();
    if (cached && now - cached.ts < TOP_TTL_MS) {
      setItems(cached.data);
      return () => { cancelled = true; };
    }
    (async () => {
      setLoading(true);
      try {
        const { API_BASE_URL } = await loadRuntimeConfig();
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const r = await fetchCompat(base, `/api/v1/leaderboards/top-fish?limit=${encodeURIComponent(limit)}`);
        if (!r.ok) throw new Error('bad');
        const j = await r.json();
        const arr = Array.isArray(j?.data.items) ? j.data.items : [];
        const mapped = arr.map((it: any, idx: number) => {
          const avatarUrl = it.avatarFile
            ? `${base}/static/avatars/thumbs/${String(it.avatarFile).replace(/\.[^.]+$/, '.webp')}`
            : '/img/fish-image-7a550f.jpg';
          const valueLamportsNum = Number(String(it.valueLamports ?? it.totalLamports ?? 0));
          const valueText = Number.isFinite(valueLamportsNum)
            ? `${(valueLamportsNum / 1_000_000_000).toFixed(2)} SOL`
            : '—';
          return {
            ...it,
            rank: it.rank ?? idx + 1,
            shareStr: String(it.shareStr ?? it.share ?? '0'),
            _avatarUrl: avatarUrl,
            _valueLamports: valueLamportsNum,
            _valueText: valueText,
            secondsUntilHunger: it.secondsUntilHunger ?? null
          };
        });
        if (!cancelled) setItems(mapped);
        topCache.set(limit, { data: mapped, ts: Date.now() });
      } catch { if (!cancelled) setItems([]); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [limit]);
  return (
    <div className="bg-[#1C1B20] border border-[#1E1E1E] rounded-2xl p-5 w-full">
      <div className="text-white font-sf-pro-display font-bold text-[21px] leading-[1.1] tracking-[-0.01em] sm:text-[24px]">
        {t.topFish}
      </div>
      <div className="mt-[7px] flex flex-col gap-[12px]">
        {loading && (
          <>
            {Array.from({ length: limit }).map((_, i) => (
              <div key={`sk-top-${i}`} className="flex w-full items-center gap-[16px]">
                <div className="h-[74px] w-[80px] rounded-xl bg-[#2A2A2E] animate-pulse sm:h-20 sm:w-[90px]" />
                <div className="flex flex-1 min-w-0 flex-col gap-[14px] sm:w-[120px]">
                  <div className="h-[18px] rounded-md bg-[#2A2A2E] animate-pulse sm:w-[120px]" />
                  <div className="h-[14px] w-[100px] rounded-md bg-[#2A2A2E] animate-pulse sm:w-[100px]" />
                </div>
                <div className="flex w-[80px] flex-col items-end gap-[10px] sm:w-[88px] sm:w-[88px]">
                  <div className="h-[14px] w-[60px] rounded-md bg-[#2A2A2E] animate-pulse sm:w-[84px]" />
                </div>
              </div>
            ))}
          </>
        )}
        {!loading && items.length === 0 && (
          <div className="text-[#DEDEDE] text-[14px]">{t.noFishYet}</div>
        )}
        {!loading && items.slice(0, limit).map((it, idx) => (
          <Row
            key={it.fishId || idx}
            fishId={Number(it.fishId)}
            rank={t.ranks?.[`rank${idx+1}` as 'rank1'|'rank2'|'rank3'] || `${idx+1}`}
            name={it.fishName || `Fish #${it.fishId}`}
            value={it._valueText || '—'}
            addr={`${String(it.owner).slice(0,6)}...${String(it.owner).slice(-4)}`}
            avatarUrl={it._avatarUrl}
            socials={it.socials}
            secondsUntilHunger={typeof it.secondsUntilHunger === 'number' ? it.secondsUntilHunger : undefined}
          />
        ))}
      </div>
      {showCTA && (
        <div className="mt-[24px]">
          <button
            type="button"
            className="w-full h-[48px] rounded-full"
            onClick={() => navigate('/top-fish')}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              padding: '0 30px',
              background: '#0088FF',
              color: '#FFFFFF',
              fontFamily: 'SF Pro Display',
              fontWeight: 700,
              fontSize: 16,
              lineHeight: '1.02',
              letterSpacing: '-1%',
            }}
          >
            <span className="text-white text-[16px] font-sf-pro-display font-bold leading-[1.02] tracking-[-0.04em]">{t.showMore}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TopOceanBlock;
