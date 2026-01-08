import { cn } from '@/lib/utils';

/**
 * StatCard - Card de métrica reutilizable
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono de lucide-react
 * @param {string} props.label - Etiqueta descriptiva
 * @param {number|string} props.value - Valor a mostrar
 * @param {'blue'|'green'|'yellow'|'red'|'purple'|'primary'} props.color - Color del icono
 * @param {Object} [props.trend] - Tendencia opcional
 * @param {number} props.trend.value - Valor de la tendencia
 * @param {boolean} props.trend.isPositive - Si es positiva o negativa
 * @param {string} [props.subtext] - Texto secundario opcional
 * @param {string} [props.className] - Clases adicionales
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  color = 'primary',
  trend,
  subtext,
  className
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-600 dark:text-green-400',
    },
    yellow: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/40',
      text: 'text-yellow-600 dark:text-yellow-400',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/40',
      text: 'text-red-600 dark:text-red-400',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-600 dark:text-purple-400',
    },
    primary: {
      bg: 'bg-primary-100 dark:bg-primary-900/40',
      text: 'text-primary-600 dark:text-primary-400',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        'p-3 sm:p-4',
        className
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            {trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
