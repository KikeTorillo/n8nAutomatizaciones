import { memo, useId } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../atoms/Label';
import {
  FILTER_INPUT_STYLES,
  FILTER_LABEL_STYLES,
  FILTER_CONTAINER_STYLES,
  FILTER_ICON_STYLES,
} from '@/lib/uiConstants';

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
    <div className={cn(FILTER_CONTAINER_STYLES, className)}>
      {label && (
        <Label htmlFor={selectId} className={FILTER_LABEL_STYLES}>
          {Icon && <Icon className={FILTER_ICON_STYLES} />}
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
