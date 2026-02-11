import { useMemo } from 'react';
import {
  PROGRESS_BAR_COLORS,
  PROGRESS_TEXT_COLORS,
  PROGRESS_THRESHOLD_PRESETS,
  getProgressColorByThreshold,
} from '../constants';

type ProgressPreset = 'completion' | 'usage' | 'neutral';

interface UseProgressColorOptions {
  percentage: number;
  color?: string;
  preset?: ProgressPreset;
  thresholds?: number[];
  colors?: string[];
}

interface UseProgressColorResult {
  colorName: string;
  barColorClass: string;
  textColorClass: string;
}

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
        colorName = getProgressColorByThreshold(
          percentage,
          thresholdsProp,
          colorsProp
        );
      } else {
        colorName = 'primary';
      }
    }

    return {
      colorName,
      barColorClass:
        PROGRESS_BAR_COLORS[colorName] || PROGRESS_BAR_COLORS.primary,
      textColorClass:
        PROGRESS_TEXT_COLORS[colorName] || PROGRESS_TEXT_COLORS.primary,
    };
  }, [percentage, colorProp, preset, thresholdsProp, colorsProp]);
}
