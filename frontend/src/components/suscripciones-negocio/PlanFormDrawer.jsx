import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  FormGroup,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { useCrearPlan, useActualizarPlan, CICLOS_FACTURACION } from '@/hooks/suscripciones-negocio';
import { useToast } from '@/hooks/utils';

/**
 * Schema de validación Zod
 */
const planSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  precio: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  ciclo_facturacion: z.enum(['mensual', 'trimestral', 'semestral', 'anual']),
  dias_prueba: z.coerce.number().min(0, 'No puede ser negativo').max(90, 'Máximo 90 días').default(0),
  caracteristicas: z.array(z.object({
    texto: z.string().min(1, 'La característica no puede estar vacía'),
  })).optional(),
  activo: z.boolean().default(true),
});

/**
 * Drawer para crear/editar planes de suscripción
 */
function PlanFormDrawer({ isOpen, onClose, plan = null, mode = 'create' }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && plan;

  // Mutations
  const crearMutation = useCrearPlan();
  const actualizarMutation = useActualizarPlan();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      ciclo_facturacion: CICLOS_FACTURACION.MENSUAL,
      dias_prueba: 14,
      caracteristicas: [],
      activo: true,
    },
  });

  // Field array para características
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'caracteristicas',
  });

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && plan) {
      // Mapear campos del backend (features, precio_mensual, dias_trial) al frontend
      const featuresData = plan.features || plan.caracteristicas || [];
      const caracteristicasArray = Array.isArray(featuresData)
        ? featuresData.map(c => ({ texto: c }))
        : [];

      reset({
        nombre: plan.nombre || '',
        descripcion: plan.descripcion || '',
        precio: plan.precio_mensual || plan.precio || 0,
        ciclo_facturacion: plan.ciclo_facturacion || CICLOS_FACTURACION.MENSUAL,
        dias_prueba: plan.dias_trial ?? plan.dias_prueba ?? 0,
        caracteristicas: caracteristicasArray,
        activo: plan.activo ?? true,
      });
    } else {
      reset({
        nombre: '',
        descripcion: '',
        precio: 0,
        ciclo_facturacion: CICLOS_FACTURACION.MENSUAL,
        dias_prueba: 14,
        caracteristicas: [],
        activo: true,
      });
    }
  }, [esEdicion, plan, reset]);

  // Submit handler
  const onSubmit = (data) => {
    // Generar código a partir del nombre (slug)
    const generarCodigo = (nombre) => {
      return nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    };

    // Mapear campos del frontend a los nombres del backend
    const payload = {
      codigo: esEdicion ? undefined : generarCodigo(data.nombre),
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      precio_mensual: data.precio,
      dias_trial: data.dias_prueba,
      features: data.caracteristicas?.map(c => c.texto) || [],
      activo: data.activo,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: plan.id, data: payload },
        {
          onSuccess: () => {
            showSuccess('Plan actualizado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar plan');
          },
        }
      );
    } else {
      mutation.mutate(payload, {
        onSuccess: () => {
          showSuccess('Plan creado correctamente');
          reset();
          onClose();
        },
        onError: (err) => {
          showError(err.message || 'Error al crear plan');
        },
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Plan' : 'Nuevo Plan'}
      subtitle={esEdicion ? 'Modifica los datos del plan' : 'Define los detalles del plan de suscripción'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Nombre */}
        <FormGroup label="Nombre del Plan" error={errors.nombre?.message} required>
          <Input
            {...register('nombre')}
            hasError={!!errors.nombre}
            placeholder="Ej: Plan Pro, Plan Empresarial"
          />
        </FormGroup>

        {/* Descripción */}
        <FormGroup label="Descripción" error={errors.descripcion?.message}>
          <Textarea
            {...register('descripcion')}
            rows={2}
            hasError={!!errors.descripcion}
            placeholder="Descripción breve del plan"
          />
        </FormGroup>

        {/* Precio y Ciclo */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Precio" error={errors.precio?.message} required>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('precio')}
              hasError={!!errors.precio}
              placeholder="249.00"
            />
          </FormGroup>

          <FormGroup label="Ciclo de Facturación" error={errors.ciclo_facturacion?.message} required>
            <Select {...register('ciclo_facturacion')} hasError={!!errors.ciclo_facturacion}>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </Select>
          </FormGroup>
        </div>

        {/* Días de Prueba */}
        <FormGroup
          label="Días de Prueba Gratis"
          error={errors.dias_prueba?.message}
          helper="Período de prueba antes del primer cobro (0-90 días)"
        >
          <Input
            type="number"
            min="0"
            max="90"
            {...register('dias_prueba')}
            hasError={!!errors.dias_prueba}
            placeholder="14"
          />
        </FormGroup>

        {/* Características */}
        <FormGroup label="Características del Plan">
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`caracteristicas.${index}.texto`)}
                  placeholder="Ej: Usuarios ilimitados"
                  hasError={!!errors.caracteristicas?.[index]?.texto}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ texto: '' })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar característica
            </Button>
          </div>
        </FormGroup>

        {/* Activo */}
        <Checkbox
          label="Plan activo (disponible para nuevas suscripciones)"
          {...register('activo')}
        />

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
            {esEdicion ? 'Actualizar' : 'Crear'} Plan
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default PlanFormDrawer;
