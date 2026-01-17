/**
 * Modal para editar configuración de planes
 * Permite al super admin modificar límites, precios y configuración de planes
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Checkbox, Drawer } from '@/components/ui';
import FormField from '../forms/FormField';
import { useToast } from '@/hooks/utils';
import { useSuperAdmin } from '@/hooks/sistema';

// Schema de validación con Zod
const editarPlanSchema = z.object({
  nombre_plan: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  precio_mensual: z.coerce.number()
    .min(0, 'El precio debe ser mayor o igual a 0')
    .optional(),
  precio_anual: z.coerce.number()
    .min(0, 'El precio anual debe ser mayor o igual a 0')
    .optional(),
  limite_profesionales: z.coerce.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1')
    .max(10000, 'Máximo 10000')
    .optional()
    .nullable(),
  limite_clientes: z.coerce.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1')
    .max(100000, 'Máximo 100000')
    .optional()
    .nullable(),
  limite_servicios: z.coerce.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1')
    .max(1000, 'Máximo 1000')
    .optional()
    .nullable(),
  limite_usuarios: z.coerce.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1')
    .max(100, 'Máximo 100')
    .optional()
    .nullable(),
  limite_citas_mes: z.coerce.number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser al menos 1')
    .max(100000, 'Máximo 100000')
    .optional()
    .nullable(),
  activo: z.boolean().optional(),
});

export default function EditarPlanModal({ isOpen, onClose, plan }) {
  const toast = useToast();
  const { actualizarPlan } = useSuperAdmin();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(editarPlanSchema),
    defaultValues: {
      nombre_plan: plan?.nombre_plan || '',
      descripcion: plan?.descripcion || '',
      precio_mensual: plan?.precio_mensual || 0,
      precio_anual: plan?.precio_anual || 0,
      limite_profesionales: plan?.limite_profesionales || null,
      limite_clientes: plan?.limite_clientes || null,
      limite_servicios: plan?.limite_servicios || null,
      limite_usuarios: plan?.limite_usuarios || null,
      limite_citas_mes: plan?.limite_citas_mes || null,
      activo: plan?.activo ?? true,
    },
  });

  // Resetear formulario cuando cambia el plan
  useEffect(() => {
    if (plan) {
      reset({
        nombre_plan: plan.nombre_plan || '',
        descripcion: plan.descripcion || '',
        precio_mensual: plan.precio_mensual || 0,
        precio_anual: plan.precio_anual || 0,
        limite_profesionales: plan.limite_profesionales || null,
        limite_clientes: plan.limite_clientes || null,
        limite_servicios: plan.limite_servicios || null,
        limite_usuarios: plan.limite_usuarios || null,
        limite_citas_mes: plan.limite_citas_mes || null,
        activo: plan.activo ?? true,
      });
    }
  }, [plan, reset]);

  const onSubmit = async (data) => {
    try {
      // Solo enviar campos que fueron modificados y no están vacíos
      const payload = Object.entries(data).reduce((acc, [key, value]) => {
        // Si el valor es diferente al original y no es null/undefined/empty string
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      await actualizarPlan.mutateAsync({
        id: plan.id,
        ...payload
      });

      toast.success('Plan actualizado exitosamente');
      onClose();
      reset();
    } catch (error) {
      const mensaje = error.response?.data?.message ||
                      error.response?.data?.error ||
                      error.message ||
                      'Error al actualizar el plan';
      toast.error(mensaje);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={`Editar Plan: ${plan?.nombre_plan || ''}`}
      subtitle="Modifica los límites y precios del plan"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información General */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Información General
          </h3>

          <FormField
            name="nombre_plan"
            control={control}
            label="Nombre del Plan"
            placeholder="Ej: Plan Profesional"
          />

          <FormField
            name="descripcion"
            control={control}
            label="Descripción"
            placeholder="Descripción del plan"
            type="textarea"
            rows={3}
          />
        </div>

        {/* Precios */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Precios
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="precio_mensual"
              control={control}
              label="Precio Mensual ($)"
              type="number"
              placeholder="299.00"
              step="0.01"
            />

            <FormField
              name="precio_anual"
              control={control}
              label="Precio Anual ($)"
              type="number"
              placeholder="2990.00"
              step="0.01"
            />
          </div>
        </div>

        {/* Límites */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Límites de Recursos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="limite_profesionales"
              control={control}
              label="Límite de Profesionales"
              type="number"
              placeholder="5"
              helperText="Dejar vacío para ilimitado"
            />

            <FormField
              name="limite_clientes"
              control={control}
              label="Límite de Clientes"
              type="number"
              placeholder="200"
              helperText="Dejar vacío para ilimitado"
            />

            <FormField
              name="limite_servicios"
              control={control}
              label="Límite de Servicios"
              type="number"
              placeholder="15"
              helperText="Dejar vacío para ilimitado"
            />

            <FormField
              name="limite_usuarios"
              control={control}
              label="Límite de Usuarios"
              type="number"
              placeholder="3"
              helperText="Dejar vacío para ilimitado"
            />

            <FormField
              name="limite_citas_mes"
              control={control}
              label="Límite de Citas/Mes"
              type="number"
              placeholder="200"
              helperText="Dejar vacío para ilimitado"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
            Estado
          </h3>

          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="activo"
                label="Plan activo (visible para nuevas organizaciones)"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={actualizarPlan.isPending}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            isLoading={actualizarPlan.isPending}
            disabled={actualizarPlan.isPending || !isDirty}
          >
            {actualizarPlan.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
