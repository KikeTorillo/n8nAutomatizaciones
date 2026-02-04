/**
 * ====================================================================
 * USE CANVAS BREAKPOINT HOOK
 * ====================================================================
 * Hook para obtener configuración del canvas según breakpoint.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { useMemo } from 'react';
import { BREAKPOINTS } from '../layout/breakpointConfig';

/**
 * useCanvasBreakpoint - Hook para configuración de canvas responsive
 *
 * @param {string} breakpoint - 'desktop' | 'tablet' | 'mobile'
 * @returns {Object} - { width, isMobile, isTablet, isDesktop, config }
 */
export function useCanvasBreakpoint(breakpoint = 'desktop') {
  return useMemo(() => {
    const config = BREAKPOINTS.find((b) => b.id === breakpoint) || BREAKPOINTS[0];

    return {
      width: config.width,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop',
      config,
    };
  }, [breakpoint]);
}

export default useCanvasBreakpoint;
