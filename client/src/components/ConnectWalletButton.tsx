import React from 'react';
import { useWallet } from '../wallet/tonWallet';

interface ConnectWalletButtonProps {
  className?: string;
  onClick?: () => void;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ className, onClick }) => {
  const { publicKey, connected } = useWallet();

  const handleClick = React.useCallback(() => {
    if (!connected && onClick) onClick();
  }, [connected, onClick]);

  const getButtonText = () => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return 'Connect Wallet';
  };

  return (
    <button
      onClick={handleClick}
      className={`${className || 'btn-primary-dark'} ${connected ? 'pointer-events-none select-none' : ''}`}
    >
      {getButtonText()}
    </button>
  );
};

export default ConnectWalletButton;
