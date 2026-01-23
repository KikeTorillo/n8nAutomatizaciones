import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Textarea puro - Compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="Descripción" error={errors.descripcion?.message}>
 *   <Textarea hasError={!!errors.descripcion} rows={4} {...field} />
 * </FormGroup>
 *
 * @param {number} rows - Número de filas visibles
 * @param {boolean} hasError - Si tiene error (para styling del borde)
 * @param {string} className - Clases adicionales
 */
const Textarea = memo(forwardRef(function Textarea(
    {
      rows = 3,
      hasError = false,
      className,
      ...props
    },
    ref
  ) {
    const baseStyles = cn(
      'w-full px-4 py-3 border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'resize-none',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500'
    );

    const stateStyles = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(baseStyles, stateStyles, className)}
        {...props}
      />
    );
  }
));

Textarea.displayName = 'Textarea';

export default Textarea;
