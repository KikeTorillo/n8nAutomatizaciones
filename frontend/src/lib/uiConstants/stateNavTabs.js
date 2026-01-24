/**
 * ====================================================================
 * CONSTANTES PARA STATE NAV TABS
 * ====================================================================
 *
 * Estilos centralizados para componentes de navegación por tabs con estado.
 * Estos son específicos para StateNavTabs (navegación de estados en listados).
 *
 * Para tabs simples (ViewTabs), usar constantes de './tabs.js'.
 *
 * Uso:
 *   import { STATE_TAB_STYLES, STATE_COUNT_STYLES } from '@/lib/uiConstants';
 *
 * Ene 2026 - Preparación Librería UI
 * ====================================================================
 */

import { cn } from '@/lib/utils';

// ==================== ESTILOS DE TABS ====================

/**
 * Estilos base para tabs activos/inactivos en StateNavTabs
 */
export const STATE_TAB_STYLES = {
  base: cn(
    'flex items-center gap-2 px-4 py-3',
    'text-sm font-medium whitespace-nowrap',
    'border-b-2 transition-colors'
  ),
  active: cn(
    'text-primary-700 dark:text-primary-400',
    'border-primary-700 dark:border-primary-400'
  ),
  inactive: cn(
    'text-gray-500 dark:text-gray-400',
    'border-transparent',
    'hover:text-gray-700 dark:hover:text-gray-300',
    'hover:border-gray-300 dark:hover:border-gray-600'
  ),
};

// Alias para backward compatibility
export const TAB_STYLES = STATE_TAB_STYLES;

/**
 * Genera clases para un tab según su estado
 *
 * @param {boolean} isActive - Si el tab está activo
 * @returns {string} - Clases Tailwind
 */
export function getStateTabStyles(isActive) {
  return cn(STATE_TAB_STYLES.base, isActive ? STATE_TAB_STYLES.active : STATE_TAB_STYLES.inactive);
}

// ==================== ESTILOS DE COUNTS/BADGES ====================

/**
 * Estilos para badges de contador en tabs
 */
export const STATE_COUNT_STYLES = {
  base: cn('ml-1 px-2 py-0.5 text-xs rounded-full font-semibold'),
  active: cn('bg-primary-200 dark:bg-primary-800', 'text-primary-800 dark:text-primary-200'),
  inactive: cn('bg-red-100 dark:bg-red-900/30', 'text-red-600 dark:text-red-400'),
};

// Alias para backward compatibility
export const COUNT_STYLES = STATE_COUNT_STYLES;

/**
 * Genera clases para un badge de contador
 *
 * @param {boolean} isActive - Si el tab padre está activo
 * @returns {string} - Clases Tailwind
 */
export function getStateCountStyles(isActive) {
  return cn(STATE_COUNT_STYLES.base, isActive ? STATE_COUNT_STYLES.active : STATE_COUNT_STYLES.inactive);
}

// ==================== ESTILOS DE DROPDOWN ITEMS ====================

/**
 * Estilos para items de dropdown en tabs agrupados
 */
export const STATE_DROPDOWN_ITEM_STYLES = {
  base: cn(
    'w-full flex items-center gap-3 px-4 py-2',
    'text-sm text-left transition-colors'
  ),
  active: cn(
    'bg-primary-50 dark:bg-primary-900/30',
    'text-primary-700 dark:text-primary-400'
  ),
  inactive: cn(
    'text-gray-700 dark:text-gray-300',
    'hover:bg-gray-100 dark:hover:bg-gray-700'
  ),
  disabled: 'opacity-50 cursor-not-allowed',
};

// Alias para backward compatibility
export const DROPDOWN_ITEM_STYLES = STATE_DROPDOWN_ITEM_STYLES;

/**
 * Genera clases para un item de dropdown
 *
 * @param {boolean} isActive - Si el item está activo
 * @param {boolean} [isDisabled=false] - Si el item está deshabilitado
 * @returns {string} - Clases Tailwind
 */
export function getStateDropdownItemStyles(isActive, isDisabled = false) {
  return cn(
    STATE_DROPDOWN_ITEM_STYLES.base,
    isDisabled && STATE_DROPDOWN_ITEM_STYLES.disabled,
    isActive ? STATE_DROPDOWN_ITEM_STYLES.active : STATE_DROPDOWN_ITEM_STYLES.inactive
  );
}

// ==================== ESTILOS DE CONTENEDOR ====================

/**
 * Estilos para el contenedor del componente StateNavTabs
 */
export const STATE_NAV_CONTAINER_STYLES = {
  wrapper: cn(
    'bg-white dark:bg-gray-800',
    'border-b border-gray-200 dark:border-gray-700'
  ),
  sticky: 'sticky z-10',
  inner: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  nav: 'hidden md:flex items-center -mb-px',
  mobileContainer: 'md:hidden py-2',
};

// ==================== ESTILOS DE DROPDOWN MENU ====================

/**
 * Estilos para el menú dropdown
 */
export const STATE_DROPDOWN_MENU_STYLES = {
  container: cn(
    'absolute left-0 mt-1 w-48',
    'bg-white dark:bg-gray-800',
    'rounded-lg shadow-lg',
    'border border-gray-200 dark:border-gray-700',
    'py-1 z-50'
  ),
  mobileContainer: cn(
    'absolute left-0 right-0 mt-1',
    'bg-white dark:bg-gray-800',
    'rounded-lg shadow-lg',
    'border border-gray-200 dark:border-gray-700',
    'py-2 z-50',
    'max-h-[60vh] overflow-y-auto'
  ),
};

// ==================== ESTILOS DE MOBILE SELECTOR ====================

/**
 * Estilos para el selector móvil
 */
export const STATE_MOBILE_SELECTOR_STYLES = {
  button: cn(
    'w-full flex items-center justify-between gap-2 px-4 py-3',
    'text-sm font-medium rounded-lg transition-colors',
    'bg-white dark:bg-gray-700',
    'border border-gray-200 dark:border-gray-600',
    'text-gray-900 dark:text-gray-100'
  ),
  icon: 'h-4 w-4 text-primary-600 dark:text-primary-400',
  chevron: 'h-5 w-5 text-gray-400 transition-transform',
  chevronOpen: 'rotate-180',
};
