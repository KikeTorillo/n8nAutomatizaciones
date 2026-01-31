/**
 * ====================================================================
 * PAGE HEADER - CONSTANTES DE COLORES
 * ====================================================================
 *
 * Colores temáticos para iconos en PageHeader.
 * Sigue el patrón de ICON_BG_COLORS pero con colores específicos
 * para headers de página.
 *
 * Ene 2026 - Componentes UI Reutilizables
 * ====================================================================
 */

/**
 * Colores para iconos de PageHeader
 * Cada color incluye bg (fondo) e icon (color del icono)
 */
export const PAGE_HEADER_ICON_COLORS = {
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    icon: 'text-pink-600 dark:text-pink-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    icon: 'text-gray-600 dark:text-gray-400',
  },
};

/**
 * Helper para obtener color de icono con fallback
 * @param {string} color - Nombre del color
 * @returns {Object} Objeto con clases bg e icon
 */
export const getPageHeaderIconColor = (color) =>
  PAGE_HEADER_ICON_COLORS[color] || PAGE_HEADER_ICON_COLORS.primary;

/**
 * Estilos base para PageHeader
 */
export const PAGE_HEADER_STYLES = {
  container: 'mb-6',
  backButton: 'mb-4',
  titleRow: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
  iconWrapper: 'flex-shrink-0 p-2 rounded-lg',
  titleContainer: 'min-w-0 flex-1',
  titleBadgeRow: 'flex items-center gap-2 flex-wrap',
  title: 'text-2xl font-bold text-gray-900 dark:text-gray-100',
  subtitle: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
  metadataContainer: 'mt-2 flex flex-wrap items-center gap-x-4 gap-y-1',
  metadataItem: 'flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400',
  metadataIcon: 'w-4 h-4',
  actionsContainer: 'flex items-center gap-2 flex-shrink-0',
};
