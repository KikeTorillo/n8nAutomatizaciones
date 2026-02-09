import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tag, Check, X } from 'lucide-react';
import {
  Button,
  Drawer,
  FormGroup,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import {
  useCrearSuscripcion,
  useActualizarSuscripcion,
  usePlanesActivos,
  useValidarCupon,
  METODOS_PAGO,
} from '@/hooks/suscripciones-negocio';
import { useClientes } from '@/hooks/personas';
import { useToast } from '@/hooks/utils';
import { formatCurrency } from '@/lib/utils';

/**
 * Schema de validación Zod
 */
const suscripcionSchema = z.object({
  cliente_id: z.string().min(1, 'El cliente es requerido'),
  plan_id: z.string().min(1, 'El plan es requerido'),
  cupon_codigo: z.string().optional(),
  metodo_pago: z.string().optional(),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

/**
 * Drawer para crear/editar suscripciones
 */
function SuscripcionFormDrawer({ isOpen, onClose, suscripcion = null, mode = 'create' }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && suscripcion;
  const [cuponValidado, setCuponValidado] = useState(null);

  // Queries
  const { data: planes = [] } = usePlanesActivos();
  const { data: clientesData } = useClientes({ activo: true, limit: 100 });
  const clientes = clientesData?.items || [];

  // Mutations
  const crearMutation = useCrearSuscripcion();
  const actualizarMutation = useActualizarSuscripcion();
  const validarCuponMutation = useValidarCupon();
  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm({
    resolver: zodResolver(suscripcionSchema),
    defaultValues: {
      cliente_id: '',
      plan_id: '',
      cupon_codigo: '',
      metodo_pago: '',
      notas: '',
    },
  });

  const planId = watch('plan_id');
  const cuponCodigo = watch('cupon_codigo');
  const planSeleccionado = planes.find(p => p.id.toString() === planId);

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && suscripcion) {
      reset({
        cliente_id: suscripcion.cliente_id?.toString() || '',
        plan_id: suscripcion.plan_id?.toString() || '',
        cupon_codigo: '',
        metodo_pago: suscripcion.metodo_pago || '',
        notas: suscripcion.notas || '',
      });
    } else {
      reset({
        cliente_id: '',
        plan_id: '',
        cupon_codigo: '',
        metodo_pago: '',
        notas: '',
      });
      setCuponValidado(null);
    }
  }, [esEdicion, suscripcion, reset]);

  // Validar cupón
  const handleValidarCupon = async () => {
    if (!cuponCodigo || !planId) return;

    try {
      const result = await validarCuponMutation.mutateAsync({
        codigo: cuponCodigo,
        plan_id: parseInt(planId),
      });

      if (result.valido) {
        setCuponValidado(result);
        showSuccess('Cupón válido aplicado');
      } else {
        setCuponValidado(null);
        showError(result.mensaje || 'Cupón inválido');
      }
    } catch {
      setCuponValidado(null);
      showError('Error al validar cupón');
    }
  };

  // Limpiar cupón validado cuando cambia el plan
  useEffect(() => {
    setCuponValidado(null);
  }, [planId]);

  // Submit handler
  const onSubmit = (data) => {
    const payload = {
      cliente_id: parseInt(data.cliente_id),
      plan_id: parseInt(data.plan_id),
      cupon_codigo: cuponValidado ? data.cupon_codigo : undefined,
      metodo_pago: data.metodo_pago || undefined,
      notas: data.notas || undefined,
    };

    if (esEdicion) {
      // Para edición solo actualizamos algunos campos
      mutation.mutate(
        { id: suscripcion.id, data: { notas: payload.notas } },
        {
          onSuccess: () => {
            showSuccess('Suscripción actualizada correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar suscripción');
          },
        }
      );
    } else {
      mutation.mutate(payload, {
        onSuccess: () => {
          showSuccess('Suscripción creada correctamente');
          reset();
          setCuponValidado(null);
          onClose();
        },
        onError: (err) => {
          showError(err.message || 'Error al crear suscripción');
        },
      });
    }
  };

  // Calcular precio final
  const precioOriginal = planSeleccionado?.precio || 0;
  const descuento = cuponValidado?.descuento_calculado || 0;
  const precioFinal = Math.max(0, precioOriginal - descuento);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Suscripción' : 'Nueva Suscripción'}
      subtitle={esEdicion ? 'Modifica los datos de la suscripción' : 'Crea una nueva suscripción'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Cliente */}
        <FormGroup label="Cliente" error={errors.cliente_id?.message} required>
          <Select
            {...register('cliente_id')}
            hasError={!!errors.cliente_id}
            disabled={esEdicion}
          >
            <option value="">Seleccionar cliente...</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellidos} {cliente.email && `(${cliente.email})`}
              </option>
            ))}
          </Select>
        </FormGroup>

        {/* Plan */}
        <FormGroup label="Plan de Suscripción" error={errors.plan_id?.message} required>
          <Select
            {...register('plan_id')}
            hasError={!!errors.plan_id}
            disabled={esEdicion}
          >
            <option value="">Seleccionar plan...</option>
            {planes.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.nombre} - {formatCurrency(plan.precio)}/{plan.ciclo_facturacion}
              </option>
            ))}
          </Select>
        </FormGroup>

        {/* Resumen del Plan */}
        {planSeleccionado && !esEdicion && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Precio del plan:</span>
              <span className="font-medium">{formatCurrency(precioOriginal)}</span>
            </div>
            {cuponValidado && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Descuento ({cuponValidado.cupon?.codigo}):</span>
                <span>-{formatCurrency(descuento)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-semibold">Total a pagar:</span>
              <span className="font-bold text-lg">{formatCurrency(precioFinal)}</span>
            </div>
            {planSeleccionado.dias_prueba > 0 && (
              <p className="text-xs text-primary-600 dark:text-primary-400">
                * Primer cobro después de {planSeleccionado.dias_prueba} días de prueba
              </p>
            )}
          </div>
        )}

        {/* Cupón */}
        {!esEdicion && (
          <FormGroup label="Código de Cupón" helper="Opcional - Aplica descuento a la suscripción">
            <div className="flex gap-2">
              <Input
                {...register('cupon_codigo')}
                placeholder="DESCUENTO20"
                className="flex-1 font-mono uppercase"
                disabled={!planId}
              />
              <Button
                type="button"
                variant={cuponValidado ? 'success' : 'outline'}
                onClick={handleValidarCupon}
                disabled={!cuponCodigo || !planId || validarCuponMutation.isPending}
                isLoading={validarCuponMutation.isPending}
              >
                {cuponValidado ? <Check className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
              </Button>
              {cuponValidado && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCuponValidado(null);
                    setValue('cupon_codigo', '');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </FormGroup>
        )}

        {/* Método de Pago */}
        {!esEdicion && (
          <FormGroup label="Método de Pago">
            <Select {...register('metodo_pago')}>
              <option value="">Seleccionar método...</option>
              <option value={METODOS_PAGO.STRIPE}>Stripe (Tarjeta)</option>
              <option value={METODOS_PAGO.MERCADOPAGO}>MercadoPago</option>
              <option value={METODOS_PAGO.TRANSFERENCIA}>Transferencia</option>
              <option value={METODOS_PAGO.EFECTIVO}>Efectivo</option>
              <option value={METODOS_PAGO.OTRO}>Otro</option>
            </Select>
          </FormGroup>
        )}

        {/* Notas */}
        <FormGroup label="Notas" error={errors.notas?.message}>
          <Textarea
            {...register('notas')}
            rows={2}
            hasError={!!errors.notas}
            placeholder="Notas internas sobre la suscripción"
          />
        </FormGroup>

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
            {esEdicion ? 'Actualizar' : 'Crear'} Suscripción
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default SuscripcionFormDrawer;
