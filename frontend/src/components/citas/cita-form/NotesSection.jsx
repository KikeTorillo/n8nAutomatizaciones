import { Controller } from 'react-hook-form';
import { FormGroup, Textarea } from '@/components/ui';

/**
 * NotesSection - Sección de notas del cliente y notas internas
 *
 * @param {Object} props
 * @param {Object} props.control - Control de React Hook Form
 * @param {Object} props.errors - Errores de validación
 */
function NotesSection({ control, errors }) {
  return (
    <>
      {/* Notas del Cliente */}
      <FormGroup
        label="Notas del Cliente (Opcional)"
        error={errors.notas_cliente?.message}
      >
        <Controller
          name="notas_cliente"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={3}
              maxLength={500}
              placeholder="Preferencias, alergias, solicitudes especiales..."
              hasError={!!errors.notas_cliente}
            />
          )}
        />
      </FormGroup>

      {/* Notas Internas */}
      <FormGroup
        label="Notas Internas (Opcional)"
        error={errors.notas_internas?.message}
        helper="Solo visible para el personal del negocio"
      >
        <Controller
          name="notas_internas"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={2}
              maxLength={500}
              placeholder="Notas privadas del negocio (no visibles para el cliente)..."
              hasError={!!errors.notas_internas}
            />
          )}
        />
      </FormGroup>
    </>
  );
}

export default NotesSection;
