import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  FormGroup,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { useCrearCupon, useActualizarCupon, TIPOS_DESCUENTO, usePlanesActivos } from '@/hooks/suscripciones-negocio';
import { useToast } from '@/hooks/utils';

/**
 * Schema de validación Zod
 */
const cuponSchema = z.object({
  codigo: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9_-]+$/, 'Solo mayúsculas, números, guiones y guiones bajos'),
  descripcion: z.string().max(200, 'Máximo 200 caracteres').optional(),
  tipo_descuento: z.enum(['porcentaje', 'monto_fijo']),
  valor_descuento: z.coerce.number().min(0.01, 'El valor debe ser mayor a 0'),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  max_usos: z.coerce.number().min(0, 'No puede ser negativo').optional(),
  max_usos_por_cliente: z.coerce.number().min(0, 'No puede ser negativo').optional(),
  plan_ids: z.array(z.string()).optional(),
  activo: z.boolean().default(true),
}).refine((data) => {
  if (data.tipo_descuento === 'porcentaje' && data.valor_descuento > 100) {
    return false;
  }
  return true;
}, {
  message: 'El porcentaje no puede ser mayor a 100%',
  path: ['valor_descuento'],
});

/**
 * Genera un código aleatorio
 */
function generarCodigo() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

/**
 * Drawer para crear/editar cupones de descuento
 */
