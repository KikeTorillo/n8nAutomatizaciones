/**
 * ====================================================================
 * COLORES SEMANTICOS UI
 * ====================================================================
 *
 * Centraliza clases de colores para consistencia en componentes UI.
 * Usar factor 40 para dark mode: dark:bg-{color}-900/40
 *
 * Ene 2026 - Refactorización Frontend
 * Feb 2026 - Migración TypeScript + tipos explícitos
 * ====================================================================
 */

// ==================== INTERFACES ====================

export interface SemanticColorSet {
  bg: string;
  bgLight: string;
  bgSolid: string;
  text: string;
  textDark: string;
  textLight: string;
  border: string;
  borderSolid: string;
  icon: string;
  ring: string;
  hover: string;
  selectedBg?: string;
  selectedBgDark?: string;
  activeBg?: string;
  activeText?: string;
  hoverSubtle?: string;
}

export interface IconBgColorSet {
  bg: string;
  icon: string;
}

/**
 * Colores semánticos para backgrounds, textos y bordes
 * Cada color incluye variantes para diferentes niveles de intensidad
 */
export const SEMANTIC_COLORS: Record<string, SemanticColorSet> = {
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    bgLight: 'bg-primary-50 dark:bg-primary-900/20',
    bgSolid: 'bg-primary-700 dark:bg-primary-600',
    text: 'text-primary-600 dark:text-primary-400',
    textDark: 'text-primary-800 dark:text-primary-200',
    textLight: 'text-primary-500 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-700',
    borderSolid: 'border-primary-500 dark:border-primary-400',
    icon: 'text-primary-600 dark:text-primary-400',
    ring: 'focus:ring-primary-500',
    hover: 'hover:bg-primary-200 dark:hover:bg-primary-800/40',
    // Estados de selección/activación para tabs, listas, navegación
    selectedBg: 'bg-primary-600 text-white',
    selectedBgDark: 'bg-primary-600 dark:bg-primary-500 text-white',
    activeBg: 'bg-primary-50 dark:bg-primary-900/30',
    activeText: 'text-primary-700 dark:text-primary-400',
    hoverSubtle: 'hover:bg-primary-50 dark:hover:bg-primary-900/20',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    bgLight: 'bg-green-50 dark:bg-green-900/20',
    bgSolid: 'bg-green-600 dark:bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    textDark: 'text-green-800 dark:text-green-200',
    textLight: 'text-green-500 dark:text-green-300',
    border: 'border-green-200 dark:border-green-700',
    borderSolid: 'border-green-500 dark:border-green-400',
    icon: 'text-green-600 dark:text-green-400',
    ring: 'focus:ring-green-500',
    hover: 'hover:bg-green-200 dark:hover:bg-green-800/40',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    bgSolid: 'bg-amber-600 dark:bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    textDark: 'text-amber-800 dark:text-amber-200',
    textLight: 'text-amber-500 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-700',
    borderSolid: 'border-amber-500 dark:border-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
    ring: 'focus:ring-amber-500',
    hover: 'hover:bg-amber-200 dark:hover:bg-amber-800/40',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    bgLight: 'bg-red-50 dark:bg-red-900/20',
    bgSolid: 'bg-red-600 dark:bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    textDark: 'text-red-800 dark:text-red-200',
    textLight: 'text-red-500 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700',
    borderSolid: 'border-red-500 dark:border-red-400',
    icon: 'text-red-600 dark:text-red-400',
    ring: 'focus:ring-red-500',
    hover: 'hover:bg-red-200 dark:hover:bg-red-800/40',
  },
  info: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    bgLight: 'bg-primary-50 dark:bg-primary-900/20',
    bgSolid: 'bg-primary-600 dark:bg-primary-500',
    text: 'text-primary-600 dark:text-primary-400',
    textDark: 'text-primary-800 dark:text-primary-200',
    textLight: 'text-primary-500 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-700',
    borderSolid: 'border-primary-500 dark:border-primary-400',
    icon: 'text-primary-600 dark:text-primary-400',
    ring: 'focus:ring-primary-500',
    hover: 'hover:bg-primary-200 dark:hover:bg-primary-800/40',
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    bgLight: 'bg-gray-50 dark:bg-gray-900',
    bgSolid: 'bg-gray-600 dark:bg-gray-500',
    text: 'text-gray-600 dark:text-gray-400',
    textDark: 'text-gray-800 dark:text-gray-200',
    textLight: 'text-gray-500 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
    borderSolid: 'border-gray-500 dark:border-gray-400',
    icon: 'text-gray-600 dark:text-gray-400',
    ring: 'focus:ring-gray-500',
    hover: 'hover:bg-gray-200 dark:hover:bg-gray-700',
  },
};

