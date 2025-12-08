import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Componente Input reutilizable
 * Compatible con React Hook Form
 * @param {string} prefix - Texto o símbolo antes del input (ej: "$")
 * @param {string} suffix - Texto o símbolo después del input (ej: "%")
 * @param {string} inputSize - Tamaño del input ('sm', 'md', 'lg')
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
      prefix,
      suffix,
      inputSize = 'md',
      ...props
    },
    ref
  ) => {
    const sizeStyles = {
      sm: 'py-2 text-sm',
      md: 'py-3 text-base',
      lg: 'py-4 text-lg font-semibold',
    };

    const baseStyles = `w-full border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[inputSize]}`;

    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

    const paddingStyles = prefix && suffix
      ? 'px-8'
      : prefix
        ? 'pl-8 pr-4'
        : suffix
          ? 'pl-4 pr-8'
          : 'px-4';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">{prefix}</span>
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
              <span className="text-gray-500">{suffix}</span>
            </div>
          )}
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

Input.displayName = 'Input';

export default Input;
