import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

/**
 * Componente Checkbox reutilizable
 * Compatible con React Hook Form
 *
 * @param {string} label - Texto principal del checkbox
 * @param {string} description - Texto descriptivo secundario
 * @param {boolean} checked - Estado del checkbox
 * @param {function} onChange - Handler de cambio
 * @param {boolean} disabled - Estado deshabilitado
 */
const Checkbox = forwardRef(
  (
    {
      className,
      label,
      description,
      disabled = false,
      error,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="flex items-center h-5 mt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            className={cn(
              'h-4 w-4 rounded border-gray-300 dark:border-gray-600 accent-primary-600 dark:accent-primary-500 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors dark:bg-gray-700',
              disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-red-500'
            )}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn(
                'text-xs text-gray-500 dark:text-gray-400 mt-0.5',
                disabled && 'opacity-50'
              )}>
                {description}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
