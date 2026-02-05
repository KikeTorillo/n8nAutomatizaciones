import { memo } from 'react';
import { cn } from '@/lib/utils';
import { LOADING_STATES } from '@/lib/uiConstants';
import type { SkeletonVariant } from '@/types/ui';

export interface SkeletonStatCardProps {
  /** Variante visual del skeleton */
  variant?: SkeletonVariant;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * SkeletonStatCard - Skeleton de carga para StatCard
 *
 * Soporta dos variantes:
 * - compact (default): Layout horizontal compacto
 * - expanded: Layout vertical (estilo dashboard)
 */
export const SkeletonStatCard = memo(function SkeletonStatCard({
  variant = 'compact',
  className,
}: SkeletonStatCardProps) {
  if (variant === 'expanded') {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse', className)}>
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
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 animate-pulse',
      className
    )}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={cn('w-10 h-10 rounded-lg', LOADING_STATES.skeleton)} />
        <div className="flex-1">
          <div className={cn('h-3 rounded w-16 mb-2', LOADING_STATES.skeleton)} />
          <div className={cn('h-6 rounded w-12', LOADING_STATES.skeleton)} />
        </div>
      </div>
    </div>
  );
});

SkeletonStatCard.displayName = 'SkeletonStatCard';
