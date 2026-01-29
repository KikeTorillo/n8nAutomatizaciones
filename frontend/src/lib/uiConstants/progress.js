/**
 * ====================================================================
 * CONSTANTES DE BARRA DE PROGRESO
 * ====================================================================
 *
 * Centraliza colores, tamaños y umbrales para ProgressBar.
 *
 * Ene 2026 - Auditoría UI Components
 * ====================================================================
 */

/**
 * Colores de fondo para la barra de progreso
 */
export const PROGRESS_BAR_COLORS = {
  primary: 'bg-primary-500 dark:bg-primary-400',
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  danger: 'bg-red-500 dark:bg-red-400',
  info: 'bg-primary-500 dark:bg-primary-400',
};

/**
 * Colores de texto asociados a cada estado
 */
export const PROGRESS_TEXT_COLORS = {
  primary: 'text-primary-600 dark:text-primary-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-primary-600 dark:text-primary-400',
};

/**
 * Tamaños de la barra de progreso (altura)
 */
export const PROGRESS_BAR_SIZES = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

/**
 * Presets de umbrales para diferentes casos de uso
 */
export const PROGRESS_THRESHOLD_PRESETS = {
  // Para completitud (más alto = mejor): perfil, tareas completadas
  completion: {
    thresholds: [50, 80],
    colors: ['warning', 'warning', 'success'], // <50: warning, 50-80: warning, >80: success
  },
  // Para uso de recursos (más alto = peor): límites, cuotas
  usage: {
    thresholds: [70, 90],
    colors: ['success', 'warning', 'danger'], // <70: success, 70-90: warning, >90: danger
  },
  // Neutral (sin indicador de estado)
  neutral: {
    thresholds: [],
    colors: ['primary'],
  },
};

/**
 * Obtener el color según el porcentaje y los umbrales
 * @param {number} percentage - Porcentaje actual
 * @param {number[]} thresholds - Array de umbrales
 * @param {string[]} colors - Array de colores correspondientes
 * @returns {string} Color a usar
 */
export function getProgressColorByThreshold(percentage, thresholds, colors) {
  if (!thresholds?.length) return colors[0] || 'primary';

  for (let i = 0; i < thresholds.length; i++) {
    if (percentage < thresholds[i]) {
      return colors[i] || 'primary';
    }
  }
  return colors[colors.length - 1] || 'primary';
}

export default {
  PROGRESS_BAR_COLORS,
  PROGRESS_TEXT_COLORS,
  PROGRESS_BAR_SIZES,
  PROGRESS_THRESHOLD_PRESETS,
  getProgressColorByThreshold,
};
