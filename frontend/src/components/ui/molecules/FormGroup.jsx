/**
 * FormGroup - Molecule para agrupar campos de formulario
 * Fase 2 del Plan de Mejoras Frontend - Enero 2026
 *
 * Combina Label + children + helper/error text
 * Compatible con los atoms existentes (Input, Select, Textarea)
 */
import { memo, useId, cloneElement, isValidElement } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Label } from '../atoms/Label';
import { FORM_GROUP } from '@/lib/uiConstants';

/**
 * Componente FormGroup reutilizable
 * @param {string} label - Etiqueta del campo
 * @param {boolean} required - Si el campo es obligatorio
 * @param {string} error - Mensaje de error
 * @param {string} helper - Texto de ayuda
 * @param {string} htmlFor - ID del elemento asociado
 * @param {React.ReactNode} children - Contenido (Input, Select, etc.)
 * @param {string} className - Clases adicionales para el contenedor
 */
const FormGroup = memo(function FormGroup({
  label,
  required = false,
  error,
  helper,
  htmlFor,
  children,
  className,
}) {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const helperId = helper && !error ? `${generatedId}-helper` : undefined;
  const describedBy = errorId || helperId;

  // Clonar children para agregar aria-describedby si es un elemento válido
  const enhancedChildren = isValidElement(children) && describedBy
    ? cloneElement(children, { 'aria-describedby': describedBy })
    : children;

  return (
    <div className={cn('w-full', className)}>
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
});

FormGroup.displayName = 'FormGroup';

FormGroup.propTypes = {
  /** Etiqueta del campo */
  label: PropTypes.string,
  /** Si el campo es obligatorio (muestra asterisco) */
  required: PropTypes.bool,
  /** Mensaje de error a mostrar */
  error: PropTypes.string,
  /** Texto de ayuda */
  helper: PropTypes.string,
  /** ID del elemento asociado (para htmlFor del label) */
  htmlFor: PropTypes.string,
  /** Contenido del FormGroup (Input, Select, etc.) */
  children: PropTypes.node.isRequired,
  /** Clases CSS adicionales para el contenedor */
  className: PropTypes.string,
};

export { FormGroup };
