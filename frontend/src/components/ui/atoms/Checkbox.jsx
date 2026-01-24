import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';
import { getCheckboxStyles, getAriaDescribedBy } from '@/lib/uiConstants';

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
          className
        )}
        {...props}
      />
    );
  }
));

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
