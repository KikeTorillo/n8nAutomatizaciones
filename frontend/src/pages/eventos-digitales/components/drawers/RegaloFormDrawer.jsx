import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormDrawer, FormGroup, Input, Select, Textarea } from '@/components/ui';
import { useCrearRegalo, useActualizarRegalo } from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';

const TIPOS_REGALO = [
  { value: 'producto', label: 'Producto' },
  { value: 'sobre_digital', label: 'Sobre Digital' },
  { value: 'link_externo', label: 'Link Externo' },
];

const regaloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Maximo 200 caracteres'),
  tipo: z.enum(['producto', 'sobre_digital', 'link_externo']).default('producto'),
  descripcion: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').optional().or(z.literal('')),
  url_externa: z.string().url('URL invalida').optional().or(z.literal('')),
});

const DEFAULT_VALUES = {
  nombre: '',
  tipo: 'producto',
  descripcion: '',
  precio: '',
  url_externa: '',
};

function entityToFormValues(regalo) {
  return {
    nombre: regalo.nombre || '',
    tipo: regalo.tipo || 'producto',
    descripcion: regalo.descripcion || '',
    precio: regalo.precio ? String(regalo.precio) : '',
    url_externa: regalo.url_externa || '',
  };
}

function RegaloFormDrawer({ isOpen, onClose, mode = 'create', regalo = null, eventoId }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && regalo;

  const crearMutation = useCrearRegalo();
  const actualizarMutation = useActualizarRegalo();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(regaloSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const tipoSeleccionado = watch('tipo');

  useEffect(() => {
    if (isOpen) {
      reset(esEdicion && regalo ? entityToFormValues(regalo) : DEFAULT_VALUES);
    }
  }, [isOpen, esEdicion, regalo, reset]);

  const onSubmit = useCallback(async (data) => {
    const payload = {
      nombre: data.nombre,
      tipo: data.tipo,
      descripcion: data.descripcion?.trim() || undefined,
      precio: data.precio ? parseFloat(data.precio) : undefined,
      url_externa: data.url_externa?.trim() || undefined,
    };

    try {
      if (esEdicion) {
        await actualizarMutation.mutateAsync({ id: regalo.id, eventoId, data: payload });
        showSuccess('Regalo actualizado correctamente');
      } else {
        await crearMutation.mutateAsync({ eventoId, data: payload });
        showSuccess('Regalo creado correctamente');
      }
      onClose();
    } catch (err) {
      showError(err.message || `Error al ${esEdicion ? 'actualizar' : 'crear'} regalo`);
    }
  }, [esEdicion, regalo, eventoId, actualizarMutation, crearMutation, showSuccess, showError, onClose]);

  const isSubmitting = crearMutation.isPending || actualizarMutation.isPending;

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      entityName="Regalo"
      mode={esEdicion ? 'edit' : 'create'}
      subtitle={esEdicion ? 'Modifica los datos del regalo' : 'Agrega un nuevo regalo a la mesa'}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      <FormGroup label="Nombre" error={errors.nombre?.message} required>
        <Input
          {...register('nombre')}
          hasError={!!errors.nombre}
          placeholder="Ej: Licuadora Oster"
        />
      </FormGroup>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup label="Tipo de regalo" error={errors.tipo?.message}>
          <Select
            {...register('tipo')}
            hasError={!!errors.tipo}
            options={TIPOS_REGALO}
          />
        </FormGroup>

        <FormGroup label="Precio" error={errors.precio?.message}>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register('precio')}
            hasError={!!errors.precio}
            placeholder="0.00"
          />
        </FormGroup>
      </div>

      <FormGroup label="Descripcion" error={errors.descripcion?.message}>
        <Textarea
          {...register('descripcion')}
          rows={3}
          hasError={!!errors.descripcion}
          placeholder="Descripcion opcional del regalo"
        />
      </FormGroup>

      {(tipoSeleccionado === 'link_externo' || tipoSeleccionado === 'producto') && (
        <FormGroup
          label="URL Externa"
          error={errors.url_externa?.message}
          helper="Link a tienda en linea o producto"
        >
          <Input
            {...register('url_externa')}
            hasError={!!errors.url_externa}
            placeholder="https://amazon.com/..."
          />
        </FormGroup>
      )}
    </FormDrawer>
  );
}

export default RegaloFormDrawer;
