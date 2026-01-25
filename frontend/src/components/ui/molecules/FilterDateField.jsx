import { memo, useId } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../atoms/Label';

/**
 * Estilos compartidos para inputs de filtros
 */
const FILTER_INPUT_STYLES = cn(
  'w-full px-3 py-2 rounded-lg border transition-colors text-sm',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'border-gray-300 dark:border-gray-600',
  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
);

/**
 * FilterDateField - Campo de fecha unificado para paneles de filtros
 *
 * @param {string} label - Label del campo
 * @param {string} value - Valor de fecha (YYYY-MM-DD)
 * @param {function} onChange - Callback (value) => void
 * @param {string} min - Fecha mínima
 * @param {string} max - Fecha máxima
 * @param {React.ComponentType} icon - Icono opcional
 * @param {string} className - Clases adicionales
 */
const FilterDateField = memo(function FilterDateField({
  label,
  value,
  onChange,
  min,
  max,
  icon: Icon,
  id,
  className,
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label
          htmlFor={inputId}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          {label}
        </Label>
      )}
      <input
        type="date"
        id={inputId}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        min={min}
        max={max}
        className={FILTER_INPUT_STYLES}
      />
    </div>
  );
});

FilterDateField.displayName = 'FilterDateField';

export { FilterDateField };
export default FilterDateField;
