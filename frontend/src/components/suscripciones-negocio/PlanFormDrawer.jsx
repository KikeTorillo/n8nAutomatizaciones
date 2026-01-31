import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  FormGroup,
  Input,
  Textarea,
} from '@/components/ui';
import { useCrearPlan, useActualizarPlan } from '@/hooks/suscripciones-negocio';
import { useToast } from '@/hooks/utils';
import { formatCurrency } from '@/lib/utils';

/**
 * Schema de validación Zod
 */
const planSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  precio_mensual: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  precio_trimestral: z.coerce.number().min(0, 'El precio no puede ser negativo').nullable().optional(),
  precio_semestral: z.coerce.number().min(0, 'El precio no puede ser negativo').nullable().optional(),
  precio_anual: z.coerce.number().min(0, 'El precio no puede ser negativo').nullable().optional(),
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
      precio_mensual: 0,
      precio_trimestral: null,
      precio_semestral: null,
      precio_anual: null,
      dias_prueba: 14,
      caracteristicas: [],
      activo: true,
    },
  });

  // Observar precio mensual para cálculo de descuentos
  const precioMensual = useWatch({ control, name: 'precio_mensual' });
  const precioTrimestral = useWatch({ control, name: 'precio_trimestral' });
  const precioSemestral = useWatch({ control, name: 'precio_semestral' });
  const precioAnual = useWatch({ control, name: 'precio_anual' });

  // Calcular info de descuento
  const calcularInfoDescuento = useMemo(() => {
    const mensual = parseFloat(precioMensual) || 0;
    if (mensual <= 0) return { trimestral: null, semestral: null, anual: null };

    const calcular = (precio, meses) => {
      const precioValor = parseFloat(precio);
      if (!precioValor || precioValor <= 0) return null;
      const sinDescuento = mensual * meses;
      const ahorro = sinDescuento - precioValor;
      const porcentaje = (ahorro / sinDescuento) * 100;
      const precioMensualEquiv = precioValor / meses;
      return {
        sinDescuento,
        ahorro: ahorro > 0 ? ahorro : 0,
        porcentaje: porcentaje > 0 ? porcentaje.toFixed(0) : 0,
        precioMensualEquiv,
      };
    };

    return {
      trimestral: calcular(precioTrimestral, 3),
      semestral: calcular(precioSemestral, 6),
      anual: calcular(precioAnual, 12),
    };
  }, [precioMensual, precioTrimestral, precioSemestral, precioAnual]);

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
        precio_mensual: plan.precio_mensual || plan.precio || 0,
        precio_trimestral: plan.precio_trimestral || null,
        precio_semestral: plan.precio_semestral || null,
        precio_anual: plan.precio_anual || null,
        dias_prueba: plan.dias_trial ?? plan.dias_prueba ?? 0,
        caracteristicas: caracteristicasArray,
        activo: plan.activo ?? true,
      });
    } else {
      reset({
        nombre: '',
        descripcion: '',
        precio_mensual: 0,
        precio_trimestral: null,
        precio_semestral: null,
        precio_anual: null,
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

    // Sanitizar precios opcionales (convertir 0, "" a null para que el backend lo actualice)
    const sanitizarPrecioOpcional = (valor) => {
      const num = parseFloat(valor);
      return !isNaN(num) && num > 0 ? num : null;
    };

    // Mapear campos del frontend a los nombres del backend
    const payload = {
      codigo: esEdicion ? undefined : generarCodigo(data.nombre),
      nombre: data.nombre,
      descripcion: data.descripcion || undefined,
      precio_mensual: data.precio_mensual,
      precio_trimestral: sanitizarPrecioOpcional(data.precio_trimestral),
      precio_semestral: sanitizarPrecioOpcional(data.precio_semestral),
      precio_anual: sanitizarPrecioOpcional(data.precio_anual),
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

        {/* Precios por Periodo */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Precios por Periodo
          </h4>

          {/* Precio Mensual (requerido) */}
          <FormGroup label="Precio Mensual" error={errors.precio_mensual?.message} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('precio_mensual')}
                hasError={!!errors.precio_mensual}
                placeholder="249.00"
                className="pl-7"
              />
            </div>
          </FormGroup>

          {/* Precio Trimestral (opcional) */}
          <FormGroup
            label="Precio Trimestral"
            error={errors.precio_trimestral?.message}
            helper={precioMensual > 0 ? `Sin descuento: ${formatCurrency(precioMensual * 3)}` : undefined}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('precio_trimestral')}
                hasError={!!errors.precio_trimestral}
                placeholder="Dejar vacío para no ofrecer"
                className="pl-7"
              />
            </div>
            {calcularInfoDescuento.trimestral && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Equivale a {formatCurrency(calcularInfoDescuento.trimestral.precioMensualEquiv)}/mes
                {calcularInfoDescuento.trimestral.porcentaje > 0 && (
                  <span className="ml-1 font-medium">
                    (Ahorro: {calcularInfoDescuento.trimestral.porcentaje}%)
                  </span>
                )}
              </p>
            )}
          </FormGroup>

          {/* Precio Semestral (opcional) */}
          <FormGroup
            label="Precio Semestral"
            error={errors.precio_semestral?.message}
            helper={precioMensual > 0 ? `Sin descuento: ${formatCurrency(precioMensual * 6)}` : undefined}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('precio_semestral')}
                hasError={!!errors.precio_semestral}
                placeholder="Dejar vacío para no ofrecer"
                className="pl-7"
              />
            </div>
            {calcularInfoDescuento.semestral && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Equivale a {formatCurrency(calcularInfoDescuento.semestral.precioMensualEquiv)}/mes
                {calcularInfoDescuento.semestral.porcentaje > 0 && (
                  <span className="ml-1 font-medium">
                    (Ahorro: {calcularInfoDescuento.semestral.porcentaje}%)
                  </span>
                )}
              </p>
            )}
          </FormGroup>

          {/* Precio Anual (opcional) */}
          <FormGroup
            label="Precio Anual"
            error={errors.precio_anual?.message}
            helper={precioMensual > 0 ? `Sin descuento: ${formatCurrency(precioMensual * 12)}` : undefined}
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register('precio_anual')}
                hasError={!!errors.precio_anual}
                placeholder="Dejar vacío para no ofrecer"
                className="pl-7"
              />
            </div>
            {calcularInfoDescuento.anual && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Equivale a {formatCurrency(calcularInfoDescuento.anual.precioMensualEquiv)}/mes
                {calcularInfoDescuento.anual.porcentaje > 0 && (
                  <span className="ml-1 font-medium">
                    (Ahorro: {calcularInfoDescuento.anual.porcentaje}%)
                  </span>
                )}
              </p>
            )}
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
