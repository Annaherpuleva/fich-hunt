import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import DropdownMenu from "./DropdownMenu";

const Footer: React.FC = () => {
  const {t} = useLanguage();
  const [isTelegramDropdownOpen, setIsTelegramDropdownOpen] = useState(false);
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return <div className="flex flex-col items-center pt-[25px] lg:pt-[30px] pb-[26px] relative z-49">
    <div className="flex gap-[32px] pb-[25px] ">
      <a href="https://x.com/HODLHUNT" target="_blank" rel="noreferrer"><img src="/img/icon-x.svg" width={24} height={24} alt="X" /></a>
      <DropdownMenu
        trigger={
          <button type="button" aria-label="Telegram">
            <img src="/img/icon-telegram.svg" width={24} height={24} alt="Telegram" />
          </button>
        }
        isOpen={isTelegramDropdownOpen}
        onToggle={() => setIsTelegramDropdownOpen(!isTelegramDropdownOpen)}
        onClose={() => setIsTelegramDropdownOpen(false)}
        align="center"
        direction="up"
      >
        <div className="space-y-4 shadow-lg">
          <h2 className="text-[20px] text-center font-bold leading-[1.1] tracking-[-0.01em] text-white font-sf-pro-display">
              Telegram
          </h2>
          <div className="flex items-center gap-3">
            <a
              href="https://t.me/HODLHUNTCHATRU"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsTelegramDropdownOpen(false)}
              className="flex-1 bg-[#252525] hover:bg-[#2A2A2E] transition-colors rounded-lg py-[12px] px-[12px] text-center"
            >
              <span className="text-[14px] font-bold leading-[1.2] text-white font-sf-pro-display">
                Русский чат
              </span>
            </a>
            <button
              type="button"
              disabled
              className="flex-1 bg-[#151418] rounded-lg py-[12px] px-[12px] text-center cursor-not-allowed"
              aria-disabled="true"
            >
              <span className="text-[14px] font-bold leading-[1.2] text-[#6E6E6E] font-sf-pro-display">
                English
              </span>
            </button>
          </div>
        </div>
      </DropdownMenu>
      <a href="/" target="_blank" rel="noreferrer"><img src="/img/icon-discord.svg" width={24} height={24} alt="Discord" /></a>
    </div>
    <Link className="link text-[12px]" to="/terms-of-service" onClick={handleClick}>{t.footer.termsOfService}</Link>
    <Link className="link text-[12px]" to="/privacy-policy" onClick={handleClick}>{t.footer.privacyPolicy}</Link>
    <Link className="link text-[12px]" to="/about-game" onClick={handleClick}>{t.footer.about}</Link>
    <Link className="link text-[12px]" to="/contacts" onClick={handleClick}>{t.footer.contacts}</Link>
    <p className="pt-[25px] text-[#BDBDBD] text-[14px] leading-[1.3]">© 2025 HodlHunt. {t.footer.allRightsReserved}</p>
  </div>;
};

export default Footer;
