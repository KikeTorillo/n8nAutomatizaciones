import { cn } from '@/lib/utils';

/**
 * SkeletonTable - Skeleton loading para tablas
 *
 * @param {Object} props
 * @param {number} [props.rows] - Número de filas skeleton (default: 5)
 * @param {number} [props.columns] - Número de columnas (default: 4)
 * @param {boolean} [props.showHeader] - Mostrar header skeleton (default: true)
 * @param {Array<'sm'|'md'|'lg'>} [props.columnWidths] - Anchos de columnas
 * @param {string} [props.className] - Clases adicionales
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  columnWidths,
  className,
}) {
  const widthClasses = {
    sm: 'w-16',
    md: 'w-24',
    lg: 'w-32',
    xl: 'w-40',
  };

  const getColumnWidth = (index) => {
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
}

/**
 * SkeletonCard - Skeleton loading para cards
 */
export function SkeletonCard({ className }) {
  return (
    <div
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
}

/**
 * SkeletonList - Skeleton loading para listas de cards
 */
export function SkeletonList({ count = 3, className }) {
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
}

SkeletonTable.displayName = 'SkeletonTable';

export default SkeletonTable;
