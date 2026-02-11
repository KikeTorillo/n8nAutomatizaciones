import { memo } from 'react';
import { cn } from '../lib/cn';
import { LOADING_STATES } from '../constants';

export interface SkeletonProps {
  /** Forma del skeleton */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Ancho — clase Tailwind (w-32, w-full, etc.) */
  width?: string;
  /** Alto — clase Tailwind (h-4, h-10, etc.) */
  height?: string;
  /** Clases CSS adicionales */
  className?: string;
}

const VARIANT_STYLES = {
  text: 'rounded h-4',
  circular: 'rounded-full',
  rectangular: 'rounded-lg',
} as const;

/**
 * Skeleton - Placeholder de carga base
 *
 * Unidad base para componer skeletons. SkeletonTable, SkeletonCard y
 * SkeletonList (molecules) pueden usarlo internamente.
 *
 * @example
 * <Skeleton variant="text" width="w-3/4" />
 * <Skeleton variant="circular" width="w-10" height="h-10" />
 * <Skeleton variant="rectangular" width="w-full" height="h-32" />
 */
const Skeleton = memo(function Skeleton({
  variant = 'text',
  width = 'w-full',
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        LOADING_STATES.skeleton,
        VARIANT_STYLES[variant],
        width,
        height,
        className
      )}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };
