import { memo, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { ICON_BG_COLORS, SEMANTIC_COLORS } from '@/lib/uiConstants';
import { SkeletonStatCard } from './SkeletonStatCard';
import type { StatCardVariant, StatCardTrend, LucideIcon } from '@/types/ui';

export interface StatCardProps {
  /** Icono de lucide-react */
  icon: LucideIcon;
  /** Etiqueta descriptiva */
  label?: string;
  /** Valor a mostrar */
  value: number | string;
  /** Texto secundario opcional */
  subtext?: string;
  /** Color del icono */
  color?: string;
  /** Tendencia opcional (solo variant=compact) */
  trend?: StatCardTrend;
  /** Variante visual */
  variant?: StatCardVariant;
  /** Mostrar skeleton de carga */
  isLoading?: boolean;
  /** Callback al hacer clic (hace la card clickeable) */
  onClick?: () => void;
  /** Clases adicionales */
  className?: string;
}

/**
 * StatCard - Card de métrica reutilizable
 *
 * Soporta dos variantes:
 * - compact (default): Layout horizontal compacto con icono a la izquierda
 * - expanded: Layout vertical con título prominente (estilo dashboard)
 */
export const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'primary',
  trend,
  variant = 'compact',
  isLoading = false,
  onClick,
  className,
}: StatCardProps) {
  const colors = ICON_BG_COLORS[color] || ICON_BG_COLORS.primary;

  // Estado de carga
  if (isLoading) {
    return <SkeletonStatCard variant={variant} />;
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && e.key === 'Enter') {
      onClick();
    }
  };

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
        onKeyDown={onClick ? handleKeyDown : undefined}
        aria-label={`${label}: ${value}${subtext ? `, ${subtext}` : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </h3>
          <div className={cn('p-2 rounded-lg', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {value}
        </p>
        {subtext && (
          <p className={cn('text-sm mt-1', SEMANTIC_COLORS.neutral.text)}>
            {subtext}
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
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={`${label}: ${value}${subtext ? `, ${subtext}` : ''}`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', colors.icon)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs sm:text-sm truncate', SEMANTIC_COLORS.neutral.text)}>
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
                    ? SEMANTIC_COLORS.success.text
                    : SEMANTIC_COLORS.danger.text
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtext && (
            <p className={cn('text-xs mt-1', SEMANTIC_COLORS.neutral.textLight)}>
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';
