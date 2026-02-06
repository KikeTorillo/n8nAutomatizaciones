import { memo } from 'react';
import { cn } from '@/lib/utils';
import { PROGRESS_BAR_SIZES } from '@/lib/uiConstants';
import { useProgressColor } from '@/hooks/ui/useProgressColor';
import type { ProgressLayout, ProgressPreset } from '@/types/ui';

export interface ProgressBarProps {
  /** Valor actual */
  value?: number;
  /** Valor máximo */
  max?: number;
  /** @deprecated Usar value + max en su lugar. Porcentaje directo */
  percentage?: number;
  /** Etiqueta descriptiva */
  label?: string;
  /** Mostrar porcentaje */
  showPercentage?: boolean;
  /** Mostrar valor/max */
  showValue?: boolean;
  /** Layout */
  layout?: ProgressLayout;
  /** Tamaño de la barra */
  size?: string;
  /** Preset de colores */
  preset?: ProgressPreset;
  /** Color fijo (ignora preset/thresholds) */
  color?: string;
  /** Umbrales personalizados [umbral1, umbral2] */
  thresholds?: number[];
  /** Colores para cada rango ['color1', 'color2', 'color3'] */
  colors?: string[];
  /** Clases adicionales */
  className?: string;
}

export interface LimitProgressBarProps {
  /** Etiqueta */
  label?: string;
  /** Valor usado */
  usado?: number;
  /** Límite total */
  limite?: number;
  /** Porcentaje precalculado */
  porcentaje?: number;
}

/**
 * ProgressBar - Barra de progreso genérica
 */
export const ProgressBar = memo(function ProgressBar({
  value = 0,
  max = 100,
  percentage: percentageProp,
  label,
  showPercentage = false,
  showValue = false,
  layout = 'horizontal',
  size = 'md',
  preset,
  color,
  thresholds,
  colors,
  className,
}: ProgressBarProps) {
  const percentage = percentageProp ?? (max > 0 ? Math.round((value / max) * 100) : 0);
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const { barColorClass, textColorClass } = useProgressColor({
    percentage,
    color,
    preset,
    thresholds,
    colors,
  });

  const barTrack = cn(
    'bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
    PROGRESS_BAR_SIZES[size]
  );

  const barFill = cn('h-full rounded-full transition-all duration-300', barColorClass);

  const progressProps = {
    role: 'progressbar' as const,
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    style: { width: `${clampedPercentage}%` },
  };

  if (layout === 'vertical') {
    return (
      <div className={cn('space-y-2', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
              </span>
            )}
            {showValue && (
              <span className={cn('text-sm font-semibold', textColorClass)}>
                {value} / {max}
              </span>
            )}
          </div>
        )}
        <div className={cn('w-full', barTrack)}>
          <div className={barFill} {...progressProps} />
        </div>
        {showPercentage && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {percentage}% {preset === 'usage' ? 'usado' : 'completado'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {label && (
        <span className={cn('text-sm font-medium flex-shrink-0', textColorClass)}>
          {label}
        </span>
      )}
      {showValue && (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          ({value}/{max})
        </span>
      )}
      <div className={cn('flex-1 max-w-xs', barTrack)}>
        <div className={barFill} {...progressProps} />
      </div>
      {showPercentage && (
        <span className={cn('text-sm font-medium flex-shrink-0', textColorClass)}>
          {percentage}%
        </span>
      )}
    </div>
  );
});

/**
 * LimitProgressBar - Wrapper para mostrar uso de límites del plan
 * Mantiene compatibilidad con el componente anterior
 */
export const LimitProgressBar = memo(function LimitProgressBar({ label, usado, limite, porcentaje }: LimitProgressBarProps) {
  return (
    <ProgressBar
      value={usado}
      max={limite}
      percentage={porcentaje}
      label={label}
      showValue
      showPercentage
      layout="vertical"
      preset="usage"
    />
  );
});

ProgressBar.displayName = 'ProgressBar';
LimitProgressBar.displayName = 'LimitProgressBar';
