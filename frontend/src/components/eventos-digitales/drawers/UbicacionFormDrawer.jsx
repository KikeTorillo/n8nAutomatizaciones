import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Drawer, FormGroup, Input, Select } from '@/components/ui';
import { useCrearUbicacion, useActualizarUbicacion } from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';

/**
 * Tipos de ubicacion disponibles
 */
const TIPOS_UBICACION = [
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'recepcion', label: 'Recepcion' },
  { value: 'fiesta', label: 'Fiesta' },
  { value: 'after', label: 'After Party' },
  { value: 'otro', label: 'Otro' },
];

/**
 * Schema de validacion Zod para ubicaciones
 */
const ubicacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
  tipo: z.enum(['ceremonia', 'recepcion', 'fiesta', 'after', 'otro']).default('ceremonia'),
  direccion: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  hora_inicio: z.string().optional().or(z.literal('')),
  hora_fin: z.string().optional().or(z.literal('')),
  google_maps_url: z
    .string()
    .url('URL invalida')
    .optional()
    .or(z.literal('')),
});

/**
 * Drawer para crear/editar ubicaciones
 * @param {Object} props
 * @param {boolean} props.isOpen - Estado del drawer
 * @param {function} props.onClose - Callback para cerrar
 * @param {'create'|'edit'} props.mode - Modo del formulario
 * @param {Object} props.ubicacion - Ubicacion a editar (solo en modo edit)
 * @param {string|number} props.eventoId - ID del evento
 */
function UbicacionFormDrawer({ isOpen, onClose, mode = 'create', ubicacion = null, eventoId }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && ubicacion;

  // Mutations
  const crearMutation = useCrearUbicacion();
  const actualizarMutation = useActualizarUbicacion();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(ubicacionSchema),
    defaultValues: {
      nombre: '',
      tipo: 'ceremonia',
      direccion: '',
      hora_inicio: '',
      hora_fin: '',
      google_maps_url: '',
    },
  });

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen) {
      if (esEdicion && ubicacion) {
        reset({
          nombre: ubicacion.nombre || '',
          tipo: ubicacion.tipo || 'ceremonia',
          direccion: ubicacion.direccion || '',
          hora_inicio: ubicacion.hora_inicio || '',
          hora_fin: ubicacion.hora_fin || '',
          google_maps_url: ubicacion.google_maps_url || '',
        });
      } else {
        reset({
          nombre: '',
          tipo: 'ceremonia',
          direccion: '',
          hora_inicio: '',
          hora_fin: '',
          google_maps_url: '',
        });
      }
    }
  }, [isOpen, esEdicion, ubicacion, reset]);

  // Submit handler
  const onSubmit = (data) => {
    // Sanitizar datos - convertir strings vacios a undefined
    const payload = {
      nombre: data.nombre,
      tipo: data.tipo,
      direccion: data.direccion?.trim() || undefined,
      hora_inicio: data.hora_inicio || undefined,
      hora_fin: data.hora_fin || undefined,
      google_maps_url: data.google_maps_url?.trim() || undefined,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: ubicacion.id, eventoId, data: payload },
        {
          onSuccess: () => {
            showSuccess('Ubicacion actualizada correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar ubicacion');
          },
        }
      );
    } else {
      mutation.mutate(
        { eventoId, data: payload },
        {
          onSuccess: () => {
            showSuccess('Ubicacion creada correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al crear ubicacion');
          },
        }
      );
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Ubicacion' : 'Nueva Ubicacion'}
      subtitle={esEdicion ? 'Modifica los datos de la ubicacion' : 'Completa la informacion de la ubicacion'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <FormGroup label="Nombre" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            hasError={!!errors.nombre}
            placeholder="Ej: Iglesia Santa Maria"
          />
        </FormGroup>

        {/* Tipo */}
        <FormGroup label="Tipo de ubicacion" error={errors.tipo?.message}>
          <Select
            {...register('tipo')}
            hasError={!!errors.tipo}
            options={TIPOS_UBICACION}
          />
        </FormGroup>

        {/* Direccion */}
        <FormGroup label="Direccion" error={errors.direccion?.message}>
          <Input
            {...register('direccion')}
            hasError={!!errors.direccion}
            placeholder="Av. Principal #123, Colonia Centro"
          />
        </FormGroup>

        {/* Horarios */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Hora de inicio" error={errors.hora_inicio?.message}>
            <Input
              type="time"
              {...register('hora_inicio')}
              hasError={!!errors.hora_inicio}
            />
          </FormGroup>

          <FormGroup label="Hora de fin" error={errors.hora_fin?.message}>
            <Input
              type="time"
              {...register('hora_fin')}
              hasError={!!errors.hora_fin}
            />
          </FormGroup>
        </div>

        {/* Google Maps URL */}
        <FormGroup
          label="Link de Google Maps"
          error={errors.google_maps_url?.message}
          helper="Pega el link completo de Google Maps"
        >
          <Input
            {...register('google_maps_url')}
            hasError={!!errors.google_maps_url}
            placeholder="https://maps.google.com/..."
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
            {esEdicion ? 'Actualizar' : 'Crear'} Ubicacion
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default UbicacionFormDrawer;
