import { forwardRef, memo, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getTextareaStyles, getAriaDescribedBy } from '@/lib/uiConstants';
import type { ResizeMode } from '@/types/ui';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'> {
  /** Número de filas visibles */
  rows?: number;
  /** Si tiene error (borde rojo) */
  hasError?: boolean;
  /** Si es campo requerido */
  required?: boolean;
  /** Si tiene texto de ayuda asociado */
  hasHelper?: boolean;
  /** Modo de redimensionamiento del textarea */
  resizable?: ResizeMode;
  /** ID del elemento */
  id?: string;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Textarea - Componente textarea puro accesible compatible con React Hook Form
 *
 * DEBE usarse con FormGroup para label/error/helper:
 * <FormGroup label="Descripción" error={errors.descripcion?.message}>
 *   <Textarea hasError={!!errors.descripcion} rows={4} {...field} />
 * </FormGroup>
 *
 * @example
 * <Textarea
 *   rows={4}
 *   hasError={!!errors.descripcion}
 *   placeholder="Escribe una descripción..."
 *   {...register('descripcion')}
 * />
 *
 * @example
 * // Con resize habilitado
 * <Textarea rows={4} resizable="vertical" {...register('notas')} />
 */
const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
    {
      rows = 3,
      hasError = false,
      required = false,
      hasHelper = false,
      resizable = 'none',
      className,
      id,
      ...props
    },
    ref
  ) {
    // Generar ID único con useId (estable en SSR/hydration)
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-required={required || undefined}
        aria-describedby={
          textareaId ? getAriaDescribedBy(textareaId, { hasError, hasHelper }) : undefined
        }
        className={cn(getTextareaStyles(hasError, resizable), className)}
        {...props}
      />
    );
  })
);

Textarea.displayName = 'Textarea';

export { Textarea };
