import { forwardRef, memo, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import {
  getCheckboxStyles,
  CHECKBOX_SIZE_CLASSES,
  getAriaDescribedBy,
} from '../constants';
import type { FormSize } from '../types';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Estado del checkbox */
  checked?: boolean;
  /** Tamaño del checkbox */
  size?: FormSize;
  /** Estado deshabilitado */
  disabled?: boolean;
  /** Si el checkbox tiene error (borde rojo) */
  hasError?: boolean;
  /** Si tiene texto de ayuda asociado */
  hasHelper?: boolean;
  /** ID del elemento (para aria-describedby) */
  id?: string;
  /** Label para screen readers (requerido si no hay label visible) */
  'aria-label'?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Checkbox - Input checkbox puro accesible
 *
 * Para checkbox con label/description usar CheckboxField (molecule)
 *
 * @example
 * <Checkbox checked={value} onChange={handleChange} aria-label="Aceptar términos" />
 */
const Checkbox = memo(
  forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
    {
      className,
      size = 'md',
      disabled = false,
      hasError = false,
      hasHelper = false,
      id,
      checked,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        disabled={disabled}
        checked={checked}
        aria-invalid={hasError || undefined}
        aria-describedby={getAriaDescribedBy(checkboxId, {
          hasError,
          hasHelper,
        })}
        className={cn(
          getCheckboxStyles({ disabled, error: hasError }),
          CHECKBOX_SIZE_CLASSES[size],
          className
        )}
        {...props}
      />
    );
  })
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
