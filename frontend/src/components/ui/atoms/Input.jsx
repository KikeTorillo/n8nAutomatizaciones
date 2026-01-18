import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Input puro - Compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="Nombre" error={errors.nombre?.message}>
 *   <Input hasError={!!errors.nombre} {...field} />
 * </FormGroup>
 *
 * @param {string} type - Tipo de input (text, email, number, etc.)
 * @param {string} size - Tamaño del input ('sm', 'md', 'lg')
 * @param {boolean} hasError - Si tiene error (para styling del borde)
 * @param {string} prefix - Texto o símbolo antes del input (ej: "$")
 * @param {string} suffix - Texto o símbolo después del input (ej: "%")
 * @param {string} className - Clases adicionales
 */
const SIZE_CLASSES = {
  sm: 'py-2 text-sm',
  md: 'py-3 text-base',
  lg: 'py-4 text-lg font-semibold',
};

const Input = forwardRef(
  (
    {
      type = 'text',
      size = 'md',
      hasError = false,
      prefix,
      suffix,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'w-full border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      SIZE_CLASSES[size]
    );

    const stateStyles = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    const paddingStyles = prefix && suffix
      ? 'px-8'
      : prefix
        ? 'pl-8 pr-4'
        : suffix
          ? 'pl-4 pr-8'
          : 'px-4';

    if (prefix || suffix) {
      return (
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">{prefix}</span>
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(baseStyles, stateStyles, paddingStyles, className)}
            {...props}
          />

          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400">{suffix}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        type={type}
        className={cn(baseStyles, stateStyles, paddingStyles, className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;
