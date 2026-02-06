import { useMemo } from 'react';
import {
  PROGRESS_BAR_COLORS,
  PROGRESS_TEXT_COLORS,
  PROGRESS_THRESHOLD_PRESETS,
  getProgressColorByThreshold,
} from '@/lib/uiConstants';
import type { ProgressPreset } from '@/types/ui';

interface UseProgressColorOptions {
  /** Porcentaje calculado */
  percentage: number;
  /** Color fijo (ignora preset/thresholds) */
  color?: string;
  /** Preset de colores */
  preset?: ProgressPreset;
  /** Umbrales personalizados */
  thresholds?: number[];
  /** Colores para cada rango */
  colors?: string[];
}

interface UseProgressColorResult {
  /** Nombre del color resuelto */
  colorName: string;
  /** Clase CSS para el fondo de la barra */
  barColorClass: string;
  /** Clase CSS para texto */
  textColorClass: string;
}

/**
 * useProgressColor - Calcula el color de una barra de progreso
 *
 * Soporta:
 * - Color fijo
 * - Presets (completion, usage, neutral)
 * - Umbrales personalizados
 */
export function useProgressColor({
  percentage,
  color: colorProp,
  preset,
  thresholds: thresholdsProp,
  colors: colorsProp,
}: UseProgressColorOptions): UseProgressColorResult {
  return useMemo(() => {
    let colorName = colorProp;

    if (!colorName) {
      if (preset && PROGRESS_THRESHOLD_PRESETS[preset]) {
        const { thresholds, colors } = PROGRESS_THRESHOLD_PRESETS[preset];
        colorName = getProgressColorByThreshold(percentage, thresholds, colors);
      } else if (thresholdsProp && colorsProp) {
        colorName = getProgressColorByThreshold(percentage, thresholdsProp, colorsProp);
      } else {
        colorName = 'primary';
      }
    }

    return {
      colorName,
      barColorClass: PROGRESS_BAR_COLORS[colorName] || PROGRESS_BAR_COLORS.primary,
      textColorClass: PROGRESS_TEXT_COLORS[colorName] || PROGRESS_TEXT_COLORS.primary,
    };
  }, [percentage, colorProp, preset, thresholdsProp, colorsProp]);
}
