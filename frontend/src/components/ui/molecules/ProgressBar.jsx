import { cn } from '@/lib/utils';

/**
 * Umbrales predefinidos para colores según el caso de uso
 */
const THRESHOLD_PRESETS = {
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
 * Colores disponibles para la barra
 */
const colorClasses = {
  primary: 'bg-primary-500 dark:bg-primary-400',
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  danger: 'bg-red-500 dark:bg-red-400',
  info: 'bg-blue-500 dark:bg-blue-400',
};

const textColorClasses = {
  primary: 'text-primary-600 dark:text-primary-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
};

/**
 * Obtener el color según el porcentaje y los umbrales
 */
function getColorByThreshold(percentage, thresholds, colors) {
  if (!thresholds?.length) return colors[0] || 'primary';

  for (let i = 0; i < thresholds.length; i++) {
    if (percentage < thresholds[i]) {
      return colors[i] || 'primary';
    }
  }
  return colors[colors.length - 1] || 'primary';
}

/**
 * ProgressBar - Barra de progreso genérica
 *
 * @param {Object} props
 * @param {number} props.value - Valor actual
 * @param {number} [props.max=100] - Valor máximo
 * @param {number} [props.percentage] - Porcentaje directo (alternativo a value/max)
 * @param {string} [props.label] - Etiqueta descriptiva
 * @param {boolean} [props.showPercentage=false] - Mostrar porcentaje
 * @param {boolean} [props.showValue=false] - Mostrar valor/max
 * @param {'horizontal'|'vertical'} [props.layout='horizontal'] - Layout
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamaño de la barra
 * @param {'completion'|'usage'|'neutral'} [props.preset] - Preset de colores
 * @param {string} [props.color] - Color fijo (ignora preset/thresholds)
 * @param {number[]} [props.thresholds] - Umbrales personalizados [umbral1, umbral2]
 * @param {string[]} [props.colors] - Colores para cada rango ['color1', 'color2', 'color3']
 * @param {string} [props.className] - Clases adicionales
 */
export function ProgressBar({
  value = 0,
  max = 100,
  percentage: percentageProp,
  label,
  showPercentage = false,
  showValue = false,
  layout = 'horizontal',
  size = 'md',
  preset,
  color: colorProp,
  thresholds: thresholdsProp,
  colors: colorsProp,
  className,
}) {
  // Calcular porcentaje
  const percentage = percentageProp ?? (max > 0 ? Math.round((value / max) * 100) : 0);
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Determinar color
  let barColor = colorProp;
  if (!barColor) {
    if (preset && THRESHOLD_PRESETS[preset]) {
      const { thresholds, colors } = THRESHOLD_PRESETS[preset];
      barColor = getColorByThreshold(percentage, thresholds, colors);
    } else if (thresholdsProp && colorsProp) {
      barColor = getColorByThreshold(percentage, thresholdsProp, colorsProp);
    } else {
      barColor = 'primary';
    }
  }

  // Tamaños
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  // Layout vertical (estilo LimitProgressBar)
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
              <span className={cn('text-sm font-semibold', textColorClasses[barColor])}>
                {value} / {max}
              </span>
            )}
          </div>
        )}
        <div className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              colorClasses[barColor]
            )}
            style={{ width: `${clampedPercentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
        {showPercentage && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {percentage}% {preset === 'usage' ? 'usado' : 'completado'}
          </p>
        )}
      </div>
    );
  }

  // Layout horizontal (default)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {label && (
        <span className={cn('text-sm font-medium flex-shrink-0', textColorClasses[barColor])}>
          {label}
        </span>
      )}
      {showValue && (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          ({value}/{max})
        </span>
      )}
      <div className={cn(
        'flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-xs',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            colorClasses[barColor]
          )}
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showPercentage && (
        <span className={cn('text-sm font-medium flex-shrink-0', textColorClasses[barColor])}>
          {percentage}%
        </span>
      )}
    </div>
  );
}

/**
 * LimitProgressBar - Wrapper para mostrar uso de límites del plan
 * Mantiene compatibilidad con el componente anterior
 */
export function LimitProgressBar({ label, usado, limite, porcentaje }) {
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
}

export default ProgressBar;
