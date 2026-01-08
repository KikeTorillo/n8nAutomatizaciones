import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

/**
 * Pagination - Componente de paginación reutilizable
 *
 * Soporta paginación server-side con info del backend
 *
 * @param {Object} props
 * @param {Object} props.pagination - Objeto de paginación del backend
 * @param {number} props.pagination.page - Página actual (1-indexed)
 * @param {number} props.pagination.limit - Items por página
 * @param {number} props.pagination.total - Total de items
 * @param {number} props.pagination.totalPages - Total de páginas
 * @param {boolean} props.pagination.hasNext - Si hay página siguiente
 * @param {boolean} props.pagination.hasPrev - Si hay página anterior
 * @param {Function} props.onPageChange - Callback cuando cambia la página
 * @param {boolean} [props.showInfo] - Mostrar info "Mostrando X de Y" (default: true)
 * @param {boolean} [props.showFirstLast] - Mostrar botones de primera/última página (default: false)
 * @param {number} [props.maxVisiblePages] - Máximo de números de página visibles (default: 5)
 * @param {'sm'|'md'|'lg'} [props.size] - Tamaño de los botones (default: 'md')
 * @param {string} [props.className] - Clases adicionales
 */
export function Pagination({
  pagination,
  onPageChange,
  showInfo = true,
  showFirstLast = false,
  maxVisiblePages = 5,
  size = 'md',
  className,
}) {
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

  // Calcular rango de items mostrados
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generar números de página visibles
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, page - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Ajustar si estamos cerca del final
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages = [];

    // Primera página + ellipsis
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    // Páginas intermedias
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Última página + ellipsis
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages, maxVisiblePages]);

  // Clases según tamaño
  const sizeClasses = {
    sm: {
      button: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      page: 'w-7 h-7 text-xs',
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      page: 'w-8 h-8 text-sm',
    },
    lg: {
      button: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      page: 'w-10 h-10 text-base',
    },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // No mostrar si solo hay una página
  if (totalPages <= 1 && !showInfo) return null;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3',
        className
      )}
    >
      {/* Info de paginación */}
      {showInfo && (
        <p className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
          Mostrando{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {startItem}-{endItem}
          </span>{' '}
          de{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {total}
          </span>
        </p>
      )}

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 order-1 sm:order-2">
          {/* Primera página */}
          {showFirstLast && (
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={!hasPrev}
              className={cn(
                sizes.button,
                'rounded-lg transition-colors',
                hasPrev
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              )}
              title="Primera página"
            >
              <ChevronsLeft className={sizes.icon} />
            </button>
          )}

          {/* Anterior */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
            className={cn(
              sizes.button,
              'rounded-lg transition-colors flex items-center gap-1',
              hasPrev
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            )}
          >
            <ChevronLeft className={sizes.icon} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          {/* Números de página */}
          <div className="hidden sm:flex items-center gap-1">
            {visiblePages.map((pageNum, index) =>
              pageNum === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    sizes.page,
                    'rounded-lg font-medium transition-colors flex items-center justify-center',
                    pageNum === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {pageNum}
                </button>
              )
            )}
          </div>

          {/* Indicador móvil */}
          <span className="sm:hidden text-sm text-gray-600 dark:text-gray-400 px-2">
            {page} / {totalPages}
          </span>

          {/* Siguiente */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            className={cn(
              sizes.button,
              'rounded-lg transition-colors flex items-center gap-1',
              hasNext
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            )}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className={sizes.icon} />
          </button>

          {/* Última página */}
          {showFirstLast && (
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNext}
              className={cn(
                sizes.button,
                'rounded-lg transition-colors',
                hasNext
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
              )}
              title="Última página"
            >
              <ChevronsRight className={sizes.icon} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Pagination;
