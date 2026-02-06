import { forwardRef, memo, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getCheckboxStyles, CHECKBOX_SIZE_CLASSES, getAriaDescribedBy } from '@/lib/uiConstants';
import type { UISize } from '@/types/ui';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Estado del checkbox */
  checked?: boolean;
  /** Tamaño del checkbox */
  size?: UISize;
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
    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        disabled={disabled}
        checked={checked}
        aria-invalid={hasError || undefined}
        aria-describedby={id ? getAriaDescribedBy(id, { hasError, hasHelper }) : undefined}
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
