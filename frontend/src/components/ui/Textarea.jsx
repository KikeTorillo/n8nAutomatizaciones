import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Textarea reutilizable
 * Compatible con React Hook Form
 */
const Textarea = forwardRef(
  (
    {
      className,
      error,
      label,
      helper,
      required = false,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed resize-none';

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

        <textarea
          ref={ref}
          rows={rows}
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

Textarea.displayName = 'Textarea';

export default Textarea;
