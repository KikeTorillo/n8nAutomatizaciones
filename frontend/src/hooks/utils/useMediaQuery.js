import { useState, useEffect } from 'react';

/**
 * Hook para detectar media queries de forma reactiva
 *
 * @param {string} query - Media query string (ej: '(max-width: 768px)')
 * @returns {boolean} - true si el media query coincide
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * const isTablet = useMediaQuery('(max-width: 1024px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    // SSR safety check
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Handler para cambios en el media query
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Establecer valor inicial
    setMatches(mediaQuery.matches);

    // Agregar listener (usando el método moderno si está disponible)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antiguos
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
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
};

/**
 * Hook conveniente para detectar si es móvil (< 768px)
 */
export function useIsMobile() {
  return !useMediaQuery(BREAKPOINTS.md);
}

/**
 * Hook conveniente para detectar si es tablet o menor (< 1024px)
 */
export function useIsTablet() {
  return !useMediaQuery(BREAKPOINTS.lg);
}

export default useMediaQuery;
