import { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { getCheckboxStyles, CHECKBOX_SIZE_CLASSES, getAriaDescribedBy } from '@/lib/uiConstants';

/**
 * Checkbox - Input checkbox puro accesible
 *
 * Para checkbox con label/description usar CheckboxField (molecule)
 *
 * @component
 * @example
 * <Checkbox checked={value} onChange={handleChange} aria-label="Aceptar términos" />
 *
 * @param {Object} props
 * @param {boolean} [props.checked] - Estado del checkbox
 * @param {function} [props.onChange] - Handler de cambio
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamaño del checkbox
 * @param {boolean} [props.disabled=false] - Estado deshabilitado
 * @param {boolean} [props.error=false] - Estado de error (borde rojo)
 * @param {string} [props.id] - ID del elemento (para aria-describedby)
 * @param {boolean} [props.hasError=false] - Alias de error para consistencia
 * @param {boolean} [props.hasHelper=false] - Si existe texto de ayuda asociado
 * @param {string} [props['aria-label']] - Label para screen readers (requerido si no hay label visible)
 * @param {string} [props.className] - Clases adicionales
 * @param {React.Ref} ref - Forward ref
 * @returns {React.ReactElement}
 */
const Checkbox = memo(forwardRef(function Checkbox(
    {
      className,
      size = 'md',
      disabled = false,
      error = false,
      hasError,
      hasHelper = false,
      id,
      checked,
      ...props
    },
    ref
  ) {
    // Warning de deprecación para prop error (usar hasError en su lugar)
    if (process.env.NODE_ENV === 'development' && error !== false && hasError === undefined) {
      console.warn('[Checkbox] La prop "error" está deprecada. Usar "hasError" en su lugar.');
    }

    // hasError toma precedencia sobre error para consistencia con otros inputs
    const isError = hasError ?? error;

    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        disabled={disabled}
        checked={checked}
        aria-checked={checked}
        aria-invalid={isError || undefined}
        aria-describedby={id ? getAriaDescribedBy(id, { hasError: isError, hasHelper }) : undefined}
        className={cn(
          getCheckboxStyles({ disabled, error: isError }),
          CHECKBOX_SIZE_CLASSES[size],
          className
        )}
        {...props}
      />
    );
  }
));

Checkbox.displayName = 'Checkbox';

Checkbox.propTypes = {
  /** Estado del checkbox */
  checked: PropTypes.bool,
  /** Handler de cambio */
  onChange: PropTypes.func,
  /** Tamaño del checkbox */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Estado deshabilitado */
  disabled: PropTypes.bool,
  /** @deprecated Usar hasError en su lugar */
  error: PropTypes.bool,
  /** Si el checkbox tiene error (borde rojo) */
  hasError: PropTypes.bool,
  /** Si tiene texto de ayuda asociado */
  hasHelper: PropTypes.bool,
  /** ID del elemento */
  id: PropTypes.string,
  /** Label para accesibilidad (requerido si no hay label visible) */
  'aria-label': PropTypes.string,
  /** Clases CSS adicionales */
  className: PropTypes.string,
};

export { Checkbox };
