import React from 'react';
import { useWallet } from '../wallet/tonWallet';
import { User } from 'lucide-react';

interface ProfileButtonProps {
  className?: string;
  showText?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ 
  className = "btn-primary",
  showText = false,
  style,
  onClick,
}) => {
  const { connected } = useWallet();

  const getButtonContent = () => {
    if (showText) {
      return (
        <>
          <User size={18} strokeWidth={1.5} />
          {connected ? 'Profile' : 'Sign In'}
        </>
      );
    }
    return <User size={18} strokeWidth={1.5} />;
  };

  const handleClick = () => {
    if (connected) {
      // Логика для профиля пользователя
    } else {
      // Логика для входа
    }
    if (onClick) onClick();
  };

  return (
    <button 
      className={className} 
      style={style}
      onClick={handleClick}
      title={connected ? 'Profile' : 'Sign In'}
    >
      {getButtonContent()}
    </button>
  );
};

export default ProfileButton;
