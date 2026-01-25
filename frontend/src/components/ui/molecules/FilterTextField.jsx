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
 * FilterTextField - Campo de texto unificado para paneles de filtros
 *
 * @param {string} label - Label del campo
 * @param {string} value - Valor actual
 * @param {function} onChange - Callback (value) => void
 * @param {string} placeholder - Placeholder del input
 * @param {React.ComponentType} icon - Icono opcional
 * @param {string} className - Clases adicionales
 */
const FilterTextField = memo(function FilterTextField({
  label,
  value,
  onChange,
  placeholder,
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
        type="text"
        id={inputId}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={FILTER_INPUT_STYLES}
      />
    </div>
  );
});

FilterTextField.displayName = 'FilterTextField';

export { FilterTextField };
export default FilterTextField;
