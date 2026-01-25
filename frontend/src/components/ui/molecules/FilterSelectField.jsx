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
 * FilterSelectField - Campo select unificado para paneles de filtros
 *
 * @param {string} label - Label del campo
 * @param {string} value - Valor seleccionado
 * @param {function} onChange - Callback (value) => void
 * @param {Array} options - Array de { value, label }
 * @param {string} placeholder - Texto de opción vacía
 * @param {React.ComponentType} icon - Icono opcional
 * @param {string} className - Clases adicionales
 */
const FilterSelectField = memo(function FilterSelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  icon: Icon,
  id,
  className,
}) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <Label
          htmlFor={selectId}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {Icon && <Icon className="h-4 w-4 text-gray-400" />}
          {label}
        </Label>
      )}
      <select
        id={selectId}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        className={FILTER_INPUT_STYLES}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

FilterSelectField.displayName = 'FilterSelectField';

export { FilterSelectField };
export default FilterSelectField;
