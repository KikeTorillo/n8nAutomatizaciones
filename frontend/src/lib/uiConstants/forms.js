/**
 * ====================================================================
 * ESTILOS DE FORMULARIOS
 * ====================================================================
 *
 * Estilos centralizados para componentes de formulario.
 *
 * Uso:
 *   import { getCheckboxStyles, getSelectStyles, LABEL_BASE } from '@/lib/uiConstants';
 *
 * Ene 2026 - Preparación Librería UI
 * ====================================================================
 */

import { cn } from '@/lib/utils';

// ==================== CHECKBOX ====================

export const CHECKBOX_BASE = cn(
  'rounded',
  'border-gray-300 dark:border-gray-600',
  'accent-primary-600 dark:accent-primary-500',
  'focus:ring-primary-500 dark:focus:ring-primary-400',
  'transition-colors dark:bg-gray-700'
);

export const CHECKBOX_STATES = {
  disabled: 'opacity-50 cursor-not-allowed',
  error: 'border-red-500 dark:border-red-500',
};

/**
 * Genera clases de estilo para checkbox
 *
 * @param {Object} options
 * @param {boolean} [options.disabled=false] - Estado deshabilitado
 * @param {boolean} [options.error=false] - Estado de error
 * @returns {string} - Clases Tailwind
 */
export function getCheckboxStyles({ disabled = false, error = false } = {}) {
  return cn(
    CHECKBOX_BASE,
    disabled && CHECKBOX_STATES.disabled,
    error && CHECKBOX_STATES.error
  );
}

// ==================== SELECT ====================

export const SELECT_BASE = cn(
  'w-full px-4 border rounded-lg transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-offset-0',
  'disabled:opacity-50 disabled:cursor-not-allowed appearance-none',
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
);

export const SELECT_STATES = {
  default: 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400',
};

export const SELECT_ARROW = {
  container: 'pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300',
  icon: 'h-5 w-5',
};

/**
 * Genera clases de estilo para select
 *
 * @param {boolean} [hasError=false] - Estado de error
 * @returns {string} - Clases Tailwind
 */
export function getSelectStyles(hasError = false) {
  return cn(SELECT_BASE, hasError ? SELECT_STATES.error : SELECT_STATES.default);
}

// ==================== TEXTAREA ====================

export const TEXTAREA_BASE = cn(
  'w-full px-4 py-3 border rounded-lg transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-offset-0',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
  'placeholder:text-gray-400 dark:placeholder:text-gray-500'
);

// Reutiliza los mismos estados que SELECT
export const TEXTAREA_STATES = SELECT_STATES;

/**
 * Modos de resize para textarea
 */
export const TEXTAREA_RESIZE = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

/**
 * Genera clases de estilo para textarea
 *
 * @param {boolean} [hasError=false] - Estado de error
 * @param {'none'|'vertical'|'horizontal'|'both'} [resize='none'] - Modo de resize
 * @returns {string} - Clases Tailwind
 */
export function getTextareaStyles(hasError = false, resize = 'none') {
  return cn(
    TEXTAREA_BASE,
    TEXTAREA_RESIZE[resize] || TEXTAREA_RESIZE.none,
    hasError ? TEXTAREA_STATES.error : TEXTAREA_STATES.default
  );
}

// ==================== LABEL ====================

export const LABEL_BASE = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export const LABEL_REQUIRED = {
  asterisk: 'text-red-500 ml-1',
  srOnly: 'sr-only',
};

// ==================== SIZE CLASSES ====================

/** @type {Record<string, string>} */
export const INPUT_SIZE_CLASSES = {
  sm: 'h-9 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg font-semibold',
};

/** @type {Record<string, string>} */
export const SELECT_SIZE_CLASSES = {
  sm: 'h-9 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
};

/** @type {Record<string, string>} */
export const CHECKBOX_SIZE_CLASSES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/** @type {Record<string, string>} */
export const RADIO_SIZE_CLASSES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

// ==================== INPUT AFFIXES ====================

export const INPUT_AFFIX = {
  container: 'absolute inset-y-0 flex items-center pointer-events-none',
  left: 'left-0 pl-3',
  right: 'right-0 pr-3',
  text: 'text-gray-500 dark:text-gray-400',
};

/**
 * Genera clases de padding para input con prefix/suffix
 *
 * @param {boolean} hasPrefix - Si tiene prefix
 * @param {boolean} hasSuffix - Si tiene suffix
 * @returns {string} - Clases de padding
 */
export function getInputPaddingStyles(hasPrefix, hasSuffix) {
  if (hasPrefix && hasSuffix) return 'px-8';
  if (hasPrefix) return 'pl-8 pr-4';
  if (hasSuffix) return 'pl-4 pr-8';
  return 'px-4';
}

// ==================== FORM GROUP ====================

export const FORM_GROUP = {
  container: 'space-y-1',
  label: LABEL_BASE,
  error: 'text-sm text-red-600 dark:text-red-400 mt-1',
  helper: 'text-sm text-gray-500 dark:text-gray-400 mt-1',
  hint: 'text-xs text-gray-400 dark:text-gray-500 mt-0.5',
};

// ==================== FORM FIELD WRAPPER ====================

export const FIELD_WRAPPER = {
  base: 'relative',
  inline: 'flex items-center gap-2',
  stacked: 'flex flex-col gap-1',
};
