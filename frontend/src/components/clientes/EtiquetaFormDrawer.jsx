/**
 * ====================================================================
 * COMPONENTE - DRAWER FORMULARIO DE ETIQUETA
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Drawer para crear y editar etiquetas
 *
 * ====================================================================
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { COLORES_ETIQUETAS, useCrearEtiqueta, useActualizarEtiqueta } from '@/hooks/useEtiquetasClientes';
import { useToast } from '@/hooks/useToast';
import Drawer from '@/components/ui/Drawer';

// Schema de validación
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
  const { toast } = useToast();
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

  // Reset form cuando cambia la etiqueta o se abre el modal
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
        reset({
          nombre: '',
          color: '#6366F1',
          descripcion: '',
          orden: 0,
        });
      }
    }
  }, [isOpen, etiqueta, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEditing) {
        await actualizarEtiqueta.mutateAsync({
          id: etiqueta.id,
          data: {
            nombre: data.nombre,
            color: data.color,
            descripcion: data.descripcion || null,
            orden: data.orden || 0,
          },
        });
        toast.success('Etiqueta actualizada correctamente');
      } else {
        await crearEtiqueta.mutateAsync({
          nombre: data.nombre,
          color: data.color,
          descripcion: data.descripcion || null,
          orden: data.orden || 0,
        });
        toast.success('Etiqueta creada correctamente');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar etiqueta');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
      subtitle="Configura el nombre, color y descripción de la etiqueta"
    >
      {/* Preview */}
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

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            {...register('nombre')}
            className={`
              w-full rounded-md border-0 py-2 px-3
              text-gray-900 dark:text-white
              ring-1 ring-inset
              ${errors.nombre
                ? 'ring-red-300 focus:ring-red-500'
                : 'ring-gray-300 dark:ring-gray-600 focus:ring-primary-500'
              }
              bg-white dark:bg-gray-700
              placeholder:text-gray-400
              sm:text-sm
            `}
            placeholder="Ej: VIP, Frecuente, Nuevo..."
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-500">{errors.nombre.message}</p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color
          </label>
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
          {errors.color && (
            <p className="mt-1 text-sm text-red-500">{errors.color.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            {...register('descripcion')}
            rows={2}
            className={`
              w-full rounded-md border-0 py-2 px-3
              text-gray-900 dark:text-white
              ring-1 ring-inset ring-gray-300 dark:ring-gray-600
              focus:ring-primary-500
              bg-white dark:bg-gray-700
              placeholder:text-gray-400
              sm:text-sm
            `}
            placeholder="Descripción opcional de la etiqueta..."
          />
          {errors.descripcion && (
            <p className="mt-1 text-sm text-red-500">{errors.descripcion.message}</p>
          )}
        </div>

        {/* Orden */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Orden de visualización
          </label>
          <input
            type="number"
            {...register('orden')}
            min={0}
            max={999}
            className={`
              w-24 rounded-md border-0 py-2 px-3
              text-gray-900 dark:text-white
              ring-1 ring-inset ring-gray-300 dark:ring-gray-600
              focus:ring-primary-500
              bg-white dark:bg-gray-700
              sm:text-sm
            `}
          />
          <p className="mt-1 text-xs text-gray-500">Menor número = aparece primero</p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear etiqueta'
            }
          </button>
        </div>
      </form>
    </Drawer>
  );
}

// Utilidad para determinar si un color es claro
function isLightColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
