import React from "react";
import { useWallet } from "../wallet/tonWallet";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { connected, publicKey, disconnect } = useWallet();
  const { t } = useLanguage();

  const getWalletAddress = () => {
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      return `${address.substring(0, 6)}...${address.substring(
        address.length - 4,
      )}`;
    }
    return "";
  };

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="w-[312px]">
        <h2 className="text-[24px] font-bold leading-[1.1] tracking-[-0.01em] text-white font-sf-pro-display">
          {t.menu}
        </h2>
      </div>

      {/* Профиль / Кошелек */}
      {connected ? (
        <Link
          to="/my-fish"
          onClick={onClose}
          className="block bg-[#1C1B20] border border-[#1E1E1E] rounded-xl p-4 hover:bg-[#252429]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold leading-[1.2] text-white font-sf-pro-display">
                  {t.profile?.widgetTitle ?? "My profile"}
                </h3>
                <span className="text-xs text-gray-400">TON</span>
              </div>
              <p className="text-sm text-[#DEDEDE] mt-1">
                {getWalletAddress()}
              </p>
            </div>
          </div>
        </Link>
      ) : (
        <div
          className={`bg-[#1C1B20] border border-[#1E1E1E] rounded-xl p-4 hover:bg-[#252429] cursor-pointer`}
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("cryptofish-open-wallet-menu"));
            }
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-bold leading-[1.2] text-white font-sf-pro-display">
                  {t.connectWallet}
                </h3>
              </div>
              <p className="text-sm text-[#DEDEDE] mt-1">
                {t.connectWalletTitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* About game */}
      <Link
        to="/about-game"
        onClick={onClose}
        className="block bg-[#1C1B20] border border-[#1E1E1E] rounded-xl p-4 hover:bg-[#252429] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#252525] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg font-bold">?</span>
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] font-bold leading-[1.2] text-white font-sf-pro-display">
              About
            </h3>
          </div>
        </div>
      </Link>

      {connected && (
        <div className="pt-2">
          <button
            onClick={async () => {
              try {
                await disconnect();
                onClose();
              } catch (error) {}
            }}
            className="w-full bg-[#111013] hover:bg-[#2A2A2E] transition-colors rounded-lg py-[14px] px-[30px]"
          >
            <span className="text-[16px] font-bold leading-[1.02] tracking-[-0.04em] text-white font-sf-pro-display">
              {t.disconnectWallet}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
