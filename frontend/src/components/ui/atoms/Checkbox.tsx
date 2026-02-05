import { forwardRef, memo, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getCheckboxStyles, CHECKBOX_SIZE_CLASSES, getAriaDescribedBy } from '@/lib/uiConstants';
import type { Size } from '@/types/ui';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Estado del checkbox */
  checked?: boolean;
  /** Tamaño del checkbox */
  size?: Size;
  /** Estado deshabilitado */
  disabled?: boolean;
  /**
   * Estado de error (borde rojo)
   * @deprecated Usar hasError en su lugar
   */
  error?: boolean;
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
      error = false,
      hasError,
      hasHelper = false,
      id,
      checked,
      ...props
    },
    ref
  ) {
    // Warning de deprecación para prop error (usar hasError en su lugar)
    if (import.meta.env?.DEV && error !== false && hasError === undefined) {
      console.warn('[Checkbox] La prop "error" está deprecada. Usar "hasError" en su lugar.');
    }

    // hasError toma precedencia sobre error para consistencia con otros inputs
    const isError = hasError ?? error;

    return (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        disabled={disabled}
        checked={checked}
        aria-checked={checked}
        aria-invalid={isError || undefined}
        aria-describedby={id ? getAriaDescribedBy(id, { hasError: isError, hasHelper }) : undefined}
        className={cn(
          getCheckboxStyles({ disabled, error: isError }),
          (CHECKBOX_SIZE_CLASSES as Record<string, string>)[size],
          className
        )}
        {...props}
      />
    );
  })
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
