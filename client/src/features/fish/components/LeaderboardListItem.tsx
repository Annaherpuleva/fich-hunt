import React from 'react';
import LeaderboardAvatar from './LeaderboardAvatar';
import HungerBar from './HungerBar';
import { useNavigate } from 'react-router-dom';

type SocialsT = { x?: string; telegram?: string; discord?: string };

export type LeaderboardListItemProps = {
  fishId: number;
  rank: number;
  name: string;
  valueText: string;
  address: string; // already shortened or full
  avatarUrl?: string;
  socials?: SocialsT;
  secondsUntilHunger: number | null;
};

export const Socials: React.FC<{ socials?: SocialsT }>=({ socials }) => {
  const buildUrl = (kind: 'telegram'|'x'|'discord', v?: string) => {
    if (!v) return undefined;
    const hasProto = /^https?:\/\//i.test(v);
    if (hasProto) return v;
    const val = v.startsWith('@') ? v.slice(1) : v;
    if (kind === 'telegram') return `https://t.me/${val}`;
    if (kind === 'x') return `https://x.com/${val}`;
    return `https://discord.com/${v}`;
  };
  const icon = (src: string, alt: string, active: boolean, href?: string) => {
    const img = <img src={src} alt={alt} className={`w-5 h-5 sm:w-6 sm:h-6 ${active ? '' : 'opacity-30'}`} />;
    if (!active || !href) return img;
    return <a href={href} target="_blank" rel="noreferrer">{img}</a>;
  };
  return (
    <div className="flex items-center gap-[6px] sm:gap-[8px]">
      {icon('/img/icon-x.svg', 'x', !!socials?.x, buildUrl('x', socials?.x))}
      {icon('/img/icon-telegram.svg', 'telegram', !!socials?.telegram, buildUrl('telegram', socials?.telegram))}
      {icon('/img/icon-discord.svg', 'discord', !!socials?.discord, buildUrl('discord', socials?.discord))}
    </div>
  );
};

const LeaderboardListItem: React.FC<LeaderboardListItemProps> = ({ fishId, rank, name, valueText, address, avatarUrl, socials, secondsUntilHunger }) => {
  const navigate = useNavigate();
  const handleOpenFish = React.useCallback(() => {
    if (!Number.isFinite(fishId)) return;
    navigate(`/fish/${fishId}`);
  }, [navigate, fishId]);

  const rankLabel = (() => {
    if (rank === 1) return '👑 1 место';
    if (rank === 2) return '🥈 2 место';
    if (rank === 3) return '🥉 3 место';
    return `${rank} место`;
  })();

  return (
    <div className="px-4 py-5 sm:px-5 rounded-[24px] bg-[#1C1B20] w-full overflow-hidden">
      {/* Mobile layout */}
      <div className="flex flex-col gap-[12px] sm:hidden">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={handleOpenFish}
            className="p-0 m-0 border-none bg-transparent cursor-pointer"
          >
            <LeaderboardAvatar imageUrl={avatarUrl} rankLabel={rankLabel} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-[4px] min-w-0">
                <div className="text-white text-[18px] font-sf-pro-display font-bold leading-[1.2] truncate">{name}</div>
                <div className="text-white text-[15px] font-sf-pro-display font-bold leading-[1.2]">{valueText}</div>
              </div>
              <div className="flex flex-col items-end gap-[6px] shrink-0">
                <Socials socials={socials} />
                <div className="text-[#0088FF] text-[13px] font-sf-pro-display font-bold leading-[1.2] truncate text-right max-w-[140px]">
                  {address}
                </div>
              </div>
            </div>
          </div>
        </div>
        <HungerBar secondsUntilHunger={secondsUntilHunger} />
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-6 gap-y-[12px] items-center">
        <div className="row-span-3">
          <button
            type="button"
            onClick={handleOpenFish}
            className="p-0 m-0 border-none bg-transparent cursor-pointer"
          >
            <LeaderboardAvatar imageUrl={avatarUrl} rankLabel={rankLabel} />
          </button>
        </div>
        <div className="text-white text-[32px] font-sf-pro-display font-bold leading-[1.2] truncate">
          {name}
        </div>
        <div className="flex items-center justify-end gap-[12px]">
          <Socials socials={socials} />
        </div>
        <div className="text-white text-[20px] font-sf-pro-display font-bold leading-[1.2]">
          {valueText}
        </div>
        <div className="text-[#0088FF] text-[20px] font-sf-pro-display font-bold leading-[1.2] text-right truncate">
          {address}
        </div>
        <HungerBar secondsUntilHunger={secondsUntilHunger} />
      </div>
    </div>
  );
};

export default LeaderboardListItem;
