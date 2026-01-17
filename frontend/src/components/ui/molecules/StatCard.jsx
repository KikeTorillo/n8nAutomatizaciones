import { cn } from '@/lib/utils';

/**
 * Colores disponibles para StatCard
 * - primary: Color principal de la marca
 * - success/green: Estados positivos
 * - warning/yellow/orange: Alertas
 * - danger/red: Errores o estados críticos
 * - info/blue/cyan/purple: Información neutral
 */
const colorClasses = {
  // Color principal - PREFERIDO
  primary: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    text: 'text-primary-600 dark:text-primary-400',
  },
  // Colores semánticos
  success: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  danger: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-600 dark:text-red-400',
  },
  info: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    text: 'text-primary-600 dark:text-primary-400',
  },
  // Aliases legacy (para compatibilidad)
  blue: {
    bg: 'bg-primary-100 dark:bg-primary-900/40',
    text: 'text-primary-600 dark:text-primary-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-600 dark:text-green-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/40',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/40',
    text: 'text-orange-600 dark:text-orange-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/40',
    text: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-secondary-100 dark:bg-secondary-900/40',
    text: 'text-secondary-600 dark:text-secondary-400',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/40',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
};

/**
 * Skeleton de carga para StatCard
 */
function StatCardSkeleton({ variant = 'compact' }) {
  if (variant === 'expanded') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 animate-pulse">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * StatCard - Card de métrica reutilizable
 *
 * Soporta dos variantes:
 * - compact (default): Layout horizontal compacto con icono a la izquierda
 * - expanded: Layout vertical con título prominente (estilo dashboard)
 *
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icono de lucide-react
 * @param {string} props.label - Etiqueta descriptiva (alias: title)
 * @param {string} [props.title] - Alias de label para compatibilidad
 * @param {number|string} props.value - Valor a mostrar
 * @param {string} [props.subtext] - Texto secundario opcional (alias: subtitle)
 * @param {string} [props.subtitle] - Alias de subtext para compatibilidad
 * @param {string} [props.color='primary'] - Color del icono
 * @param {Object} [props.trend] - Tendencia opcional (solo variant=compact)
 * @param {number} props.trend.value - Valor de la tendencia
 * @param {boolean} props.trend.isPositive - Si es positiva o negativa
 * @param {'compact'|'expanded'} [props.variant='compact'] - Variante visual
 * @param {boolean} [props.isLoading=false] - Mostrar skeleton de carga
 * @param {function} [props.onClick] - Callback al hacer clic (hace la card clickeable)
 * @param {string} [props.className] - Clases adicionales
 */
export function StatCard({
  icon: Icon,
  label,
  title, // Alias de label
  value,
  subtext,
  subtitle, // Alias de subtext
  color = 'primary',
  trend,
  variant = 'compact',
  isLoading = false,
  onClick,
  className,
}) {
  // Resolver aliases
  const displayLabel = label || title;
  const displaySubtext = subtext || subtitle;
  const colors = colorClasses[color] || colorClasses.primary;

  // Estado de carga
  if (isLoading) {
    return <StatCardSkeleton variant={variant} />;
  }

  // Variante expandida (estilo dashboard)
  if (variant === 'expanded') {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6',
          'hover:shadow-md transition-shadow',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {displayLabel}
          </h3>
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.text)} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {displaySubtext && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {displaySubtext}
          </p>
        )}
      </div>
    );
  }

  // Variante compacta (default)
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        'p-3 sm:p-4',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
            {displayLabel}
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
          {displaySubtext && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {displaySubtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCard;
