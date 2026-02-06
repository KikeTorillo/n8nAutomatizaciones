import { forwardRef, memo, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { RADIO_SIZE_CLASSES } from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Tamaño del radio */
  size?: UISize;
  /** Si tiene error */
  hasError?: boolean;
  /** Label visible junto al radio */
  label?: string;
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
      label,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) {
    const radioElement = (
      <input
        ref={ref}
        type="radio"
        id={id}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        className={cn(
          'border-gray-300 dark:border-gray-600',
          'text-primary-600 focus:ring-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError && 'border-red-500 dark:border-red-500',
          RADIO_SIZE_CLASSES[size as keyof typeof RADIO_SIZE_CLASSES] || RADIO_SIZE_CLASSES.md,
          className
        )}
        {...props}
      />
    );

    if (!label) return radioElement;

    return (
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {radioElement}
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </label>
    );
  })
);

Radio.displayName = 'Radio';

export { Radio };
