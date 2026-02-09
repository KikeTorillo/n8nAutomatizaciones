import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Drawer, FormGroup, Input, Select, Textarea } from '@/components/ui';
import { useCrearRegalo, useActualizarRegalo } from '@/hooks/otros/eventos-digitales';
import { useToast } from '@/hooks/utils';

/**
 * Tipos de regalo disponibles
 */
const TIPOS_REGALO = [
  { value: 'producto', label: 'Producto' },
  { value: 'sobre_digital', label: 'Sobre Digital' },
  { value: 'link_externo', label: 'Link Externo' },
];

/**
 * Schema de validacion Zod para regalos
 */
const regaloSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Maximo 200 caracteres'),
  tipo: z.enum(['producto', 'sobre_digital', 'link_externo']).default('producto'),
  descripcion: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo').optional().or(z.literal('')),
  url_externa: z
    .string()
    .url('URL invalida')
    .optional()
    .or(z.literal('')),
});

/**
 * Drawer para crear/editar regalos
 * @param {Object} props
 * @param {boolean} props.isOpen - Estado del drawer
 * @param {function} props.onClose - Callback para cerrar
 * @param {'create'|'edit'} props.mode - Modo del formulario
 * @param {Object} props.regalo - Regalo a editar (solo en modo edit)
 * @param {string|number} props.eventoId - ID del evento
 */
function RegaloFormDrawer({ isOpen, onClose, mode = 'create', regalo = null, eventoId }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && regalo;

  // Mutations
  const crearMutation = useCrearRegalo();
  const actualizarMutation = useActualizarRegalo();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(regaloSchema),
    defaultValues: {
      nombre: '',
      tipo: 'producto',
      descripcion: '',
      precio: '',
      url_externa: '',
    },
  });

  const tipoSeleccionado = watch('tipo');

  // Cargar datos al editar
  useEffect(() => {
    if (isOpen) {
      if (esEdicion && regalo) {
        reset({
          nombre: regalo.nombre || '',
          tipo: regalo.tipo || 'producto',
          descripcion: regalo.descripcion || '',
          precio: regalo.precio ? String(regalo.precio) : '',
          url_externa: regalo.url_externa || '',
        });
      } else {
        reset({
          nombre: '',
          tipo: 'producto',
          descripcion: '',
          precio: '',
          url_externa: '',
        });
      }
    }
  }, [isOpen, esEdicion, regalo, reset]);

  // Submit handler
  const onSubmit = (data) => {
    // Sanitizar datos - convertir strings vacios a undefined
    const payload = {
      nombre: data.nombre,
      tipo: data.tipo,
      descripcion: data.descripcion?.trim() || undefined,
      precio: data.precio ? parseFloat(data.precio) : undefined,
      url_externa: data.url_externa?.trim() || undefined,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: regalo.id, eventoId, data: payload },
        {
          onSuccess: () => {
            showSuccess('Regalo actualizado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar regalo');
          },
        }
      );
    } else {
      mutation.mutate(
        { eventoId, data: payload },
        {
          onSuccess: () => {
            showSuccess('Regalo creado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al crear regalo');
          },
        }
      );
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Regalo' : 'Nuevo Regalo'}
      subtitle={esEdicion ? 'Modifica los datos del regalo' : 'Agrega un nuevo regalo a la mesa'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <FormGroup label="Nombre" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            hasError={!!errors.nombre}
            placeholder="Ej: Licuadora Oster"
          />
        </FormGroup>

        {/* Tipo y Precio */}
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

        {/* Descripcion */}
        <FormGroup label="Descripcion" error={errors.descripcion?.message}>
          <Textarea
            {...register('descripcion')}
            rows={3}
            hasError={!!errors.descripcion}
            placeholder="Descripcion opcional del regalo"
          />
        </FormGroup>

        {/* URL Externa - solo visible para ciertos tipos */}
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
            {esEdicion ? 'Actualizar' : 'Crear'} Regalo
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default RegaloFormDrawer;
