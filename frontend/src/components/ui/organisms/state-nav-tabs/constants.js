/**
 * Constantes y estilos para StateNavTabs
 */

// Estilos base para tabs activos/inactivos
export const TAB_STYLES = {
  base: 'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
  active: 'text-primary-700 dark:text-primary-400 border-primary-700 dark:border-primary-400',
  inactive: 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
};

// Estilos para badges/counts
export const COUNT_STYLES = {
  active: 'bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200',
  inactive: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

// Estilos para dropdown items
export const DROPDOWN_ITEM_STYLES = {
  base: 'w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
  active: 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  inactive: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
  disabled: 'opacity-50 cursor-not-allowed',
};
