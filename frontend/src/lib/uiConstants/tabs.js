/**
 * ====================================================================
 * CONSTANTES DE TABS
 * ====================================================================
 *
 * Centraliza estilos para componentes de pestañas/tabs.
 *
 * Ene 2026 - Auditoría UI Components
 * ====================================================================
 */

/**
 * Estilos del contenedor de tabs
 */
export const TAB_CONTAINER_STYLES = 'border-b border-gray-200 dark:border-gray-700 mb-4';

/**
 * Estilos de navegación de tabs
 */
export const TAB_NAV_STYLES = 'flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide';

/**
 * Estilos de botones de tab por estado
 */
export const TAB_BUTTON_STYLES = {
  base: 'flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap',
  active: 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400',
  inactive: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
};

/**
 * Estilos de iconos de tab por estado
 */
export const TAB_ICON_STYLES = {
  base: 'w-4 h-4 sm:w-5 sm:h-5',
  active: 'text-primary-600 dark:text-primary-400',
  inactive: 'text-gray-400 dark:text-gray-500',
};

/**
 * Obtener estilos de botón según estado activo
 * @param {boolean} isActive - Si el tab está activo
 * @returns {string} Clases CSS concatenadas
 */
export function getTabButtonStyles(isActive) {
  return `${TAB_BUTTON_STYLES.base} ${isActive ? TAB_BUTTON_STYLES.active : TAB_BUTTON_STYLES.inactive}`;
}

/**
 * Obtener estilos de icono según estado activo
 * @param {boolean} isActive - Si el tab está activo
 * @returns {string} Clases CSS concatenadas
 */
export function getTabIconStyles(isActive) {
  return `${TAB_ICON_STYLES.base} ${isActive ? TAB_ICON_STYLES.active : TAB_ICON_STYLES.inactive}`;
}

export default {
  TAB_CONTAINER_STYLES,
  TAB_NAV_STYLES,
  TAB_BUTTON_STYLES,
  TAB_ICON_STYLES,
  getTabButtonStyles,
  getTabIconStyles,
};
