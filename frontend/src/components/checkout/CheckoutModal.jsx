import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CreditCard, Tag, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/organisms/Modal';
import { Button, Input, Badge } from '@/components/ui';
import { suscripcionesNegocioApi } from '@/services/api/modules/suscripciones-negocio.api';
import { formatCurrency, cn } from '@/lib/utils';
import { CICLO_LABELS } from '@/hooks/suscripciones-negocio';

/**
 * Modal de Checkout para suscripción a un plan
 *
 * @param {boolean} isOpen - Estado del modal
 * @param {Function} onClose - Callback para cerrar
 * @param {Object} plan - Plan seleccionado
 * @param {string} periodo - Período de facturación (mensual, trimestral, anual)
 */
function CheckoutModal({ isOpen, onClose, plan, periodo = 'mensual' }) {
  const [cuponCodigo, setCuponCodigo] = useState('');
  const [cuponValidado, setCuponValidado] = useState(null);
  const [cuponError, setCuponError] = useState(null);

  // Calcular precio base según período
  const calcularPrecioBase = useCallback(() => {
    if (!plan) return 0;
    switch (periodo) {
      case 'mensual':
        return parseFloat(plan.precio_mensual) || 0;
      case 'trimestral':
        return parseFloat(plan.precio_trimestral) || parseFloat(plan.precio_mensual) * 3 || 0;
      case 'semestral':
        return parseFloat(plan.precio_mensual) * 6 || 0;
      case 'anual':
        return parseFloat(plan.precio_anual) || parseFloat(plan.precio_mensual) * 12 || 0;
      default:
        return parseFloat(plan.precio_mensual) || 0;
    }
  }, [plan, periodo]);

  const precioBase = calcularPrecioBase();

  // Calcular descuento y precio final
  const descuento = cuponValidado?.descuento_calculado || 0;
  const precioFinal = Math.max(0, precioBase - descuento);

  // Mutation para validar cupón
  const validarCuponMutation = useMutation({
    mutationFn: (data) => suscripcionesNegocioApi.validarCupon(data),
    onSuccess: (res) => {
      const resultado = res.data?.data;
      if (resultado?.valido) {
        setCuponValidado(resultado);
        setCuponError(null);
      } else {
        setCuponValidado(null);
        setCuponError(resultado?.razon || 'Cupón no válido');
      }
    },
    onError: (error) => {
      setCuponValidado(null);
      setCuponError(error.response?.data?.message || 'Error validando cupón');
    },
  });

  // Mutation para iniciar checkout
  const iniciarCheckoutMutation = useMutation({
    mutationFn: (data) => suscripcionesNegocioApi.iniciarCheckout(data),
    onSuccess: (res) => {
      const resultado = res.data?.data;

      // Si hay init_point, redirigir a MercadoPago
      if (resultado?.init_point) {
        window.location.href = resultado.init_point;
      }
      // Si se activó directamente (cupón 100%), redirigir al callback
      else if (resultado?.redirect_url) {
        window.location.href = resultado.redirect_url;
      }
    },
  });

  // Manejar validación de cupón
  const handleValidarCupon = () => {
    if (!cuponCodigo.trim()) return;

    setCuponError(null);
    setCuponValidado(null);

    validarCuponMutation.mutate({
      codigo: cuponCodigo.trim().toUpperCase(),
      plan_id: plan.id,
      precio_base: precioBase,
    });
  };

  // Manejar inicio de pago
  const handlePagar = () => {
    iniciarCheckoutMutation.mutate({
      plan_id: plan.id,
      periodo,
      cupon_codigo: cuponValidado?.cupon?.codigo || undefined,
    });
  };

  // Limpiar cupón
  const handleLimpiarCupon = () => {
    setCuponCodigo('');
    setCuponValidado(null);
    setCuponError(null);
  };

  // Reset al cerrar
  const handleClose = () => {
    handleLimpiarCupon();
    onClose();
  };

  if (!plan) return null;

  const isLoading = iniciarCheckoutMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Confirmar Suscripción"
      size="sm"
      disableClose={isLoading}
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handlePagar}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar {formatCurrency(precioFinal)}
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Resumen del plan */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {plan.nombre}
            </h3>
            <Badge variant="info" size="sm">
              {CICLO_LABELS[periodo] || periodo}
            </Badge>
          </div>
          {plan.descripcion && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {plan.descripcion}
            </p>
          )}
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(precioBase)}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              /{periodo === 'mensual' ? 'mes' : periodo}
            </span>
          </div>
        </div>

        {/* Campo de cupón */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cupón de descuento (opcional)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={cuponCodigo}
                onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                placeholder="Ingresa tu cupón"
                className="pl-9"
                disabled={!!cuponValidado || validarCuponMutation.isPending}
              />
            </div>
            {cuponValidado ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLimpiarCupon}
              >
                Quitar
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleValidarCupon}
                disabled={!cuponCodigo.trim() || validarCuponMutation.isPending}
              >
                {validarCuponMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </Button>
            )}
          </div>

          {/* Estado del cupón */}
          {cuponValidado && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>
                Cupón "{cuponValidado.cupon.codigo}" aplicado:
                {cuponValidado.cupon.tipo_descuento === 'porcentaje'
                  ? ` -${cuponValidado.cupon.porcentaje_descuento}%`
                  : ` -${formatCurrency(cuponValidado.cupon.monto_descuento)}`}
              </span>
            </div>
          )}

          {cuponError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{cuponError}</span>
            </div>
          )}
        </div>

        {/* Resumen de precios */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-gray-100">
              {formatCurrency(precioBase)}
            </span>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Descuento</span>
              <span className="text-green-600 dark:text-green-400">
                -{formatCurrency(descuento)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-900 dark:text-gray-100">Total</span>
            <span className="text-primary-600 dark:text-primary-400">
              {formatCurrency(precioFinal)}
            </span>
          </div>
        </div>

        {/* Error de checkout */}
        {iniciarCheckoutMutation.isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                {iniciarCheckoutMutation.error?.response?.data?.message ||
                  'Error al procesar el pago. Intenta de nuevo.'}
              </span>
            </div>
          </div>
        )}

        {/* Nota de seguridad */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Serás redirigido a MercadoPago para completar el pago de forma segura.
        </p>
      </div>
    </Modal>
  );
}

CheckoutModal.displayName = 'CheckoutModal';

export default CheckoutModal;
