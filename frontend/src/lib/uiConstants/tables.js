/**
 * ====================================================================
 * CONSTANTES PARA TABLAS UI
 * ====================================================================
 *
 * Estilos y configuraciones reutilizables para DataTable y tablas.
 *
 * Ene 2026 - Auditoría UI Library
 * ====================================================================
 */

/**
 * Clases de alineación para celdas de tabla
 */
export const TABLE_ALIGN_CLASSES = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Clases de ancho para columnas
 */
export const TABLE_WIDTH_CLASSES = {
  sm: 'w-20',
  md: 'w-32',
  lg: 'w-48',
  xl: 'w-64',
  auto: '',
};

/**
 * Mapeo de anchos para skeleton
 */
export const TABLE_WIDTH_MAP = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  auto: 'md',
};

/**
 * Estilos base para tablas
 */
export const TABLE_BASE_STYLES = {
  container: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
  wrapper: 'overflow-x-auto',
  table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
  thead: 'bg-gray-50 dark:bg-gray-900/50',
  tbody: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700',
};

/**
 * Estilos para celdas de header
 */
export const TABLE_HEADER_CELL = 'px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider';

/**
 * Estilos para celdas de body
 */
export const TABLE_BODY_CELL = 'px-4 sm:px-6 py-4 text-sm text-gray-900 dark:text-gray-100';

/**
 * Estilos para filas
 */
export const TABLE_ROW_STYLES = {
  base: 'transition-colors',
  hoverable: 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
  clickable: 'cursor-pointer',
  striped: 'bg-gray-50/50 dark:bg-gray-800/50',
};

export default {
  TABLE_ALIGN_CLASSES,
  TABLE_WIDTH_CLASSES,
  TABLE_WIDTH_MAP,
  TABLE_BASE_STYLES,
  TABLE_HEADER_CELL,
  TABLE_BODY_CELL,
  TABLE_ROW_STYLES,
};
