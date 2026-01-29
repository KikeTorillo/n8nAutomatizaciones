/**
 * ====================================================================
 * CLASES DE ESTADO UI
 * ====================================================================
 *
 * Centraliza clases para diferentes estados de componentes UI.
 *
 * Ene 2026 - Refactorización Frontend
 * ====================================================================
 */

/**
 * Estados de componentes interactivos
 */
export const INTERACTIVE_STATES = {
  default: 'cursor-pointer transition-all duration-200',
  disabled: 'opacity-50 cursor-not-allowed',
  loading: 'opacity-70 cursor-wait',
  selected: 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900',
  focused: 'outline-none ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-900',
};

/**
 * Estados de hover
 */
export const HOVER_STATES = {
  default: 'hover:bg-gray-100 dark:hover:bg-gray-700',
  primary: 'hover:bg-primary-50 dark:hover:bg-primary-900/20',
  subtle: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  elevated: 'hover:shadow-md transition-shadow',
};

/**
 * Estados de validación de formularios
 */
export const VALIDATION_STATES = {
  idle: {
    border: 'border-gray-300 dark:border-gray-600',
    text: 'text-gray-600 dark:text-gray-400',
  },
  error: {
    border: 'border-red-500 dark:border-red-500',
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/10',
  },
  success: {
    border: 'border-green-500 dark:border-green-500',
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/10',
  },
  warning: {
    border: 'border-amber-500 dark:border-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/10',
  },
};

/**
 * Estados de carga/skeleton
 */
export const LOADING_STATES = {
  skeleton: 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
  shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
  spinner: 'animate-spin',
};

/**
 * Estados de visibilidad
 */
export const VISIBILITY_STATES = {
  visible: 'opacity-100 visible',
  hidden: 'opacity-0 invisible',
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
};

/**
 * Estados de focus para accesibilidad
 */
export const FOCUS_STATES = {
  ring: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
  visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  within: 'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
};

/**
 * Estados de arrastre (drag & drop)
 */
export const DRAG_STATES = {
  dragging: 'opacity-50 scale-105 shadow-lg z-50',
  dropTarget: 'border-2 border-dashed border-primary-400 bg-primary-50 dark:bg-primary-900/20',
  dropOver: 'border-primary-500 bg-primary-100 dark:bg-primary-900/40',
};

/**
 * Estados de selección (checkboxes, radio, etc.)
 */
export const SELECTION_STATES = {
  unselected: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
  selected: 'border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400',
  indeterminate: 'border-primary-500 bg-primary-500 dark:border-primary-400 dark:bg-primary-400',
};

/**
 * Estados de expandir/colapsar
 */
export const EXPAND_STATES = {
  collapsed: 'max-h-0 overflow-hidden opacity-0',
  expanded: 'max-h-screen overflow-visible opacity-100',
  transition: 'transition-all duration-300 ease-in-out',
};

export default {
  INTERACTIVE_STATES,
  HOVER_STATES,
  VALIDATION_STATES,
  LOADING_STATES,
  VISIBILITY_STATES,
  FOCUS_STATES,
  DRAG_STATES,
  SELECTION_STATES,
  EXPAND_STATES,
};
