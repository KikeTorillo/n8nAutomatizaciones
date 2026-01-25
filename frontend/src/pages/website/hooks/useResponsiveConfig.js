/**
 * ====================================================================
 * USE RESPONSIVE CONFIG
 * ====================================================================
 * Hook para manejar configuraciones responsive de los bloques.
 * Permite aplicar overrides específicos para cada breakpoint.
 */

import { useMemo, useCallback } from 'react';
import { useWebsiteEditorStore } from '@/store';

/**
 * Merge profundo de objetos
 */
function deepMerge(target, source) {
  if (!source) return target;
  if (!target) return source;

  const result = { ...target };

  Object.keys(source).forEach((key) => {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  });

  return result;
}

/**
 * Hook para obtener la configuración de un bloque según el breakpoint activo
 *
 * @param {Object} bloque - El bloque con contenido y responsive
 * @returns {Object} { contenido, estilos, breakpoint, actualizarResponsive }
 */
export function useResponsiveConfig(bloque) {
  const breakpoint = useWebsiteEditorStore((state) => state.breakpoint);

  // Obtener contenido mergeado para el breakpoint actual
  const contenido = useMemo(() => {
    if (!bloque?.contenido) return {};

    const baseContenido = { ...bloque.contenido };
    const responsiveOverrides = bloque.contenido.responsive?.[breakpoint];

    if (!responsiveOverrides || breakpoint === 'desktop') {
      // Desktop usa la configuración base
      return baseContenido;
    }

    // Mergear overrides del breakpoint
    return deepMerge(baseContenido, responsiveOverrides);
  }, [bloque?.contenido, breakpoint]);

  // Obtener estilos mergeados para el breakpoint actual
  const estilos = useMemo(() => {
    if (!bloque?.estilos) return {};

    const baseEstilos = { ...bloque.estilos };
    const responsiveOverrides = bloque.estilos.responsive?.[breakpoint];

    if (!responsiveOverrides || breakpoint === 'desktop') {
      return baseEstilos;
    }

    return deepMerge(baseEstilos, responsiveOverrides);
  }, [bloque?.estilos, breakpoint]);

  return {
    contenido,
    estilos,
    breakpoint,
    isDesktop: breakpoint === 'desktop',
    isTablet: breakpoint === 'tablet',
    isMobile: breakpoint === 'mobile',
  };
}

/**
 * Hook para actualizar configuración responsive de un bloque
 *
 * @param {Function} onContentChange - Callback para actualizar el contenido
 * @returns {Object} { actualizarResponsive, actualizarBase }
 */
export function useResponsiveUpdate(onContentChange) {
  const breakpoint = useWebsiteEditorStore((state) => state.breakpoint);

  // Actualizar para el breakpoint específico
  const actualizarResponsive = useCallback(
    (campo, valor) => {
      if (breakpoint === 'desktop') {
        // Desktop actualiza directamente el campo base
        onContentChange?.({ [campo]: valor });
      } else {
        // Otros breakpoints actualizan el override responsive
        onContentChange?.({
          responsive: {
            [breakpoint]: {
              [campo]: valor,
            },
          },
        });
      }
    },
    [breakpoint, onContentChange]
  );

  // Actualizar configuración base (siempre afecta desktop y se hereda)
  const actualizarBase = useCallback(
    (cambios) => {
      onContentChange?.(cambios);
    },
    [onContentChange]
  );

  // Resetear override de un campo para un breakpoint
  const resetearOverride = useCallback(
    (campo) => {
      if (breakpoint === 'desktop') return;

      onContentChange?.({
        responsive: {
          [breakpoint]: {
            [campo]: undefined,
          },
        },
      });
    },
    [breakpoint, onContentChange]
  );

  return {
    actualizarResponsive,
    actualizarBase,
    resetearOverride,
    breakpoint,
    isDesktop: breakpoint === 'desktop',
  };
}

/**
 * Constantes de configuración responsive por tipo de bloque
 */
export const RESPONSIVE_DEFAULTS = {
  hero: {
    tablet: {},
    mobile: {
      textAlign: 'center',
    },
  },
  servicios: {
    tablet: {
      columnas: 2,
    },
    mobile: {
      columnas: 1,
    },
  },
  equipo: {
    tablet: {
      columnas: 2,
    },
    mobile: {
      columnas: 1,
    },
  },
  galeria: {
    tablet: {
      columnas: 2,
    },
    mobile: {
      columnas: 1,
    },
  },
  testimonios: {
    tablet: {
      columnas: 2,
    },
    mobile: {
      columnas: 1,
    },
  },
};

/**
 * Obtener clases CSS según el breakpoint
 */
export function getResponsiveClasses(breakpoint, config = {}) {
  const classes = [];

  // Columnas
  if (config.columnas) {
    const cols = config.columnas;
    if (breakpoint === 'desktop') {
      classes.push(`grid-cols-${cols}`);
    } else if (breakpoint === 'tablet') {
      classes.push(`md:grid-cols-${cols}`);
    } else {
      classes.push(`sm:grid-cols-${cols}`);
    }
  }

  // Ocultar sección
  if (config.ocultar) {
    if (breakpoint === 'mobile') {
      classes.push('hidden sm:block');
    } else if (breakpoint === 'tablet') {
      classes.push('hidden md:block');
    }
  }

  // Alineación de texto
  if (config.textAlign) {
    classes.push(`text-${config.textAlign}`);
  }

  return classes.join(' ');
}

export default useResponsiveConfig;