/**
 * Aliases para compatibilidad con código legacy
 */
export const COLOR_ALIASES: Record<string, string> = {
  blue: 'primary',
  green: 'success',
  yellow: 'warning',
  red: 'danger',
  error: 'danger',
  default: 'neutral',
};

/**
 * Helper para obtener colores con fallback
 */
export function getSemanticColor(color: string): SemanticColorSet {
  const normalizedColor = COLOR_ALIASES[color] || color;
  return SEMANTIC_COLORS[normalizedColor] || SEMANTIC_COLORS.neutral;
}

/**
 * Colores para badges/estados
 * Usados en indicadores de estado en tablas y cards
 * NOTA: Usar 'danger' como nombre canónico, 'error' es alias para retrocompatibilidad
 */
export const BADGE_COLORS: Record<string, string> = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  info: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
};
// Alias para retrocompatibilidad
BADGE_COLORS.error = BADGE_COLORS.danger;

/**
 * Colores para iconos con fondo
 * Usados en StatCards, EmptyState, etc.
 */
export const ICON_BG_COLORS: Record<string, IconBgColorSet> = {
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    icon: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    icon: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  neutral: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    icon: 'text-gray-600 dark:text-gray-400',
  },
  // Aliases legacy
  blue: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    icon: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    icon: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-secondary-100 dark:bg-secondary-900/40',
    icon: 'text-secondary-600 dark:text-secondary-400',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    icon: 'text-cyan-600 dark:text-cyan-400',
  },
};

/**
 * Colores por estado de registro/entidad
 * Mapeo de estados comunes a colores de badge
 */
export const STATUS_COLORS: Record<string, string> = {
  activo: BADGE_COLORS.success,
  inactivo: BADGE_COLORS.default,
  pendiente: BADGE_COLORS.warning,
  cancelado: BADGE_COLORS.danger,
  completado: BADGE_COLORS.success,
  pagado: BADGE_COLORS.success,
  parcial: BADGE_COLORS.warning,
  vencido: BADGE_COLORS.danger,
  disponible: BADGE_COLORS.success,
  agotado: BADGE_COLORS.danger,
  bajo: BADGE_COLORS.warning,
  trial: BADGE_COLORS.info,
  suspendida: BADGE_COLORS.danger,
  grace_period: BADGE_COLORS.warning,
};

/**
 * Helper para obtener color de estado con fallback
 * @param {string} status - Estado del registro
 * @returns {string} Clases de color para badge
 */
export const getStatusColor = (status: string): string => STATUS_COLORS[status] || BADGE_COLORS.default;

/**
 * Colores temáticos para cards/secciones
 * Usados en dashboards, estadísticas, etc.
 */
export const CARD_THEME_COLORS = {
  blue: {
    bg: SEMANTIC_COLORS.primary.bg,
    text: SEMANTIC_COLORS.primary.text,
    border: 'border-primary-500',
  },
  green: {
    bg: SEMANTIC_COLORS.success.bg,
    text: SEMANTIC_COLORS.success.text,
    border: 'border-green-500',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/40',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500',
  },
  yellow: {
    bg: SEMANTIC_COLORS.warning.bg,
    text: SEMANTIC_COLORS.warning.text,
    border: 'border-yellow-500',
  },
  red: {
    bg: SEMANTIC_COLORS.danger.bg,
    text: SEMANTIC_COLORS.danger.text,
    border: 'border-red-500',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500',
  },
};

/**
 * Helper para obtener color temático de card con fallback
 * @param {string} color - Nombre del color
 * @returns {Object} Objeto con clases bg, text, border
 */
export const getCardThemeColor = (color: string) => CARD_THEME_COLORS[color as keyof typeof CARD_THEME_COLORS] || CARD_THEME_COLORS.blue;

/**
 * Colores para ToggleSwitch
 * Track color cuando está enabled/disabled
 */
export const TOGGLE_COLORS = {
  enabled: 'bg-green-500 dark:bg-green-600',
  disabled: 'bg-gray-300 dark:bg-gray-600',
};

export default SEMANTIC_COLORS;
