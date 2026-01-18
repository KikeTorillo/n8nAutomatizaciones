import { cn } from '@/lib/utils';
import { ICON_BG_COLORS, SEMANTIC_COLORS, LOADING_STATES } from '@/lib/uiConstants';

/**
 * Skeleton de carga para StatCard
 */
function StatCardSkeleton({ variant = 'compact' }) {
  if (variant === 'expanded') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('h-5 rounded w-24', LOADING_STATES.skeleton)} />
          <div className={cn('h-8 w-8 rounded', LOADING_STATES.skeleton)} />
        </div>
        <div className={cn('h-8 rounded w-16 mb-2', LOADING_STATES.skeleton)} />
        <div className={cn('h-4 rounded w-20', LOADING_STATES.skeleton)} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 animate-pulse">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn('w-10 h-10 rounded-lg', LOADING_STATES.skeleton)} />
        <div className="flex-1">
          <div className={cn('h-3 rounded w-16 mb-2', LOADING_STATES.skeleton)} />
          <div className={cn('h-6 rounded w-12', LOADING_STATES.skeleton)} />
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
  title,
  value,
  subtext,
  subtitle,
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
  const colors = ICON_BG_COLORS[color] || ICON_BG_COLORS.primary;

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
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {displaySubtext && (
          <p className={cn('text-sm mt-1', SEMANTIC_COLORS.neutral.text)}>
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
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs sm:text-sm truncate', SEMANTIC_COLORS.neutral.text)}>
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
                    ? SEMANTIC_COLORS.success.text
                    : SEMANTIC_COLORS.danger.text
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {displaySubtext && (
            <p className={cn('text-xs mt-1', SEMANTIC_COLORS.neutral.textLight)}>
              {displaySubtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

StatCard.displayName = 'StatCard';

export default StatCard;
