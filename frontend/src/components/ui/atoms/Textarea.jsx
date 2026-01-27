import { forwardRef, memo, useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { getTextareaStyles, getAriaDescribedBy } from '@/lib/uiConstants';

/**
 * Textarea - Componente textarea puro accesible compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="Descripción" error={errors.descripcion?.message}>
 *   <Textarea hasError={!!errors.descripcion} rows={4} {...field} />
 * </FormGroup>
 *
 * @component
 * @example
 * <Textarea
 *   rows={4}
 *   hasError={!!errors.descripcion}
 *   placeholder="Escribe una descripción..."
 *   {...register('descripcion')}
 * />
 *
 * @param {Object} props
 * @param {number} [props.rows=3] - Número de filas visibles
 * @param {boolean} [props.hasError=false] - Si tiene error (borde rojo)
 * @param {boolean} [props.required=false] - Si es campo requerido
 * @param {boolean} [props.hasHelper=false] - Si tiene texto de ayuda asociado
 * @param {string} [props.id] - ID del elemento
 * @param {string} [props.className] - Clases adicionales
 * @param {React.Ref} ref - Forward ref
 * @returns {React.ReactElement}
 */
const Textarea = memo(forwardRef(function Textarea(
    {
      rows = 3,
      hasError = false,
      required = false,
      hasHelper = false,
      className,
      id,
      label,
      ...props
    },
    ref
  ) {
    // Generar ID único con useId (estable en SSR/hydration)
    const generatedId = useId();
    const textareaId = id || generatedId;

    const textareaElement = (
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
        aria-describedby={textareaId ? getAriaDescribedBy(textareaId, { hasError, hasHelper }) : undefined}
        className={cn(getTextareaStyles(hasError), className)}
        {...props}
      />
    );

    // Si hay label, envolver con label
    if (label) {
      return (
        <div className="space-y-1">
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
          {textareaElement}
        </div>
      );
    }

    return textareaElement;
  }
));

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  /** Número de filas visibles */
  rows: PropTypes.number,
  /** Si el textarea tiene error (borde rojo) */
  hasError: PropTypes.bool,
  /** Si el campo es requerido */
  required: PropTypes.bool,
  /** Si tiene texto de ayuda asociado */
  hasHelper: PropTypes.bool,
  /** ID del elemento */
  id: PropTypes.string,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Placeholder del textarea */
  placeholder: PropTypes.string,
  /** Handler de cambio */
  onChange: PropTypes.func,
  /** Valor actual */
  value: PropTypes.string,
  /** Label del campo (texto o ReactNode para botones de IA) */
  label: PropTypes.node,
};

export { Textarea };
export default Textarea;
