import { memo, forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LABEL_BASE, LABEL_REQUIRED, ARIA_LABELS } from '@/lib/uiConstants';

export interface LabelProps {
  /** Texto o nodo React para la etiqueta */
  label?: ReactNode;
  /** Si el campo es obligatorio (muestra asterisco) */
  required?: boolean;
  /** ID del elemento asociado */
  htmlFor?: string;
  /** Clases adicionales */
  className?: string;
}

/**
 * Label - Componente label reutilizable y accesible
 *
 * @example
 * <Label label="Email" required htmlFor="email-input" />
 */
const Label = memo(forwardRef<HTMLLabelElement, LabelProps>(function Label({
  label,
  required = false,
  htmlFor,
  className,
}, ref) {
  if (!label) return null;

  return (
    <label ref={ref} htmlFor={htmlFor} className={cn(LABEL_BASE, className)}>
      {label}
      {required && (
        <>
          <span className={LABEL_REQUIRED.asterisk} aria-hidden="true">
            *
          </span>
          <span className={LABEL_REQUIRED.srOnly}>{ARIA_LABELS.required}</span>
        </>
      )}
    </label>
  );
}));

Label.displayName = 'Label';

export { Label };
