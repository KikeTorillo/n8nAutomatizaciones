import { memo, forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BADGE_COLORS } from '@/lib/uiConstants';
import type { FilterChipVariant } from '@/types/ui';

export interface FilterChipProps {
  /** Texto del chip (nombre del filtro) */
  label: string;
  /** Valor actual del filtro (opcional) */
  value?: string;
  /** Callback al hacer click en X */
  onRemove?: () => void;
  /** Variante de color */
  variant?: FilterChipVariant;
  /** Clases adicionales */
  className?: string;
}

/**
 * FilterChip - Chip de filtro activo con botón para remover
 *
 * Ene 2026: Movido de organisms/filters a molecules
 * Componente atómico reutilizable para mostrar filtros activos.
 *
 * @example
 * <FilterChip
 *   label="Categoría"
 *   value="Electrónicos"
 *   onRemove={() => clearFilter('categoria')}
 * />
 */
const FilterChip = memo(
  forwardRef<HTMLSpanElement, FilterChipProps>(function FilterChip({
  label,
  value,
  onRemove,
  variant = 'primary',
  className,
}, ref) {
  const variants = {
    primary: cn(BADGE_COLORS.primary, 'border-primary-200 dark:border-primary-700'),
    gray: cn(BADGE_COLORS.default, 'border-gray-200 dark:border-gray-600'),
  };

  return (
    <span
      ref={ref}
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
}));

FilterChip.displayName = 'FilterChip';

export { FilterChip };
