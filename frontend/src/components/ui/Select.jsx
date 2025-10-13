import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Select reutilizable
 * Compatible con React Hook Form
 */
const Select = forwardRef(
  (
    {
      className,
      options = [],
      error,
      label,
      helper,
      placeholder = 'Selecciona una opción',
      required = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white';

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

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
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500">{helper}</p>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
