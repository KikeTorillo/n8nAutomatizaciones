import { forwardRef, useId, memo } from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from '../atoms/Checkbox';
import { Label } from '../atoms/Label';

export interface CheckboxFieldProps {
  /** Clases adicionales */
  className?: string;
  /** Texto principal del checkbox */
  label?: string;
  /** Texto descriptivo secundario */
  description?: string;
  /** Estado deshabilitado */
  disabled?: boolean;
  /** Mensaje de error */
  error?: string;
  /** ID del checkbox */
  id?: string;
  /** Estado del checkbox */
  checked?: boolean;
  /** Handler de cambio */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Nombre del campo */
  name?: string;
  /** Valor del campo */
  value?: string | number;
  /** Estado checked por defecto */
  defaultChecked?: boolean;
}

/**
 * CheckboxField - Checkbox con label, description y error
 * Molecule que combina Checkbox atom con Label y feedback
 */
const CheckboxField = memo(forwardRef<HTMLInputElement, CheckboxFieldProps>(function CheckboxField(
  {
    className,
    label,
    description,
    disabled = false,
    error,
    id,
    checked,
    onChange,
    name,
    value,
    defaultChecked,
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
          hasError={!!error}
          checked={checked}
          onChange={onChange}
          name={name}
          value={value}
          defaultChecked={defaultChecked}
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
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}));

CheckboxField.displayName = 'CheckboxField';

export { CheckboxField };
