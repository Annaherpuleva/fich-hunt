import { useEffect, useState } from 'react';

export function useWindowWidth(): number {
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowWidth;
}
