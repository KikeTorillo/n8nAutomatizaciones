/**
 * FormGroup - Molecule para agrupar campos de formulario
 * Fase 2 del Plan de Mejoras Frontend - Enero 2026
 *
 * Combina Label + children + helper/error text
 * Compatible con los atoms existentes (Input, Select, Textarea)
 */
import { memo, forwardRef, useId, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../atoms/Label';
import { FORM_GROUP } from '@/lib/uiConstants';

export interface FormGroupProps {
  /** Etiqueta del campo */
  label?: string;
  /** Si el campo es obligatorio (muestra asterisco) */
  required?: boolean;
  /** Mensaje de error a mostrar */
  error?: string;
  /** Texto de ayuda */
  helper?: string;
  /** ID del elemento asociado (para htmlFor del label) */
  htmlFor?: string;
  /** Contenido del FormGroup (Input, Select, etc.) */
  children: ReactNode;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
}

/**
 * Componente FormGroup reutilizable
 */
const FormGroup = memo(
  forwardRef<HTMLDivElement, FormGroupProps>(function FormGroup({
  label,
  required = false,
  error,
  helper,
  htmlFor,
  children,
  className,
}, ref) {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const helperId = helper && !error ? `${generatedId}-helper` : undefined;
  const describedBy = errorId || helperId;

  // Clonar children para agregar aria-describedby si es un elemento válido
  const enhancedChildren = isValidElement(children) && describedBy
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, { 'aria-describedby': describedBy })
    : children;

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <Label label={label} required={required} htmlFor={htmlFor} />
      {enhancedChildren}
      {helper && !error && (
        <p id={helperId} className={FORM_GROUP.helper}>{helper}</p>
      )}
      {error && (
        <p id={errorId} className={FORM_GROUP.error}>{error}</p>
      )}
    </div>
  );
}));

FormGroup.displayName = 'FormGroup';

export { FormGroup };
