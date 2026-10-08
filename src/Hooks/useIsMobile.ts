import { useEffect, useState } from 'react';

// Matches Tailwind's `md` breakpoint: below 768px the IDE switches to its mobile layout.
const MOBILE_QUERY = '(max-width: 767px)';

export const isMobileViewport = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;

export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(isMobileViewport);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
};
