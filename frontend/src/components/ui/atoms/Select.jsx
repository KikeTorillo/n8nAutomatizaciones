import { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { getSelectStyles, SELECT_ARROW, getAriaDescribedBy } from '@/lib/uiConstants';

/**
 * Select - Componente select puro accesible compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="País" error={errors.pais?.message}>
 *   <Select hasError={!!errors.pais} options={paises} {...field} />
 * </FormGroup>
 *
 * @component
 * @example
 * <Select
 *   options={[{ value: '1', label: 'Opción 1' }]}
 *   hasError={!!errors.campo}
 *   {...register('campo')}
 * />
 *
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} [props.options=[]] - Opciones del select
 * @param {string} [props.placeholder='Selecciona una opción'] - Texto de placeholder
 * @param {boolean} [props.hasError=false] - Si tiene error (borde rojo)
 * @param {boolean} [props.required=false] - Si es campo requerido
 * @param {boolean} [props.hasHelper=false] - Si tiene texto de ayuda asociado
 * @param {React.ReactNode} [props.children] - Opciones como children (alternativa a options)
 * @param {string} [props.id] - ID del elemento
 * @param {string} [props.className] - Clases adicionales
 * @param {React.Ref} ref - Forward ref
 * @returns {React.ReactElement}
 */
const Select = memo(forwardRef(function Select(
    {
      options = [],
      placeholder = 'Selecciona una opción',
      hasError = false,
      required = false,
      hasHelper = false,
      children,
      className,
      id,
      ...props
    },
    ref
  ) {
    return (
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={hasError || undefined}
          aria-required={required || undefined}
          aria-describedby={id ? getAriaDescribedBy(id, { hasError, hasHelper }) : undefined}
          className={cn(getSelectStyles(hasError), className)}
          {...props}
        >
          {children ? (
            children
          ) : (
            <>
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>

        {/* Flecha personalizada */}
        <div className={SELECT_ARROW.container} aria-hidden="true">
          <svg className={SELECT_ARROW.icon} viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    );
  }
));

Select.displayName = 'Select';

Select.propTypes = {
  /** Array de opciones {value, label} */
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })),
  /** Texto de placeholder */
  placeholder: PropTypes.string,
  /** Si el select tiene error (borde rojo) */
  hasError: PropTypes.bool,
  /** Si el campo es requerido */
  required: PropTypes.bool,
  /** Si tiene texto de ayuda asociado */
  hasHelper: PropTypes.bool,
  /** Opciones como children (alternativa a options) */
  children: PropTypes.node,
  /** ID del elemento */
  id: PropTypes.string,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Handler de cambio */
  onChange: PropTypes.func,
  /** Valor actual */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export { Select };
