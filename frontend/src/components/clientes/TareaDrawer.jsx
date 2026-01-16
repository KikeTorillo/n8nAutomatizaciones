/**
 * ====================================================================
 * TAREA DRAWER - DRAWER PARA CREAR/EDITAR TAREAS
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Drawer para crear tareas con asignación, prioridad y vencimiento
 *
 * ====================================================================
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Drawer } from '@/components/ui';
import { PRIORIDADES } from '@/hooks/useClienteActividades';

// Schema de validación
const tareaSchema = z.object({
  titulo: z.string().min(2, 'El título debe tener al menos 2 caracteres').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(5000, 'Máximo 5000 caracteres').optional().nullable(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']).default('normal'),
  fecha_vencimiento: z.string().optional().nullable(),
  asignado_a: z.number().optional().nullable(),
});

export default function TareaDrawer({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  tarea = null, // Para edición
  usuarios = [], // Lista de usuarios para asignar
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(tareaSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      prioridad: 'normal',
      fecha_vencimiento: '',
      asignado_a: null,
    },
  });

  // Resetear form cuando se abre/cierra o cambia la tarea
  useEffect(() => {
    if (isOpen) {
      if (tarea) {
        reset({
          titulo: tarea.titulo || '',
          descripcion: tarea.descripcion || '',
          prioridad: tarea.prioridad || 'normal',
          fecha_vencimiento: tarea.fecha_vencimiento
            ? new Date(tarea.fecha_vencimiento).toISOString().split('T')[0]
            : '',
          asignado_a: tarea.asignado_a || null,
        });
      } else {
        reset({
          titulo: '',
          descripcion: '',
          prioridad: 'normal',
          fecha_vencimiento: '',
          asignado_a: null,
        });
      }
    }
  }, [isOpen, tarea, reset]);

  const handleFormSubmit = async (data) => {
    // Preparar datos
    const tareaData = {
      tipo: 'tarea',
      fuente: 'manual',
      estado: 'pendiente',
      titulo: data.titulo,
      descripcion: data.descripcion || null,
      prioridad: data.prioridad,
      fecha_vencimiento: data.fecha_vencimiento || null,
      asignado_a: data.asignado_a || null,
    };

    await onSubmit(tareaData);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={tarea ? 'Editar tarea' : 'Nueva tarea'}
      subtitle="Crea una tarea asignable con fecha de vencimiento"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="titulo"
            type="text"
            {...register('titulo')}
            className={`
              w-full px-4 py-2.5 rounded-lg
              bg-gray-50 dark:bg-gray-900
              border ${errors.titulo ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
            `}
            placeholder="¿Qué necesitas hacer?"
          />
          {errors.titulo && (
            <p className="mt-1 text-sm text-red-500">{errors.titulo.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            id="descripcion"
            rows={3}
            {...register('descripcion')}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-gray-50 dark:bg-gray-900
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
              resize-none
            "
            placeholder="Detalles adicionales..."
          />
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prioridad
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORIDADES.map(({ value, label, bgColor, color }) => (
              <label
                key={value}
                className={`
                  flex items-center justify-center px-3 py-2 rounded-lg cursor-pointer
                  border-2 transition-all
                  ${bgColor}
                `}
              >
                <input
                  type="radio"
                  value={value}
                  {...register('prioridad')}
                  className="sr-only"
                />
                <span className={`text-sm font-medium ${color}`}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fecha de vencimiento */}
        <div>
          <label htmlFor="fecha_vencimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha de vencimiento
          </label>
          <input
            id="fecha_vencimiento"
            type="date"
            {...register('fecha_vencimiento')}
            min={new Date().toISOString().split('T')[0]}
            className="
              w-full px-4 py-2.5 rounded-lg
              bg-gray-50 dark:bg-gray-900
              border border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500
            "
          />
        </div>

        {/* Asignar a */}
        {usuarios.length > 0 && (
          <div>
            <label htmlFor="asignado_a" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Asignar a
            </label>
            <select
              id="asignado_a"
              {...register('asignado_a', { valueAsNumber: true })}
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-gray-50 dark:bg-gray-900
                border border-gray-200 dark:border-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="">Sin asignar</option>
              {usuarios.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="
              flex-1 px-4 py-3 rounded-lg
              bg-gray-100 dark:bg-gray-700
              text-gray-700 dark:text-gray-300
              font-medium
              hover:bg-gray-200 dark:hover:bg-gray-600
              transition-colors
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="
              flex-1 px-4 py-3 rounded-lg
              bg-primary-500 hover:bg-primary-600
              text-white font-medium
              transition-colors
              disabled:opacity-50
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>{tarea ? 'Actualizar' : 'Crear tarea'}</span>
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
