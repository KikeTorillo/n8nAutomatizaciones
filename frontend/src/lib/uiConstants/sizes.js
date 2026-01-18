/**
 * ====================================================================
 * ESCALAS DE TAMAÑO UI
 * ====================================================================
 *
 * Centraliza escalas de tamaño para consistencia en componentes UI.
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

/**
 * Tamaños para botones
 */
export const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

/**
 * Tamaños para iconos
 */
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
};

/**
 * Tamaños para spinners/loaders
 */
export const SPINNER_SIZES = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * Tamaños para badges
 */
export const BADGE_SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

/**
 * Tamaños para inputs
 */
export const INPUT_SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
};

/**
 * Tamaños para avatares
 */
export const AVATAR_SIZES = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
};

/**
 * Tamaños para padding en cards/containers
 */
export const PADDING_SIZES = {
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

/**
 * Tamaños para gap/espaciado
 */
export const GAP_SIZES = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '2xl': 'gap-8',
};

/**
 * Tamaños para texto
 */
export const TEXT_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

/**
 * Tamaños para contenedores con iconos (icon + bg)
 */
export const ICON_CONTAINER_SIZES = {
  sm: 'p-1.5 rounded',
  md: 'p-2 rounded-lg',
  lg: 'p-3 rounded-lg',
  xl: 'p-4 rounded-xl',
};

export default {
  BUTTON_SIZES,
  ICON_SIZES,
  SPINNER_SIZES,
  BADGE_SIZES,
  INPUT_SIZES,
  AVATAR_SIZES,
  PADDING_SIZES,
  GAP_SIZES,
  TEXT_SIZES,
  ICON_CONTAINER_SIZES,
};
