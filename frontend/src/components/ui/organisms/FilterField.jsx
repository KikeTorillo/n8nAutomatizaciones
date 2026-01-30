import { memo, useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Label } from '../atoms/Label';
import { Checkbox } from '../atoms/Checkbox';
import {
  FILTER_INPUT_STYLES,
  FILTER_LABEL_STYLES,
  FILTER_CONTAINER_STYLES,
  FILTER_ICON_STYLES,
} from '@/lib/uiConstants';

/**
 * FilterField - Campo de filtro unificado que combina FilterTextField, FilterSelectField y FilterDateField
 *
 * Componente versátil que renderiza diferentes tipos de campos según la prop `type`:
 * - text: Input de texto
 * - select: Dropdown con opciones
 * - date: Date picker
 * - number: Input numérico
 * - checkbox: Checkbox simple
 *
 * @param {string} type - Tipo de campo: 'text' | 'select' | 'date' | 'number' | 'checkbox'
 * @param {string} label - Label del campo
 * @param {string|boolean} value - Valor actual
 * @param {function} onChange - Callback (value) => void
 * @param {Array} options - Opciones para select [{value, label}]
 * @param {string} placeholder - Placeholder del input/select
 * @param {React.ComponentType} icon - Icono opcional (componente Lucide)
 * @param {string} min - Fecha/número mínimo
 * @param {string} max - Fecha/número máximo
 * @param {number} step - Incremento para inputs numéricos
 * @param {string} className - Clases adicionales
 *
 * @example
 * // Campo de texto
 * <FilterField type="text" label="Buscar" value={query} onChange={setQuery} />
 *
 * @example
 * // Campo select
 * <FilterField
 *   type="select"
 *   label="Estado"
 *   value={estado}
 *   onChange={setEstado}
 *   options={[{ value: 'activo', label: 'Activo' }]}
 * />
 *
 * @example
 * // Campo de fecha
 * <FilterField type="date" label="Desde" value={fechaDesde} onChange={setFechaDesde} />
 *
 * @example
 * // Checkbox
 * <FilterField type="checkbox" label="Solo activos" value={soloActivos} onChange={setSoloActivos} />
 */
const FilterField = memo(function FilterField({
  type = 'text',
  label,
  value,
  onChange,
  options = [],
  placeholder,
  icon: Icon,
  min,
  max,
  step,
  id,
  className,
  disabled = false,
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  // Renderizar checkbox (caso especial)
  if (type === 'checkbox') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Checkbox
          id={fieldId}
          checked={!!value}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        {label && (
          <Label
            htmlFor={fieldId}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            {Icon && <Icon className={cn(FILTER_ICON_STYLES, 'inline mr-1.5')} />}
            {label}
          </Label>
        )}
      </div>
    );
  }

  // Props comunes para inputs
  const inputProps = {
    id: fieldId,
    value: value || '',
    onChange: (e) => onChange?.(e.target.value),
    disabled,
    className: FILTER_INPUT_STYLES,
  };

  return (
    <div className={cn(FILTER_CONTAINER_STYLES, className)}>
      {label && (
        <Label htmlFor={fieldId} className={FILTER_LABEL_STYLES}>
          {Icon && <Icon className={FILTER_ICON_STYLES} />}
          {label}
        </Label>
      )}

      {type === 'select' ? (
        <select {...inputProps}>
          <option value="">{placeholder || 'Seleccionar...'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...inputProps}
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
      )}
    </div>
  );
});

FilterField.displayName = 'FilterField';

FilterField.propTypes = {
  /** Tipo de campo */
  type: PropTypes.oneOf(['text', 'select', 'date', 'number', 'checkbox']),
  /** Label del campo */
  label: PropTypes.string,
  /** Valor actual */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number]),
  /** Callback cuando cambia el valor */
  onChange: PropTypes.func,
  /** Opciones para select */
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })),
  /** Placeholder del input */
  placeholder: PropTypes.string,
  /** Icono (componente Lucide) */
  icon: PropTypes.elementType,
  /** Valor mínimo (date/number) */
  min: PropTypes.string,
  /** Valor máximo (date/number) */
  max: PropTypes.string,
  /** Incremento (number) */
  step: PropTypes.number,
  /** ID del campo */
  id: PropTypes.string,
  /** Clases adicionales */
  className: PropTypes.string,
  /** Si está deshabilitado */
  disabled: PropTypes.bool,
};

export { FilterField };
