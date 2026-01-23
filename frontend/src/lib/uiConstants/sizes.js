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
 * Alturas estandarizadas para elementos de formulario
 * Garantiza consistencia entre Button, Input, Select, SearchInput
 */
export const FORM_ELEMENT_HEIGHTS = {
  sm: 'h-9',   // 36px
  md: 'h-10',  // 40px
  lg: 'h-12',  // 48px
  xl: 'h-14',  // 56px
};

/**
 * Tamaños para botones
 */
export const BUTTON_SIZES = {
  sm: 'px-3 text-sm h-9',
  md: 'px-4 text-base h-10',
  lg: 'px-6 text-lg h-12',
  xl: 'px-8 text-xl h-14',
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
 * Tamaños para inputs (altura estandarizada)
 */
export const INPUT_SIZES = {
  sm: 'px-3 text-sm h-9',
  md: 'px-4 text-base h-10',
  lg: 'px-5 text-lg h-12',
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

/**
 * Tamaños para modales (max-width)
 */
export const MODAL_SIZES = {
  sm: 'max-w-md',      // 448px
  md: 'max-w-2xl',     // 672px
  lg: 'max-w-4xl',     // 896px
  xl: 'max-w-6xl',     // 1152px
  full: 'max-w-full',
};

/**
 * Tamaños para SearchInput
 */
export const SEARCH_INPUT_SIZES = {
  sm: {
    input: 'h-9 text-sm',
    icon: 'w-4 h-4',
    paddingLeft: 'pl-8',
    paddingRightWithClear: 'pr-8',
    paddingRightNormal: 'pr-3',
  },
  md: {
    input: 'h-10 text-base',
    icon: 'w-5 h-5',
    paddingLeft: 'pl-10',
    paddingRightWithClear: 'pr-10',
    paddingRightNormal: 'pr-4',
  },
  lg: {
    input: 'h-12 text-lg',
    icon: 'w-6 h-6',
    paddingLeft: 'pl-12',
    paddingRightWithClear: 'pr-12',
    paddingRightNormal: 'pr-4',
  },
};

/**
 * Tamaños para Pagination
 */
export const PAGINATION_SIZES = {
  sm: {
    button: 'px-2 py-1 text-xs',
    icon: 'w-3 h-3',
    page: 'w-7 h-7 text-xs',
  },
  md: {
    button: 'px-3 py-2 text-sm',
    icon: 'w-4 h-4',
    page: 'w-8 h-8 text-sm',
  },
  lg: {
    button: 'px-4 py-2 text-base',
    icon: 'w-5 h-5',
    page: 'w-10 h-10 text-base',
  },
};

export default {
  FORM_ELEMENT_HEIGHTS,
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
  MODAL_SIZES,
  SEARCH_INPUT_SIZES,
  PAGINATION_SIZES,
};
