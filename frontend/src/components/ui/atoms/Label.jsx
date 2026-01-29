/**
 * Label - Atom para etiquetas de formulario accesible
 * Ene 2026 - Preparación Librería UI
 */
import { memo } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { LABEL_BASE, LABEL_REQUIRED, ARIA_LABELS } from '@/lib/uiConstants';

/**
 * Label - Componente label reutilizable y accesible
 *
 * @component
 * @example
 * <Label label="Email" required htmlFor="email-input" />
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.label - Texto o nodo React para la etiqueta
 * @param {boolean} [props.required=false] - Si el campo es obligatorio (muestra asterisco)
 * @param {string} [props.htmlFor] - ID del elemento asociado
 * @param {string} [props.className] - Clases adicionales
 * @returns {React.ReactElement|null}
 */
const Label = memo(function Label({ label, required = false, htmlFor, className }) {
  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor}
      className={cn(LABEL_BASE, className)}
    >
      {label}
      {required && (
        <>
          <span className={LABEL_REQUIRED.asterisk} aria-hidden="true">*</span>
          <span className={LABEL_REQUIRED.srOnly}>{ARIA_LABELS.required}</span>
        </>
      )}
    </label>
  );
});

Label.displayName = 'Label';

Label.propTypes = {
  label: PropTypes.node,
  required: PropTypes.bool,
  htmlFor: PropTypes.string,
  className: PropTypes.string,
};

export { Label };
