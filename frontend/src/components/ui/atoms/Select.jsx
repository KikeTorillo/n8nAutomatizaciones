import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Select puro - Compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="País" error={errors.pais?.message}>
 *   <Select hasError={!!errors.pais} options={paises} {...field} />
 * </FormGroup>
 *
 * @param {Array} options - Array de {value, label} para las opciones
 * @param {string} placeholder - Texto de placeholder
 * @param {boolean} hasError - Si tiene error (para styling del borde)
 * @param {React.ReactNode} children - Opciones como children (alternativa a options)
 * @param {string} className - Clases adicionales
 */
const Select = forwardRef(
  (
    {
      options = [],
      placeholder = 'Selecciona una opción',
      hasError = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'w-full px-4 h-10 border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'appearance-none',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100'
    );

    const stateStyles = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(baseStyles, stateStyles, className)}
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
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700 dark:text-gray-300">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
);

Select.displayName = 'Select';

export default Select;
