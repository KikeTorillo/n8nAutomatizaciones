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

/**
 * Variantes para botones
 */
export const BUTTON_VARIANTS = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  outline: 'border-2 border-primary-300 text-primary-700 hover:bg-primary-50 focus:ring-primary-500 dark:border-primary-600 dark:text-primary-300 dark:hover:bg-primary-950',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
  warning: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  link: 'text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300',
};

/**
 * Variantes para badges
 */
export const BADGE_VARIANTS = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  info: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
};

/**
 * Variantes para alerts/notificaciones
 */
export const ALERT_VARIANTS = {
  info: {
    container: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800',
    icon: 'text-primary-600 dark:text-primary-400',
    title: 'text-primary-800 dark:text-primary-200',
    text: 'text-primary-700 dark:text-primary-300',
  },
  success: {
    container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
    text: 'text-green-700 dark:text-green-300',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    text: 'text-red-700 dark:text-red-300',
  },
};

/**
 * Variantes para toast notifications
 */
export const TOAST_VARIANTS = {
  success: {
    icon: 'text-green-500 dark:text-green-400',
    progress: 'bg-green-500 dark:bg-green-400',
  },
  error: {
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

export default {
  BUTTON_VARIANTS,
  BADGE_VARIANTS,
  ALERT_VARIANTS,
  TOAST_VARIANTS,
  CARD_VARIANTS,
  INPUT_VARIANTS,
};
