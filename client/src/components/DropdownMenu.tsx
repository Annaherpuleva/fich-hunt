import React, { useRef, useEffect } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  align?: 'left' | 'right' | 'center';
  direction?: 'up' | 'down';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  isOpen,
  onToggle,
  onClose,
  align = 'right',
  direction = 'down'
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={onToggle}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:static sm:inset-auto sm:flex-none sm:bg-transparent sm:p-0"
          onClick={onClose}
        >
          <div
            className={`relative overflow-auto bg-[#1C1B20] p-6 sm:absolute sm:h-auto w-[360px] max-w-[calc(100vw-32px)] rounded-3xl ${
              align === 'right'
                ? 'sm:right-0'
                : align === 'left'
                  ? 'sm:left-0'
                  : 'sm:left-1/2 sm:-translate-x-1/2'
            } ${
              direction === 'up' ? 'sm:bottom-full sm:mb-2' : 'sm:top-full sm:mt-2'
            }`}
            style={{boxShadow: '0 0 20px #101014'}}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
