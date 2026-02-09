import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin } from 'lucide-react';
import { FormDrawer, FormGroup, Input, Select } from '@/components/ui';
import { useCrearUbicacion, useActualizarUbicacion } from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';

const TIPOS_UBICACION = [
  { value: 'ceremonia', label: 'Ceremonia' },
  { value: 'recepcion', label: 'Recepcion' },
  { value: 'fiesta', label: 'Fiesta' },
  { value: 'after', label: 'After Party' },
  { value: 'otro', label: 'Otro' },
];

const ubicacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Maximo 100 caracteres'),
  tipo: z.enum(['ceremonia', 'recepcion', 'fiesta', 'after', 'otro']).default('ceremonia'),
  direccion: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  hora_inicio: z.string().optional().or(z.literal('')),
  hora_fin: z.string().optional().or(z.literal('')),
  google_maps_url: z.string().url('URL invalida').optional().or(z.literal('')),
});

const DEFAULT_VALUES = {
  nombre: '',
  tipo: 'ceremonia',
  direccion: '',
  hora_inicio: '',
  hora_fin: '',
  google_maps_url: '',
};

function entityToFormValues(ubicacion) {
  return {
    nombre: ubicacion.nombre || '',
    tipo: ubicacion.tipo || 'ceremonia',
    direccion: ubicacion.direccion || '',
    hora_inicio: ubicacion.hora_inicio || '',
    hora_fin: ubicacion.hora_fin || '',
    google_maps_url: ubicacion.google_maps_url || '',
  };
}

function UbicacionFormDrawer({ isOpen, onClose, mode = 'create', ubicacion = null, eventoId }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && ubicacion;

  const crearMutation = useCrearUbicacion();
  const actualizarMutation = useActualizarUbicacion();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(ubicacionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (isOpen) {
      reset(esEdicion && ubicacion ? entityToFormValues(ubicacion) : DEFAULT_VALUES);
    }
  }, [isOpen, esEdicion, ubicacion, reset]);

  const onSubmit = useCallback(async (data) => {
    const payload = {
      nombre: data.nombre,
      tipo: data.tipo,
      direccion: data.direccion?.trim() || undefined,
      hora_inicio: data.hora_inicio || undefined,
      hora_fin: data.hora_fin || undefined,
      google_maps_url: data.google_maps_url?.trim() || undefined,
    };

    try {
      if (esEdicion) {
        await actualizarMutation.mutateAsync({ id: ubicacion.id, eventoId, data: payload });
        showSuccess('Ubicacion actualizada correctamente');
      } else {
        await crearMutation.mutateAsync({ eventoId, data: payload });
        showSuccess('Ubicacion creada correctamente');
      }
      onClose();
    } catch (err) {
      showError(err.message || `Error al ${esEdicion ? 'actualizar' : 'crear'} ubicacion`);
    }
  }, [esEdicion, ubicacion, eventoId, actualizarMutation, crearMutation, showSuccess, showError, onClose]);

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      entityName="Ubicacion"
      mode={esEdicion ? 'edit' : 'create'}
      subtitle={esEdicion ? 'Modifica los datos de la ubicacion' : 'Completa la informacion de la ubicacion'}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <FormGroup label="Nombre" error={errors.nombre?.message} required>
        <Input
          {...register('nombre')}
          hasError={!!errors.nombre}
          placeholder="Ej: Iglesia Santa Maria"
        />
      </FormGroup>

      <FormGroup label="Tipo de ubicacion" error={errors.tipo?.message}>
        <Select
          {...register('tipo')}
          hasError={!!errors.tipo}
          options={TIPOS_UBICACION}
        />
      </FormGroup>

      <FormGroup label="Direccion" error={errors.direccion?.message}>
        <Input
          {...register('direccion')}
          hasError={!!errors.direccion}
          placeholder="Av. Principal #123, Colonia Centro"
        />
      </FormGroup>

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

      {watch('google_maps_url')?.trim() && !errors.google_maps_url && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>Las coordenadas del mapa se extraeran automaticamente al guardar</span>
        </div>
      )}
    </FormDrawer>
  );
}

export default UbicacionFormDrawer;