function CuponFormDrawer({ isOpen, onClose, cupon = null, mode = 'create' }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && cupon;

  // Queries
  const { data: planes = [] } = usePlanesActivos();

  // Mutations
  const crearMutation = useCrearCupon();
  const actualizarMutation = useActualizarCupon();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(cuponSchema),
    defaultValues: {
      codigo: '',
      descripcion: '',
      tipo_descuento: TIPOS_DESCUENTO.PORCENTAJE,
      valor_descuento: 10,
      fecha_inicio: '',
      fecha_fin: '',
      max_usos: '',
      max_usos_por_cliente: 1,
      plan_ids: [],
      activo: true,
    },
  });

  const tipoDescuento = watch('tipo_descuento');

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && cupon) {
      reset({
        codigo: cupon.codigo || '',
        descripcion: cupon.descripcion || '',
        tipo_descuento: cupon.tipo_descuento || TIPOS_DESCUENTO.PORCENTAJE,
        valor_descuento: cupon.valor_descuento || 0,
        fecha_inicio: cupon.fecha_inicio?.split('T')[0] || '',
        fecha_fin: cupon.fecha_fin?.split('T')[0] || '',
        max_usos: cupon.max_usos || '',
        max_usos_por_cliente: cupon.max_usos_por_cliente || 1,
        plan_ids: cupon.plan_ids?.map(String) || [],
        activo: cupon.activo ?? true,
      });
    } else {
      reset({
        codigo: generarCodigo(),
        descripcion: '',
        tipo_descuento: TIPOS_DESCUENTO.PORCENTAJE,
        valor_descuento: 10,
        fecha_inicio: '',
        fecha_fin: '',
        max_usos: '',
        max_usos_por_cliente: 1,
        plan_ids: [],
        activo: true,
      });
    }
  }, [esEdicion, cupon, reset]);

  // Submit handler
  const onSubmit = (data) => {
    const payload = {
      codigo: data.codigo.toUpperCase(),
      descripcion: data.descripcion || undefined,
      tipo_descuento: data.tipo_descuento,
      valor_descuento: data.valor_descuento,
      fecha_inicio: data.fecha_inicio || undefined,
      fecha_fin: data.fecha_fin || undefined,
      max_usos: data.max_usos ? parseInt(data.max_usos) : undefined,
      max_usos_por_cliente: data.max_usos_por_cliente || undefined,
      plan_ids: data.plan_ids?.map(Number).filter(Boolean) || undefined,
      activo: data.activo,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: cupon.id, data: payload },
        {
          onSuccess: () => {
            showSuccess('Cupón actualizado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar cupón');
          },
        }
      );
    } else {
      mutation.mutate(payload, {
        onSuccess: () => {
          showSuccess('Cupón creado correctamente');
          reset();
          onClose();
        },
        onError: (err) => {
          showError(err.message || 'Error al crear cupón');
        },
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Cupón' : 'Nuevo Cupón'}
      subtitle={esEdicion ? 'Modifica los datos del cupón' : 'Crea un cupón de descuento'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Código */}
        <FormGroup label="Código del Cupón" error={errors.codigo?.message} required>
          <div className="flex gap-2">
            <Input
              {...register('codigo')}
              hasError={!!errors.codigo}
              placeholder="VERANO2026"
              className="flex-1 font-mono uppercase"
              disabled={esEdicion}
            />
            {!esEdicion && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setValue('codigo', generarCodigo())}
                title="Generar código aleatorio"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </FormGroup>

        {/* Descripción */}
        <FormGroup label="Descripción" error={errors.descripcion?.message}>
          <Textarea
            {...register('descripcion')}
            rows={2}
            hasError={!!errors.descripcion}
            placeholder="Descripción interna del cupón"
          />
        </FormGroup>

        {/* Tipo y Valor de Descuento */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Tipo de Descuento" error={errors.tipo_descuento?.message} required>
            <Select {...register('tipo_descuento')} hasError={!!errors.tipo_descuento}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="monto_fijo">Monto Fijo ($)</option>
            </Select>
          </FormGroup>

          <FormGroup
            label={tipoDescuento === 'porcentaje' ? 'Porcentaje' : 'Monto'}
            error={errors.valor_descuento?.message}
            required
          >
            <Input
              type="number"
              step={tipoDescuento === 'porcentaje' ? '1' : '0.01'}
              min="0"
              max={tipoDescuento === 'porcentaje' ? '100' : undefined}
              {...register('valor_descuento')}
              hasError={!!errors.valor_descuento}
              placeholder={tipoDescuento === 'porcentaje' ? '10' : '50.00'}
            />
          </FormGroup>
        </div>

        {/* Fechas de Vigencia */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Fecha Inicio" error={errors.fecha_inicio?.message}>
            <Input
              type="date"
              {...register('fecha_inicio')}
              hasError={!!errors.fecha_inicio}
            />
          </FormGroup>

          <FormGroup label="Fecha Fin" error={errors.fecha_fin?.message}>
            <Input
              type="date"
              {...register('fecha_fin')}
              hasError={!!errors.fecha_fin}
            />
          </FormGroup>
        </div>

        {/* Límites de Uso */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup
            label="Máx. Usos Totales"
            error={errors.max_usos?.message}
            helper="Dejar vacío para ilimitado"
          >
            <Input
              type="number"
              min="0"
              {...register('max_usos')}
              hasError={!!errors.max_usos}
              placeholder="100"
            />
          </FormGroup>

          <FormGroup
            label="Máx. Usos por Cliente"
            error={errors.max_usos_por_cliente?.message}
          >
            <Input
              type="number"
              min="1"
              {...register('max_usos_por_cliente')}
              hasError={!!errors.max_usos_por_cliente}
              placeholder="1"
            />
          </FormGroup>
        </div>

        {/* Planes Aplicables */}
        {planes.length > 0 && (
          <FormGroup
            label="Aplica a Planes"
            helper="Dejar vacío para aplicar a todos los planes"
          >
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              {planes.map((plan) => (
                <label key={plan.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={plan.id}
                    {...register('plan_ids')}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{plan.nombre}</span>
                </label>
              ))}
            </div>
          </FormGroup>
        )}

        {/* Activo */}
        <Checkbox
          label="Cupón activo"
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
            {esEdicion ? 'Actualizar' : 'Crear'} Cupón
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default CuponFormDrawer;
