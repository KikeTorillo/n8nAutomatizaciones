/**
 * ====================================================================
 * CONSTANTES PARA SUPERFICIES UI
 * ====================================================================
 *
 * Estilos base para cards, paneles y contenedores.
 * Patrón común extraído de múltiples componentes.
 *
 * Ene 2026 - Auditoría UI Library
 * ====================================================================
 */

/**
 * Card base con borde (estilo más común)
 */
export const CARD_BASE = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700';

/**
 * Card con sombra elevada (sin borde)
 */
export const CARD_ELEVATED = 'bg-white dark:bg-gray-800 rounded-lg shadow-md';

/**
 * Panel sin sombra (flat)
 */
export const CARD_FLAT = 'bg-gray-50 dark:bg-gray-900 rounded-lg';

/**
 * Contenedor transparente con borde
 */
export const CARD_OUTLINE = 'bg-transparent rounded-lg border border-gray-200 dark:border-gray-700';

/**
 * Efecto hover para superficies clickeables
 */
export const SURFACE_HOVER = 'hover:shadow-md transition-shadow';

/**
 * Efecto hover sutil
 */
export const SURFACE_HOVER_SUBTLE = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';

/**
 * Overlay para modales/drawers
 */
export const OVERLAY_BACKDROP = 'fixed inset-0 bg-black/50 backdrop-blur-sm';

/**
 * Overlay simple (sin blur)
 */
export const OVERLAY_SIMPLE = 'fixed inset-0 bg-black/50';

/**
 * Contenedor con overflow scrollable
 */
export const SCROLLABLE_CONTAINER = 'overflow-y-auto overscroll-contain';

/**
 * Header de sección con borde inferior
 */
export const SECTION_HEADER = 'border-b border-gray-200 dark:border-gray-700';

/**
 * Footer de sección con borde superior
 */
export const SECTION_FOOTER = 'border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900';

export default {
  CARD_BASE,
  CARD_ELEVATED,
  CARD_FLAT,
  CARD_OUTLINE,
  SURFACE_HOVER,
  SURFACE_HOVER_SUBTLE,
  OVERLAY_BACKDROP,
  OVERLAY_SIMPLE,
  SCROLLABLE_CONTAINER,
  SECTION_HEADER,
  SECTION_FOOTER,
};
