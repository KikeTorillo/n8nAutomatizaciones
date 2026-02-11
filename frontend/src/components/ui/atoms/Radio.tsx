import { forwardRef, memo, useId, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import {
  RADIO_SIZE_CLASSES,
  getRadioStyles,
  getAriaDescribedBy,
} from '@/lib/uiConstants';
import type { FormSize } from '@/types/ui';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Tamaño del radio */
  size?: FormSize;
  /** Si tiene error */
  hasError?: boolean;
  /** Si es requerido */
  required?: boolean;
  /** Si tiene texto de ayuda asociado */
  hasHelper?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Radio - Input radio puro accesible
 *
 * Para grupos de radios usar RadioGroup (molecule)
 */
const Radio = memo(
  forwardRef<HTMLInputElement, RadioProps>(function Radio(
    {
      size = 'md',
      hasError = false,
      required = false,
      hasHelper = false,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <input
        ref={ref}
        type="radio"
        id={radioId}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
        aria-describedby={getAriaDescribedBy(radioId, { hasError, hasHelper })}
        className={cn(
          getRadioStyles(hasError),
          RADIO_SIZE_CLASSES[size] || RADIO_SIZE_CLASSES.md,
          className
        )}
        {...props}
      />
    );
  })
);

Radio.displayName = 'Radio';

export { Radio };
