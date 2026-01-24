/**
 * ====================================================================
 * CONSTANTES DE FILTROS
 * ====================================================================
 *
 * Centraliza estilos para paneles y componentes de filtros.
 *
 * Ene 2026 - Auditoría UI Components
 * ====================================================================
 */

/**
 * Estilos del contenedor del panel de filtros
 */
export const FILTER_PANEL_CONTAINER = 'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm';

/**
 * Estilos del header del panel de filtros
 */
export const FILTER_PANEL_HEADER = 'p-4 flex flex-col sm:flex-row sm:items-center gap-3';

/**
 * Estilos del contenido expandible del panel
 */
export const FILTER_PANEL_CONTENT = 'border-t border-gray-200 dark:border-gray-700 p-4';

/**
 * Estilos del botón toggle de filtros por estado
 */
export const FILTER_TOGGLE_BUTTON_STYLES = {
  base: 'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[40px]',
  active: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400',
  inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  hover: 'hover:bg-gray-200 dark:hover:bg-gray-600',
};

/**
 * Estilos del badge de conteo de filtros
 */
export const FILTER_COUNT_BADGE = 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-primary-600 text-white';

/**
 * Estilos para checkbox de filtro
 */
export const FILTER_CHECKBOX_STYLES = {
  container: 'flex items-center gap-2.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
  containerDisabled: 'opacity-50 cursor-not-allowed',
  input: 'h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-400 dark:bg-gray-700',
  labelActive: 'text-gray-900 dark:text-gray-100 font-medium',
  labelInactive: 'text-gray-600 dark:text-gray-400',
};

/**
 * Estilos para select de filtro
 */
export const FILTER_SELECT_STYLES = {
  label: 'flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300',
  select: 'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400',
};

/**
 * Estilos del título de sección de filtros
 */
export const FILTER_SECTION_TITLE = 'flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400';

/**
 * Layouts de grid para secciones de filtros
 */
export const FILTER_GRID_LAYOUTS = {
  default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  compact: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  single: 'space-y-4',
};

/**
 * Obtener estilos del botón toggle según estado
 * @param {boolean} isOpen - Si el panel está abierto
 * @returns {string} Clases CSS concatenadas
 */
export function getFilterToggleStyles(isOpen) {
  return `${FILTER_TOGGLE_BUTTON_STYLES.base} ${isOpen ? FILTER_TOGGLE_BUTTON_STYLES.active : FILTER_TOGGLE_BUTTON_STYLES.inactive} ${FILTER_TOGGLE_BUTTON_STYLES.hover}`;
}

export default {
  FILTER_PANEL_CONTAINER,
  FILTER_PANEL_HEADER,
  FILTER_PANEL_CONTENT,
  FILTER_TOGGLE_BUTTON_STYLES,
  FILTER_COUNT_BADGE,
  FILTER_CHECKBOX_STYLES,
  FILTER_SELECT_STYLES,
  FILTER_SECTION_TITLE,
  FILTER_GRID_LAYOUTS,
  getFilterToggleStyles,
};
