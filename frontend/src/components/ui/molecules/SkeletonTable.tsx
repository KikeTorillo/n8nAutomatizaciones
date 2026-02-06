import { memo, forwardRef, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { SkeletonColumnWidth } from '@/types/ui';

export interface SkeletonTableProps {
  /** Número de filas skeleton (default: 5) */
  rows?: number;
  /** Número de columnas (default: 4) */
  columns?: number;
  /** Mostrar header skeleton (default: true) */
  showHeader?: boolean;
  /** Anchos de columnas */
  columnWidths?: SkeletonColumnWidth[];
  /** Clases adicionales */
  className?: string;
}

export interface SkeletonCardProps {
  /** Clases adicionales */
  className?: string;
  /** Estilos inline */
  style?: CSSProperties;
}

export interface SkeletonListProps {
  /** Número de cards */
  count?: number;
  /** Clases adicionales */
  className?: string;
}

const widthClasses: Record<SkeletonColumnWidth, string> = {
  sm: 'w-16',
  md: 'w-24',
  lg: 'w-32',
  xl: 'w-40',
};

/**
 * SkeletonTable - Skeleton loading para tablas
 */
export const SkeletonTable = memo(
  forwardRef<HTMLDivElement, SkeletonTableProps>(function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  columnWidths,
  className,
}, ref) {
  const getColumnWidth = (index: number): string => {
    if (columnWidths && columnWidths[index]) {
      return widthClasses[columnWidths[index]] || 'w-24';
    }
    // Patrón por defecto: primera col más ancha, última más estrecha
    if (index === 0) return 'w-32';
    if (index === columns - 1) return 'w-20';
    return 'w-24';
  };

  return (
    <div
      ref={ref}
      role="status"
      aria-busy="true"
      aria-label="Cargando tabla..."
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        'overflow-hidden',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {showHeader && (
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="px-4 sm:px-6 py-3 text-left"
                  >
                    <div
                      className={cn(
                        'h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse',
                        getColumnWidth(colIndex)
                      )}
                    />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 sm:px-6 py-4"
                  >
                    <div
                      className={cn(
                        'h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse',
                        getColumnWidth(colIndex)
                      )}
                      style={{
                        animationDelay: `${(rowIndex * columns + colIndex) * 50}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}));

/**
 * SkeletonCard - Skeleton loading para cards
 */
export const SkeletonCard = memo(function SkeletonCard({ className, style }: SkeletonCardProps) {
  return (
    <div
      style={style}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm',
        'border border-gray-200 dark:border-gray-700',
        'p-4 animate-pulse',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  );
});

/**
 * SkeletonList - Skeleton loading para listas de cards
 */
export const SkeletonList = memo(function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  );
});

SkeletonTable.displayName = 'SkeletonTable';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonList.displayName = 'SkeletonList';
