import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Drawer, FormGroup, Input, Textarea } from '@/components/ui';
import { useCrearInvitado, useActualizarInvitado } from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';

/**
 * Schema de validacion Zod para invitados
 */
const invitadoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
  email: z
    .string()
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  telefono: z.string().max(20, 'Maximo 20 caracteres').optional().or(z.literal('')),
  grupo_familiar: z.string().max(100, 'Maximo 100 caracteres').optional().or(z.literal('')),
  max_acompanantes: z.coerce.number().min(0, 'Minimo 0').max(10, 'Maximo 10').default(0),
  notas: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
});

/**
 * Drawer para crear/editar invitados
 * @param {Object} props
 * @param {boolean} props.isOpen - Estado del drawer
 * @param {function} props.onClose - Callback para cerrar
 * @param {'create'|'edit'} props.mode - Modo del formulario
 * @param {Object} props.invitado - Invitado a editar (solo en modo edit)
 * @param {string|number} props.eventoId - ID del evento
 */
function InvitadoFormDrawer({ isOpen, onClose, mode = 'create', invitado = null, eventoId }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && invitado;

  // Mutations
  const crearMutation = useCrearInvitado();
  const actualizarMutation = useActualizarInvitado();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(invitadoSchema),
    defaultValues: {
      nombre: '',
      email: '',
      telefono: '',
      grupo_familiar: '',
      max_acompanantes: 0,
      notas: '',
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen) {
      if (esEdicion && invitado) {
        reset({
          nombre: invitado.nombre || '',
          email: invitado.email || '',
          telefono: invitado.telefono || '',
          grupo_familiar: invitado.grupo_familiar || '',
          max_acompanantes: invitado.max_acompanantes || 0,
          notas: invitado.notas || '',
        });
      } else {
        reset({
          nombre: '',
          email: '',
          telefono: '',
          grupo_familiar: '',
          max_acompanantes: 0,
          notas: '',
        });
      }
    }
  }, [isOpen, esEdicion, invitado, reset]);

  // Submit handler
  const onSubmit = (data) => {
    // Sanitizar datos - convertir strings vacios a undefined
    const payload = {
      nombre: data.nombre,
      email: data.email?.trim() || undefined,
      telefono: data.telefono?.trim() || undefined,
      grupo_familiar: data.grupo_familiar?.trim() || undefined,
      max_acompanantes: data.max_acompanantes,
      notas: data.notas?.trim() || undefined,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: invitado.id, eventoId, data: payload },
        {
          onSuccess: () => {
            showSuccess('Invitado actualizado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar invitado');
          },
        }
      );
    } else {
      mutation.mutate(
        { eventoId, data: payload },
        {
          onSuccess: () => {
            showSuccess('Invitado creado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al crear invitado');
          },
        }
      );
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Invitado' : 'Nuevo Invitado'}
      subtitle={esEdicion ? 'Modifica los datos del invitado' : 'Completa la informacion del invitado'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <FormGroup label="Nombre" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            hasError={!!errors.nombre}
            placeholder="Ej: Juan Perez"
          />
        </FormGroup>

        {/* Email y Telefono en row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Email" error={errors.email?.message}>
            <Input
              type="email"
              {...register('email')}
              hasError={!!errors.email}
              placeholder="juan@email.com"
            />
          </FormGroup>

          <FormGroup label="Telefono" error={errors.telefono?.message}>
            <Input
              {...register('telefono')}
              hasError={!!errors.telefono}
              placeholder="5551234567"
            />
          </FormGroup>
        </div>

        {/* Grupo familiar y Max acompanantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup label="Grupo Familiar" error={errors.grupo_familiar?.message}>
            <Input
              {...register('grupo_familiar')}
              hasError={!!errors.grupo_familiar}
              placeholder="Ej: Familia Perez"
            />
          </FormGroup>

          <FormGroup label="Max. Acompanantes" error={errors.max_acompanantes?.message}>
            <Input
              type="number"
              min="0"
              max="10"
              {...register('max_acompanantes')}
              hasError={!!errors.max_acompanantes}
            />
          </FormGroup>
        </div>

        {/* Notas */}
        <FormGroup label="Notas" error={errors.notas?.message}>
          <Textarea
            {...register('notas')}
            rows={3}
            hasError={!!errors.notas}
            placeholder="Notas adicionales sobre el invitado"
          />
        </FormGroup>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
          >
            {esEdicion ? 'Actualizar' : 'Crear'} Invitado
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default InvitadoFormDrawer;
