import { memo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FilterChip - Chip de filtro activo con botón para remover
 *
 * Ene 2026: Movido de organisms/filters a molecules
 * Componente atómico reutilizable para mostrar filtros activos.
 *
 * @param {string} label - Texto del chip (nombre del filtro)
 * @param {string} value - Valor actual del filtro (opcional)
 * @param {Function} onRemove - Callback al hacer click en X
 * @param {string} variant - Variante de color: 'primary' | 'gray'
 * @param {string} className - Clases adicionales
 *
 * @example
 * <FilterChip
 *   label="Categoría"
 *   value="Electrónicos"
 *   onRemove={() => clearFilter('categoria')}
 * />
 */
function FilterChip({
  label,
  value,
  onRemove,
  variant = 'primary',
  className,
}) {
  const variants = {
    primary: cn(
      'bg-primary-100 text-primary-800 border-primary-200',
      'dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-700'
    ),
    gray: cn(
      'bg-gray-100 text-gray-700 border-gray-200',
      'dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
    ),
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-full border',
        'transition-colors',
        variants[variant],
        className
      )}
    >
      <span className="truncate max-w-[150px]">
        {label}
        {value && (
          <>
            <span className="text-gray-400 dark:text-gray-500 mx-1">:</span>
            <span className="font-normal">{value}</span>
          </>
        )}
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'flex-shrink-0 p-0.5 rounded-full transition-colors',
            'hover:bg-primary-200 dark:hover:bg-primary-800',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
          )}
          aria-label={`Quitar filtro ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}

FilterChip.displayName = 'FilterChip';

export default memo(FilterChip);
