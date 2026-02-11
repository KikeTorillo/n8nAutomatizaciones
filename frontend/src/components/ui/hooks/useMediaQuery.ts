import { useState, useEffect } from 'react';

/**
 * Hook para detectar media queries de forma reactiva
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Breakpoints predefinidos de Tailwind
 */
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const;

/**
 * Hook conveniente para detectar si es movil (< 768px)
 */
export function useIsMobile(): boolean {
  return !useMediaQuery(BREAKPOINTS.md);
}

/**
 * Hook conveniente para detectar si es tablet o menor (< 1024px)
 */
export function useIsTablet(): boolean {
  return !useMediaQuery(BREAKPOINTS.lg);
}

export default useMediaQuery;
