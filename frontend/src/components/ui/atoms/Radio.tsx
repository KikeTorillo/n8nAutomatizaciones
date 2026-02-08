import { forwardRef, memo, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { RADIO_SIZE_CLASSES, getRadioStyles, getAriaDescribedBy } from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Tamaño del radio */
  size?: UISize;
  /** Si tiene error */
  hasError?: boolean;
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
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <input
        ref={ref}
        type="radio"
        id={id}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={id ? getAriaDescribedBy(id, { hasError }) : undefined}
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
