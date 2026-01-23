/**
 * ====================================================================
 * ESTILOS DE INPUTS
 * ====================================================================
 *
 * Estilos base centralizados para inputs.
 * Evita duplicación entre Input.jsx, SearchInput.jsx y componentes de filtros.
 *
 * Ene 2026 - Auditoría UI Components
 * ====================================================================
 */
import { cn } from '@/lib/utils';

/**
 * Clases base para todos los inputs
 */
export const INPUT_BASE_CLASSES = {
  container: 'w-full border rounded-lg transition-colors',
  focus: 'focus:outline-none focus:ring-2 focus:ring-offset-0',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  bg: 'bg-white dark:bg-gray-800',
  text: 'text-gray-900 dark:text-gray-100',
  placeholder: 'placeholder:text-gray-400 dark:placeholder:text-gray-500',
};

/**
 * Estados de borde para inputs
 */
export const INPUT_BORDER_STATES = {
  default: 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
};

/**
 * Genera las clases base de un input
 * @param {boolean} hasError - Si el input tiene error
 * @returns {string} Clases combinadas
 */
export function getInputBaseStyles(hasError = false) {
  return cn(
    INPUT_BASE_CLASSES.container,
    INPUT_BASE_CLASSES.focus,
    INPUT_BASE_CLASSES.disabled,
    INPUT_BASE_CLASSES.bg,
    INPUT_BASE_CLASSES.text,
    INPUT_BASE_CLASSES.placeholder,
    hasError ? INPUT_BORDER_STATES.error : INPUT_BORDER_STATES.default
  );
}

/**
 * Clases completas pre-computadas para uso rápido
 */
export const INPUT_STYLES = {
  base: cn(
    INPUT_BASE_CLASSES.container,
    INPUT_BASE_CLASSES.focus,
    INPUT_BASE_CLASSES.disabled,
    INPUT_BASE_CLASSES.bg,
    INPUT_BASE_CLASSES.text,
    INPUT_BASE_CLASSES.placeholder
  ),
  default: cn(
    INPUT_BASE_CLASSES.container,
    INPUT_BASE_CLASSES.focus,
    INPUT_BASE_CLASSES.disabled,
    INPUT_BASE_CLASSES.bg,
    INPUT_BASE_CLASSES.text,
    INPUT_BASE_CLASSES.placeholder,
    INPUT_BORDER_STATES.default
  ),
  error: cn(
    INPUT_BASE_CLASSES.container,
    INPUT_BASE_CLASSES.focus,
    INPUT_BASE_CLASSES.disabled,
    INPUT_BASE_CLASSES.bg,
    INPUT_BASE_CLASSES.text,
    INPUT_BASE_CLASSES.placeholder,
    INPUT_BORDER_STATES.error
  ),
};
