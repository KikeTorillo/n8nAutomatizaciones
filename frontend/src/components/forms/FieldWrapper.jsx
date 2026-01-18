import { FormGroup } from '@/components/ui';

/**
 * Componente FieldWrapper - Wrapper visual para campos de formulario
 * DEPRECATED: Usar FormGroup directamente
 * Mantenido para compatibilidad, delega a FormGroup
 */
function FieldWrapper({ label, error, required = false, helperText, children }) {
  return (
    <FormGroup
      label={label}
      error={error}
      required={required}
      helper={helperText}
    >
      {children}
    </FormGroup>
  );
}

export default FieldWrapper;
