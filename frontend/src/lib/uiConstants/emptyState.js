/**
 * ====================================================================
 * CONSTANTES PARA EMPTY STATE UI
 * ====================================================================
 *
 * Estilos y tamaños para componente EmptyState.
 *
 * Ene 2026 - Auditoría UI Library
 * ====================================================================
 */

/**
 * Tamaños para EmptyState
 * @type {Record<string, {container: string, icon: string, title: string, description: string}>}
 */
export const EMPTY_STATE_SIZES = {
  sm: {
    container: 'p-6',
    icon: 'w-10 h-10',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'p-8 sm:p-12',
    icon: 'w-12 h-12 sm:w-16 sm:h-16',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'p-12 sm:p-16',
    icon: 'w-16 h-16 sm:w-20 sm:h-20',
    title: 'text-xl',
    description: 'text-base',
  },
};

/**
 * Estilos base para EmptyState
 */
export const EMPTY_STATE_BASE = {
  container: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-center',
  icon: 'mx-auto mb-4 text-gray-400 dark:text-gray-500',
  title: 'font-semibold text-gray-900 dark:text-gray-100 mb-2',
  description: 'text-gray-600 dark:text-gray-400 mb-6',
};

/**
 * Helper para obtener tamaño con fallback
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @returns {Object} Objeto con clases de tamaño
 */
export function getEmptyStateSize(size) {
  return EMPTY_STATE_SIZES[size] || EMPTY_STATE_SIZES.md;
}

export default {
  EMPTY_STATE_SIZES,
  EMPTY_STATE_BASE,
  getEmptyStateSize,
};
