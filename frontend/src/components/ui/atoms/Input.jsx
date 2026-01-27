import { forwardRef, memo, useId } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { INPUT_SIZE_CLASSES, INPUT_AFFIX, getInputPaddingStyles, getAriaDescribedBy } from '@/lib/uiConstants';

/**
 * Input - Componente input puro accesible compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="Nombre" error={errors.nombre?.message}>
 *   <Input hasError={!!errors.nombre} {...field} />
 * </FormGroup>
 *
 * @component
 * @example
 * <Input type="email" hasError={!!errors.email} {...register('email')} />
 * <Input prefix="$" suffix="MXN" type="number" {...register('precio')} />
 *
 * @param {Object} props
 * @param {string} [props.type='text'] - Tipo de input (text, email, number, etc.)
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Tamaño del input
 * @param {boolean} [props.hasError=false] - Si tiene error (borde rojo)
 * @param {boolean} [props.required=false] - Si es campo requerido
 * @param {boolean} [props.hasHelper=false] - Si tiene texto de ayuda asociado
 * @param {string|React.ReactNode} [props.prefix] - Texto o símbolo antes del input (ej: "$")
 * @param {string|React.ReactNode} [props.suffix] - Texto o símbolo después del input (ej: "%")
 * @param {string} [props.id] - ID del elemento
 * @param {string} [props.className] - Clases adicionales
 * @param {React.Ref} ref - Forward ref
 * @returns {React.ReactElement}
 */
const Input = memo(forwardRef(function Input(
    {
      type = 'text',
      size = 'md',
      hasError = false,
      required = false,
      hasHelper = false,
      prefix,
      suffix,
      className,
      id,
      label,
      ...props
    },
    ref
  ) {
    // Generar ID único con useId (estable en SSR/hydration)
    const generatedId = useId();
    const inputId = id || generatedId;

    const baseStyles = cn(
      'w-full border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      INPUT_SIZE_CLASSES[size]
    );

    const stateStyles = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    const paddingStyles = getInputPaddingStyles(!!prefix, !!suffix);

    const ariaProps = {
      'aria-invalid': hasError || undefined,
      'aria-required': required || undefined,
      'aria-describedby': id ? getAriaDescribedBy(id, { hasError, hasHelper }) : undefined,
    };

    // Componente input base
    const inputElement = (prefix || suffix) ? (
      <div className="relative">
        {prefix && (
          <div
            className={cn(INPUT_AFFIX.container, INPUT_AFFIX.left)}
            aria-hidden="true"
          >
            <span className={INPUT_AFFIX.text}>{prefix}</span>
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(baseStyles, stateStyles, paddingStyles, className)}
          {...ariaProps}
          {...props}
        />

        {suffix && (
          <div
            className={cn(INPUT_AFFIX.container, INPUT_AFFIX.right)}
            aria-hidden="true"
          >
            <span className={INPUT_AFFIX.text}>{suffix}</span>
          </div>
        )}
      </div>
    ) : (
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(baseStyles, stateStyles, paddingStyles, className)}
        {...ariaProps}
        {...props}
      />
    );

    // Si hay label, envolver con label
    if (label) {
      return (
        <div className="space-y-1">
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
          {inputElement}
        </div>
      );
    }

    return inputElement;
  }
));

Input.displayName = 'Input';

Input.propTypes = {
  /** Tipo de input HTML */
  type: PropTypes.string,
  /** Tamaño del input */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Si el input tiene error (borde rojo) */
  hasError: PropTypes.bool,
  /** Si el campo es requerido */
  required: PropTypes.bool,
  /** Si tiene texto de ayuda asociado */
  hasHelper: PropTypes.bool,
  /** Texto o elemento antes del input */
  prefix: PropTypes.node,
  /** Texto o elemento después del input */
  suffix: PropTypes.node,
  /** ID del elemento */
  id: PropTypes.string,
  /** Clases CSS adicionales */
  className: PropTypes.string,
  /** Placeholder del input */
  placeholder: PropTypes.string,
  /** Handler de cambio */
  onChange: PropTypes.func,
  /** Label del campo (texto o ReactNode para botones de IA) */
  label: PropTypes.node,
};

export { Input };
