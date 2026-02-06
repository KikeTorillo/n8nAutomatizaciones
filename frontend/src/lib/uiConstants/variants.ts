/**
 * ====================================================================
 * VARIANTES DE COMPONENTES UI
 * ====================================================================
 *
 * Centraliza variantes visuales para componentes UI.
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

import { BADGE_COLORS } from './colors';

/**
 * Variantes para botones
 */
export const BUTTON_VARIANTS = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  outline: 'border-2 border-primary-300 text-primary-700 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-600 dark:text-primary-300 dark:hover:bg-primary-950',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
  warning: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500 dark:bg-amber-700 dark:hover:bg-amber-600',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-600',
  link: 'text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300',
};

/**
 * Variantes para badges - importadas desde colors.js (fuente única)
 * NOTA: Usar 'danger' como nombre canónico, 'error' es alias para retrocompatibilidad
 */
export const BADGE_VARIANTS = BADGE_COLORS;

/**
 * Variantes para alerts/notificaciones
 * NOTA: Usar 'danger' como nombre canónico, 'error' es alias para retrocompatibilidad
 */
export const ALERT_VARIANTS = {
  info: {
    container: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
    iconBg: 'bg-primary-100 dark:bg-primary-900/40',
    icon: 'text-primary-600 dark:text-primary-400',
    title: 'text-primary-800 dark:text-primary-200',
    text: 'text-primary-700 dark:text-primary-300',
  },
  success: {
    container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-200',
    text: 'text-amber-700 dark:text-amber-300',
  },
  danger: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    text: 'text-red-700 dark:text-red-300',
  },
  rose: {
    container: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    icon: 'text-rose-600 dark:text-rose-400',
    title: 'text-rose-800 dark:text-rose-200',
    text: 'text-rose-700 dark:text-rose-300',
  },
};
// Alias para retrocompatibilidad
ALERT_VARIANTS.error = ALERT_VARIANTS.danger;

/**
 * Variantes para toast notifications
 * NOTA: Usar 'danger' como nombre canónico, 'error' es alias para retrocompatibilidad
 */
export const TOAST_VARIANTS = {
  success: {
    icon: 'text-green-500 dark:text-green-400',
    progress: 'bg-green-500 dark:bg-green-400',
  },
  danger: {
    icon: 'text-red-500 dark:text-red-400',
    progress: 'bg-red-500 dark:bg-red-400',
  },
  warning: {
    icon: 'text-amber-500 dark:text-amber-400',
    progress: 'bg-amber-500 dark:bg-amber-400',
  },
  info: {
    icon: 'text-primary-500 dark:text-primary-400',
    progress: 'bg-primary-500 dark:bg-primary-400',
  },
};
// Alias para retrocompatibilidad
TOAST_VARIANTS.error = TOAST_VARIANTS.danger;

/**
 * Variantes para cards
 */
export const CARD_VARIANTS = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-md',
  flat: 'bg-gray-50 dark:bg-gray-900',
  outline: 'bg-transparent border border-gray-200 dark:border-gray-700',
};

/**
 * Variantes para inputs
 */
export const INPUT_VARIANTS = {
  default: 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-100',
  error: 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500 dark:bg-gray-800 dark:text-gray-100',
  success: 'border-green-500 dark:border-green-500 focus:border-green-500 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100',
  disabled: 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed',
};

/**
 * Variantes extendidas para toast (incluye iconos y contenedor)
 * NOTA: Usar 'danger' como nombre canónico, 'error' es alias para retrocompatibilidad
 */
export const TOAST_EXTENDED_VARIANTS = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    bg: 'bg-primary-50 dark:bg-primary-900/30',
    border: 'border-primary-200 dark:border-primary-800',
    iconColor: 'text-primary-700 dark:text-primary-400',
    textColor: 'text-primary-800 dark:text-primary-200',
  },
};
// Alias para retrocompatibilidad
TOAST_EXTENDED_VARIANTS.error = TOAST_EXTENDED_VARIANTS.danger;

/**
 * Estilos del contenedor de toast
 */
export const TOAST_CONTAINER_STYLES = 'border rounded-lg p-4 shadow-lg flex items-start gap-3 min-w-[320px] max-w-md animate-slide-in-right';

export default {
  BUTTON_VARIANTS,
  BADGE_VARIANTS,
  ALERT_VARIANTS,
  TOAST_VARIANTS,
  CARD_VARIANTS,
  INPUT_VARIANTS,
  TOAST_EXTENDED_VARIANTS,
  TOAST_CONTAINER_STYLES,
};
