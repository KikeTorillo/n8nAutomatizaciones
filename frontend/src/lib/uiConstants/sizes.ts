/**
 * ====================================================================
 * ESCALAS DE TAMAÑO UI
 * ====================================================================
 *
 * Centraliza escalas de tamaño para consistencia en componentes UI.
 * Todas las constantes están tipadas con Record<UISize, string> o subsets.
 *
 * Ene 2026 - Refactorización Frontend
 * Feb 2026 - Migración a TypeScript + UISize unificado
 * ====================================================================
 */

import type { UISize } from '@/types/ui';

/**
 * Alturas estandarizadas para elementos de formulario
 * Garantiza consistencia entre Button, Input, Select, SearchInput
 */
export const FORM_ELEMENT_HEIGHTS: Record<UISize, string> = {
  xs: 'h-7',   // 28px
  sm: 'h-9',   // 36px
  md: 'h-10',  // 40px
  lg: 'h-12',  // 48px
  xl: 'h-14',  // 56px
};

/**
 * Tamaños para botones
 */
export const BUTTON_SIZES: Record<UISize, string> = {
  xs: 'px-2 text-xs h-7',
  sm: 'px-3 text-sm h-9',
  md: 'px-4 text-base h-10',
  lg: 'px-6 text-lg h-12',
  xl: 'px-8 text-xl h-14',
};

/**
 * Tamaños para iconos
 */
export const ICON_SIZES: Record<UISize | '2xl' | '3xl', string> = {
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
export const SPINNER_SIZES: Record<UISize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

/**
 * Tamaños para badges
 */
export const BADGE_SIZES: Record<UISize, string> = {
  xs: 'text-[10px] px-1.5 py-0',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
  xl: 'text-lg px-3.5 py-1',
};

/**
 * Tamaños para inputs (altura estandarizada)
 */
export const INPUT_SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'px-3 text-sm h-9',
  md: 'px-4 text-base h-10',
  lg: 'px-5 text-lg h-12',
};

/**
 * Tamaños para avatares
 */
export const AVATAR_SIZES: Record<UISize | '2xl', string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
};

/**
 * Tamaños para texto
 */
export const TEXT_SIZES: Record<UISize | '2xl' | '3xl', string> = {
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
export const ICON_CONTAINER_SIZES: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'p-1.5 rounded',
  md: 'p-2 rounded-lg',
  lg: 'p-3 rounded-lg',
  xl: 'p-4 rounded-xl',
};

/**
 * Tamaños para modales (max-width)
 */
export const MODAL_SIZES: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', string> = {
  sm: 'max-w-md',      // 448px
  md: 'max-w-2xl',     // 672px
  lg: 'max-w-4xl',     // 896px
  xl: 'max-w-6xl',     // 1152px
  full: 'max-w-full',
};

/**
 * Tamaños para Drawer (max-height)
 */
export const DRAWER_SIZES: Record<'sm' | 'md' | 'lg' | 'xl' | 'full', string> = {
  sm: 'max-h-[50%]',
  md: 'max-h-[75%]',
  lg: 'max-h-[85%]',
  xl: 'max-h-[96%]',
  full: 'max-h-full',
};

interface SearchInputSizeConfig {
  input: string;
  icon: string;
  paddingLeft: string;
  paddingRightWithClear: string;
  paddingRightNormal: string;
}

/**
 * Tamaños para SearchInput
 */
export const SEARCH_INPUT_SIZES: Record<'sm' | 'md' | 'lg', SearchInputSizeConfig> = {
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

interface PaginationSizeConfig {
  button: string;
  icon: string;
  page: string;
}

/**
 * Tamaños para Pagination
 */
export const PAGINATION_SIZES: Record<'sm' | 'md' | 'lg', PaginationSizeConfig> = {
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

interface ToggleSizeConfig {
  track: string;
  thumb: string;
  translate: string;
  icon: string;
}

/**
 * Tamaños para ToggleSwitch
 */
export const TOGGLE_SIZES: Record<UISize, ToggleSizeConfig> = {
  xs: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
    icon: 'h-3 w-3 m-0.5',
  },
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
    icon: 'h-3 w-3 m-0.5',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
    icon: 'h-4 w-4 m-0.5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
    icon: 'h-5 w-5 m-0.5',
  },
  xl: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
    icon: 'h-5 w-5 m-0.5',
  },
};
