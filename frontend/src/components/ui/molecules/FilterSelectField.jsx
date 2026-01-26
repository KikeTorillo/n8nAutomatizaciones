import { memo, useId } from 'react';
import PropTypes from 'prop-types';
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

FilterSelectField.propTypes = {
  /** Label del campo */
  label: PropTypes.string,
  /** Valor seleccionado */
  value: PropTypes.string,
  /** Callback (value) => void */
  onChange: PropTypes.func,
  /** Array de { value, label } */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  /** Texto de opción vacía */
  placeholder: PropTypes.string,
  /** Icono opcional */
  icon: PropTypes.elementType,
  /** ID del select */
  id: PropTypes.string,
  /** Clases adicionales */
  className: PropTypes.string,
};

export { FilterSelectField };
export default FilterSelectField;
