import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COLORES_ETIQUETAS, useCrearEtiqueta, useActualizarEtiqueta } from '@/hooks/personas';
import { useToast } from '@/hooks/utils';
import { FormDrawer, FormGroup, Input, Textarea } from '@/components/ui';

const etiquetaSchema = z.object({
  nombre: z.string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un código hexadecimal válido'),
  descripcion: z.string()
    .max(200, 'Descripción no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),
  orden: z.coerce.number()
    .min(0, 'Orden debe ser 0 o mayor')
    .max(999, 'Orden no puede exceder 999')
    .optional(),
});

export default function EtiquetaFormDrawer({ isOpen, onClose, etiqueta = null }) {
  const { success: showSuccess, error: showError } = useToast();
  const crearEtiqueta = useCrearEtiqueta();
  const actualizarEtiqueta = useActualizarEtiqueta();

  const isEditing = !!etiqueta;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(etiquetaSchema),
    defaultValues: {
      nombre: '',
      color: '#6366F1',
      descripcion: '',
      orden: 0,
    },
  });

  const colorActual = watch('color');

  useEffect(() => {
    if (isOpen) {
      if (etiqueta) {
        reset({
          nombre: etiqueta.nombre || '',
          color: etiqueta.color || '#6366F1',
          descripcion: etiqueta.descripcion || '',
          orden: etiqueta.orden || 0,
        });
      } else {
        reset({ nombre: '', color: '#6366F1', descripcion: '', orden: 0 });
      }
    }
  }, [isOpen, etiqueta, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        nombre: data.nombre,
        color: data.color,
        descripcion: data.descripcion || null,
        orden: data.orden || 0,
      };
      if (isEditing) {
        await actualizarEtiqueta.mutateAsync({ id: etiqueta.id, data: payload });
        showSuccess('Etiqueta actualizada correctamente');
      } else {
        await crearEtiqueta.mutateAsync(payload);
        showSuccess('Etiqueta creada correctamente');
      }
      onClose();
    } catch (error) {
      showError(error.message || 'Error al guardar etiqueta');
    }
  };

  return (
    <FormDrawer
      isOpen={isOpen}
      onClose={onClose}
      entityName="Etiqueta"
      mode={isEditing ? 'edit' : 'create'}
      subtitle="Configura el nombre, color y descripción de la etiqueta"
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      header={
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa:</p>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
            style={{
              backgroundColor: colorActual,
              color: isLightColor(colorActual) ? '#1F2937' : '#FFFFFF',
            }}
          >
            {watch('nombre') || 'Nombre de etiqueta'}
          </span>
        </div>
      }
    >
      <FormGroup label="Nombre" error={errors.nombre?.message} required>
        <Input
          {...register('nombre')}
          hasError={!!errors.nombre}
          placeholder="Ej: VIP, Frecuente, Nuevo..."
        />
      </FormGroup>

      <FormGroup label="Color" error={errors.color?.message}>
        <div className="flex flex-wrap gap-2">
          {COLORES_ETIQUETAS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setValue('color', color.value)}
              title={color.label}
              className={`
                h-8 w-8 rounded-full transition-all
                ${colorActual === color.value
                  ? 'ring-2 ring-offset-2 ring-primary-500 dark:ring-offset-gray-800'
                  : 'hover:scale-110'
                }
              `}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </FormGroup>

      <FormGroup label="Descripción" error={errors.descripcion?.message}>
        <Textarea
          {...register('descripcion')}
          rows={2}
          hasError={!!errors.descripcion}
          placeholder="Descripción opcional de la etiqueta..."
        />
      </FormGroup>

      <FormGroup label="Orden de visualización" helper="Menor número = aparece primero">
        <Input
          type="number"
          {...register('orden')}
          min={0}
          max={999}
          className="w-24"
        />
      </FormGroup>
    </FormDrawer>
  );
}

function isLightColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
