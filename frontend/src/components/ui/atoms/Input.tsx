import { forwardRef, memo, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  INPUT_SIZE_CLASSES,
  INPUT_AFFIX,
  getInputPaddingStyles,
  getAriaDescribedBy,
} from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Tipo de input HTML */
  type?: string;
  /** Tamaño del input */
  size?: UISize;
  /** Si tiene error (borde rojo) */
  hasError?: boolean;
  /** Si es campo requerido */
  required?: boolean;
  /** Si tiene texto de ayuda asociado */
  hasHelper?: boolean;
  /** Texto o símbolo antes del input (ej: "$") */
  prefix?: ReactNode;
  /** Texto o símbolo después del input (ej: "%") */
  suffix?: ReactNode;
  /** ID del elemento */
  id?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Input - Componente input puro accesible compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="Nombre" error={errors.nombre?.message}>
 *   <Input hasError={!!errors.nombre} {...field} />
 * </FormGroup>
 *
 * @example
 * <Input type="email" hasError={!!errors.email} {...register('email')} />
 * <Input prefix="$" suffix="MXN" type="number" {...register('precio')} />
 */
const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(function Input(
    {
      type = 'text',
      size = 'md',
      hasError = false,
      required = false,
      hasHelper = false,
      prefix,
      suffix,
      className,
      id,
      ...props
    },
    ref
  ) {
    // Generar ID único con useId (estable en SSR/hydration)
    const generatedId = useId();
    const inputId = id || generatedId;

    const baseStyles = cn(
      'w-full border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'bg-white dark:bg-gray-800',
      'text-gray-900 dark:text-gray-100',
      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
      (INPUT_SIZE_CLASSES as Record<string, string>)[size]
    );

    const stateStyles = hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500';

    const paddingStyles = getInputPaddingStyles(!!prefix, !!suffix);

    const ariaProps = {
      'aria-invalid': hasError || undefined,
      'aria-required': required || undefined,
      'aria-describedby': id ? getAriaDescribedBy(id, { hasError, hasHelper }) : undefined,
    };

    // Componente input con soporte para prefix/suffix
    if (prefix || suffix) {
      return (
        <div className="relative">
          {prefix && (
            <div className={cn(INPUT_AFFIX.container, INPUT_AFFIX.left)} aria-hidden="true">
              <span className={INPUT_AFFIX.text}>{prefix}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(baseStyles, stateStyles, paddingStyles, className)}
            {...ariaProps}
            {...props}
          />

          {suffix && (
            <div className={cn(INPUT_AFFIX.container, INPUT_AFFIX.right)} aria-hidden="true">
              <span className={INPUT_AFFIX.text}>{suffix}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(baseStyles, stateStyles, paddingStyles, className)}
        {...ariaProps}
        {...props}
      />
    );
  })
);

Input.displayName = 'Input';

export { Input };
