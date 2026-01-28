import { forwardRef, useId, memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import Checkbox from '../atoms/Checkbox';
import Label from '../atoms/Label';

/**
 * CheckboxField - Checkbox con label, description y error
 * Molecule que combina Checkbox atom con Label y feedback
 *
 * @param {string} label - Texto principal del checkbox
 * @param {string} description - Texto descriptivo secundario
 * @param {boolean} checked - Estado del checkbox
 * @param {function} onChange - Handler de cambio
 * @param {boolean} disabled - Estado deshabilitado
 * @param {string} error - Mensaje de error
 */
const CheckboxField = memo(forwardRef(function CheckboxField(
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
  ) {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="flex items-center h-5 mt-0.5">
          <Checkbox
            ref={ref}
            id={checkboxId}
            disabled={disabled}
            error={!!error}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="flex-1">
            {label && (
              <Label
                label={label}
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              />
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
));

CheckboxField.displayName = 'CheckboxField';

CheckboxField.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  id: PropTypes.string,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
};

export { CheckboxField };
export default CheckboxField;
