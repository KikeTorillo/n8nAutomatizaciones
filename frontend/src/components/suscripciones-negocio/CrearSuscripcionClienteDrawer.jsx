/**
 * ====================================================================
 * DRAWER: CREAR SUSCRIPCIÓN PARA CLIENTE
 * ====================================================================
 * Drawer para que admins creen links de checkout para sus clientes.
 *
 * Flujo:
 * 1. Seleccionar cliente (del CRM)
 * 2. Seleccionar plan
 * 3. Elegir período
 * 4. Aplicar cupón (opcional)
 * 5. Generar link
 *
 * @module components/suscripciones-negocio/CrearSuscripcionClienteDrawer
 */

import { useState, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Link as LinkIcon,
  Copy,
  CheckCircle,
  User,
  Package,
  Calendar,
  Tag,
  ExternalLink,
  Send,
} from 'lucide-react';

// Componentes UI
import { Drawer, Button, Input, LoadingSpinner } from '@/components/ui';

// Hooks
import {
  useCrearSuscripcionCliente,
  usePlanesActivos,
  useValidarCupon,
  CICLOS_FACTURACION,
  CICLO_LABELS,
} from '@/hooks/suscripciones-negocio';
import { useClientes } from '@/hooks/personas';

// Utils
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Schema de validación
const schema = z.object({
  cliente_id: z.number({
    required_error: 'Selecciona un cliente',
    invalid_type_error: 'Selecciona un cliente',
  }).positive('Selecciona un cliente'),
  plan_id: z.number({
    required_error: 'Selecciona un plan',
    invalid_type_error: 'Selecciona un plan',
  }).positive('Selecciona un plan'),
  periodo: z.enum(['mensual', 'trimestral', 'semestral', 'anual']).default('mensual'),
  cupon_codigo: z.string().optional(),
  notificar_cliente: z.boolean().default(true),
  dias_expiracion: z.number().min(1).max(30).default(7),
});

/**
 * Drawer para crear suscripción de cliente
 */
