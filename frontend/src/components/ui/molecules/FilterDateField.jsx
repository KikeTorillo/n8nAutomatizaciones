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
    <div className={cn(FILTER_CONTAINER_STYLES, className)}>
      {label && (
        <Label htmlFor={inputId} className={FILTER_LABEL_STYLES}>
          {Icon && <Icon className={FILTER_ICON_STYLES} />}
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
