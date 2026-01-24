import { forwardRef, memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Checkbox Atom - Input checkbox puro
 * Para checkbox con label/description usar CheckboxField (molecule)
 *
 * @param {boolean} checked - Estado del checkbox
 * @param {function} onChange - Handler de cambio
 * @param {boolean} disabled - Estado deshabilitado
 * @param {boolean} error - Indica estado de error (borde rojo)
 */
const Checkbox = memo(forwardRef(function Checkbox(
    {
      className,
      disabled = false,
      error = false,
      ...props
    },
    ref
  ) {
    return (
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        className={cn(
          'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
          'accent-primary-600 dark:accent-primary-500',
          'focus:ring-primary-500 dark:focus:ring-primary-400',
          'transition-colors dark:bg-gray-700',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
    );
  }
));

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