export function CrearSuscripcionClienteDrawer({ isOpen, onClose, onSuccess }) {
  // Estado local
  const [result, setResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [cuponValidado, setCuponValidado] = useState(null);
  const [searchCliente, setSearchCliente] = useState('');

  // Hooks
  const crearMutation = useCrearSuscripcionCliente();
  const validarCuponMutation = useValidarCupon();

  // Queries
  const { data: planesData, isLoading: loadingPlanes } = usePlanesActivos();
  const { data: clientesData, isLoading: loadingClientes } = useClientes({
    page: 1,
    limit: 50,
    busqueda: searchCliente || undefined,
    activo: true,
  });

  // Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      periodo: 'mensual',
      notificar_cliente: true,
      dias_expiracion: 7,
    },
  });

  const watchPlanId = watch('plan_id');
  const watchPeriodo = watch('periodo');
  const watchCupon = watch('cupon_codigo');
  const watchDiasExpiracion = watch('dias_expiracion');

  // Obtener plan seleccionado
  const planSeleccionado = planesData?.find(p => p.id === watchPlanId);

  // Calcular precio
  const calcularPrecio = useCallback(() => {
    if (!planSeleccionado) return 0;

    let precio;
    switch (watchPeriodo) {
      case 'mensual':
        precio = parseFloat(planSeleccionado.precio_mensual);
        break;
      case 'trimestral':
        precio = parseFloat(planSeleccionado.precio_trimestral) || parseFloat(planSeleccionado.precio_mensual) * 3;
        break;
      case 'semestral':
        precio = parseFloat(planSeleccionado.precio_mensual) * 6;
        break;
      case 'anual':
        precio = parseFloat(planSeleccionado.precio_anual) || parseFloat(planSeleccionado.precio_mensual) * 12;
        break;
      default:
        precio = parseFloat(planSeleccionado.precio_mensual);
    }

    return precio;
  }, [planSeleccionado, watchPeriodo]);

  const precioBase = calcularPrecio();
  const descuento = cuponValidado?.descuento_calculado || 0;
  const precioFinal = Math.max(0, precioBase - descuento);

  // Validar cupón
  const handleValidarCupon = useCallback(async () => {
    if (!watchCupon || !watchPlanId) return;

    try {
      const result = await validarCuponMutation.mutateAsync({
        codigo: watchCupon,
        plan_id: watchPlanId,
        precio_base: precioBase,
      });

      if (result.valido) {
        setCuponValidado(result);
        toast.success(`Cupón válido: ${result.cupon.nombre}`);
      } else {
        setCuponValidado(null);
        toast.error(result.razon || 'Cupón no válido');
      }
    } catch (error) {
      setCuponValidado(null);
      toast.error('Error al validar cupón');
    }
  }, [watchCupon, watchPlanId, precioBase, validarCuponMutation]);

  // Resetear cupón cuando cambia plan o período
  useEffect(() => {
    setCuponValidado(null);
  }, [watchPlanId, watchPeriodo]);

  // Submit
  const onSubmit = async (data) => {
    try {
      const response = await crearMutation.mutateAsync(data);
      setResult(response);
      toast.success('Link de checkout generado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al generar link');
    }
  };

  // Copiar link
  const handleCopyLink = useCallback(async () => {
    if (!result?.checkout_url) return;

    try {
      await navigator.clipboard.writeText(result.checkout_url);
      setCopiedLink(true);
      toast.success('Link copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  }, [result]);

  // Cerrar y resetear
  const handleClose = useCallback(() => {
    reset();
    setResult(null);
    setCuponValidado(null);
    setSearchCliente('');
    onClose();
  }, [reset, onClose]);

  // Éxito
  const handleSuccess = useCallback(() => {
    if (onSuccess) onSuccess();
    handleClose();
  }, [onSuccess, handleClose]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={result ? 'Link de Checkout Generado' : 'Crear Suscripción para Cliente'}
      size="md"
    >
      {result ? (
        // Pantalla de éxito
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Link generado exitosamente
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Envía este link a tu cliente para que complete el pago
            </p>
          </div>

          {/* Info del checkout */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Cliente:</span>
              <span className="font-medium text-gray-900 dark:text-white">{result.cliente?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Plan:</span>
              <span className="font-medium text-gray-900 dark:text-white">{result.plan?.nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Precio:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${result.precio?.final?.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {result.precio?.moneda}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Expira:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {format(new Date(result.expira_en), "dd 'de' MMMM, yyyy", { locale: es })}
              </span>
            </div>
          </div>

          {/* Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link de pago
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={result.checkout_url}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-mono"
              />
              <Button onClick={handleCopyLink} variant={copiedLink ? 'success' : 'secondary'}>
                {copiedLink ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => window.open(result.checkout_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Link
            </Button>
            <Button className="flex-1" onClick={handleSuccess}>
              Listo
            </Button>
          </div>
        </div>
      ) : (
        // Formulario
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Cliente *
            </label>
            <Controller
              name="cliente_id"
              control={control}
              render={({ field }) => (
                <div>
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={searchCliente}
                    onChange={(e) => setSearchCliente(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm mb-2"
                  />
                  <select
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                    disabled={loadingClientes}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientesData?.items?.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} - {cliente.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            />
            {errors.cliente_id && (
              <p className="mt-1 text-sm text-red-600">{errors.cliente_id.message}</p>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Package className="h-4 w-4 inline mr-2" />
              Plan *
            </label>
            <Controller
              name="plan_id"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                  disabled={loadingPlanes}
                >
                  <option value="">Seleccionar plan</option>
                  {planesData?.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre} - ${parseFloat(plan.precio_mensual).toLocaleString('es-MX')}/mes
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.plan_id && (
              <p className="mt-1 text-sm text-red-600">{errors.plan_id.message}</p>
            )}
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Período de facturación
            </label>
            <select
              {...register('periodo')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              {Object.entries(CICLO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Cupón */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="h-4 w-4 inline mr-2" />
              Cupón de descuento (opcional)
            </label>
            <div className="flex gap-2">
              <input
                {...register('cupon_codigo')}
                type="text"
                placeholder="CODIGO"
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm uppercase"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleValidarCupon}
                disabled={!watchCupon || !watchPlanId || validarCuponMutation.isPending}
              >
                Validar
              </Button>
            </div>
            {cuponValidado && (
              <p className="mt-1 text-sm text-green-600">
                {cuponValidado.cupon.nombre}: -${descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Días de expiración */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Validez del link (días)
            </label>
            <input
              {...register('dias_expiracion', { valueAsNumber: true })}
              type="number"
              min={1}
              max={30}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              El link expirará el {format(addDays(new Date(), watchDiasExpiracion || 7), "dd 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>

          {/* Notificar cliente */}
          <div className="flex items-center">
            <input
              {...register('notificar_cliente')}
              type="checkbox"
              id="notificar"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="notificar" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Enviar link por email al cliente
            </label>
          </div>

          {/* Resumen de precio */}
          {planSeleccionado && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Precio base:</span>
                <span>${precioBase.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>-${descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span className="text-primary-600">
                  ${precioFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || crearMutation.isPending}
              className="flex-1"
            >
              {crearMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              Generar Link
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  );
}

export default CrearSuscripcionClienteDrawer;
