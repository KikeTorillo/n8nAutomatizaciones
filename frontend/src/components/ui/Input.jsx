import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Input reutilizable
 * Compatible con React Hook Form
 */
const Input = forwardRef(
  (
    {
      className,
      type = 'text',
      error,
      label,
      helper,
      required = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

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

        <input
          ref={ref}
          type={type}
          className={cn(baseStyles, stateStyles, className)}
          {...props}
        />

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

Input.displayName = 'Input';

export default Input;
