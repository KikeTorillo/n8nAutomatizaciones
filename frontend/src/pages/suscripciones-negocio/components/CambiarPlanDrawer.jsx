/**
 * ====================================================================
 * CAMBIAR PLAN DRAWER
 * ====================================================================
 *
 * Drawer para cambiar el plan de una suscripción activa.
 * Muestra planes disponibles y calcula diferencia de precio.
 *
 * ====================================================================
 */

import { useState, useMemo } from 'react';
import {
  Check,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Star,
} from 'lucide-react';
import {
  Drawer,
  Button,
  Badge,
  LoadingSpinner,
} from '@/components/ui';
import {
  usePlanesPublicos,
  useCambiarPlanSuscripcion,
  useCambiarMiPlan,
  useCalcularProrrateo,
  CICLO_LABELS,
  CICLO_MESES,
} from '@/hooks/suscripciones-negocio';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { useToast } from '@/hooks/utils';
import { formatCurrency, cn } from '@/lib/utils';
import ProrrateoResumen from './ProrrateoResumen';

/**
 * Calcula el precio total de un plan según el periodo seleccionado
 * @param {Object} plan - El plan
 * @param {string} periodo - El periodo (mensual, trimestral, semestral, anual)
 * @returns {number} Precio total del periodo
 */
function calcularPrecioPorPeriodo(plan, periodo) {
  if (!plan) return 0;

  // Mapeo de periodo a campo de precio
  const campoDirecto = {
    mensual: 'precio_mensual',
    trimestral: 'precio_trimestral',
    semestral: 'precio_semestral',
    anual: 'precio_anual',
  }[periodo];

  const precioDirecto = parseFloat(plan[campoDirecto]);
  if (!isNaN(precioDirecto) && precioDirecto > 0) {
    return precioDirecto;
  }

  // Fallback: multiplicar precio mensual por meses
  const meses = CICLO_MESES[periodo] || 1;
  return (parseFloat(plan.precio_mensual) || 0) * meses;
}

/**
 * Calcula el precio mensual equivalente de un plan según el periodo
 * @param {Object} plan - El plan
 * @param {string} periodo - El periodo
 * @returns {number} Precio mensual equivalente
 */
function calcularPrecioMensualEquivalente(plan, periodo) {
  const precioTotal = calcularPrecioPorPeriodo(plan, periodo);
  const meses = CICLO_MESES[periodo] || 1;
  return precioTotal / meses;
}

/**
 * Verifica si un plan tiene precio configurado para un periodo
 * @param {Object} plan - El plan
 * @param {string} periodo - El periodo
 * @returns {boolean}
 */
function planTienePrecio(plan, periodo) {
  if (!plan) return false;
  if (periodo === 'mensual') return true;

  const campoDirecto = {
    trimestral: 'precio_trimestral',
    semestral: 'precio_semestral',
    anual: 'precio_anual',
  }[periodo];

  const precioDirecto = parseFloat(plan[campoDirecto]);
  return !isNaN(precioDirecto) && precioDirecto > 0;
}

/**
 * Card individual de plan para selección
 */
function PlanSeleccionCard({ plan, planActualId, onSelect, isSelected, periodoSeleccionado = 'mensual' }) {
  const esActual = plan.id === planActualId;
  const precioMensualEquiv = calcularPrecioMensualEquivalente(plan, periodoSeleccionado);
  const precioTotal = calcularPrecioPorPeriodo(plan, periodoSeleccionado);
  const meses = CICLO_MESES[periodoSeleccionado] || 1;
  const features = plan.features || plan.caracteristicas || [];

  return (
    <div
      onClick={() => !esActual && onSelect(plan)}
      className={cn(
        'relative rounded-lg border-2 p-4 transition-all cursor-pointer',
        esActual
          ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-default'
          : isSelected
            ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 bg-white dark:bg-gray-800'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
      )}
    >
      {/* Badge plan actual */}
      {esActual && (
        <div className="absolute -top-2.5 left-4">
          <Badge variant="default" size="sm">Plan Actual</Badge>
        </div>
      )}

      {/* Badge destacado */}
      {plan.destacado && !esActual && (
        <div className="absolute -top-2.5 right-4">
          <Badge variant="primary" size="sm" className="gap-1">
            <Star className="w-3 h-3 fill-current" />
            Recomendado
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className={cn(
            'font-semibold',
            esActual ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
          )}>
            {plan.nombre}
          </h4>
          {plan.descripcion && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {plan.descripcion}
            </p>
          )}

          {/* Features resumidos */}
          {features.length > 0 && (
            <div className="mt-3 space-y-1">
              {features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className={cn(
                    'w-4 h-4 flex-shrink-0',
                    esActual ? 'text-gray-400' : 'text-green-500'
                  )} />
                  <span className={cn(
                    'text-xs',
                    esActual ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'
                  )}>
                    {feature}
                  </span>
                </div>
              ))}
              {features.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{features.length - 3} features
                </span>
              )}
            </div>
          )}
        </div>

        {/* Precio */}
        <div className="text-right">
          <div className={cn(
            'text-xl font-bold',
            esActual ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
          )}>
            {formatCurrency(precioMensualEquiv)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            /mes
          </div>
          {meses > 1 && (
            <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">
              Total: {formatCurrency(precioTotal)}/{CICLO_LABELS[periodoSeleccionado]?.toLowerCase()}
            </div>
          )}
        </div>
      </div>

      {/* Indicador de selección */}
      {isSelected && !esActual && (
        <div className="absolute top-4 right-4">
          <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Resumen del cambio de plan
 */
function ResumenCambio({ planActual, planNuevo, periodoSeleccionado = 'mensual' }) {
  if (!planActual || !planNuevo) return null;

  const precioActual = planActual.precio_actual || planActual.precio_mensual || 0;
  const precioNuevoMensual = calcularPrecioMensualEquivalente(planNuevo, periodoSeleccionado);
  const diferencia = precioNuevoMensual - precioActual;

  const esUpgrade = diferencia > 0;
  const esDowngrade = diferencia < 0;
  const esMismoPrecio = diferencia === 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-gray-100">
        Resumen del cambio
      </h4>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Plan actual</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(precioActual)}/mes
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">Nuevo plan ({CICLO_LABELS[periodoSeleccionado]})</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(precioNuevoMensual)}/mes
        </span>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex items-center justify-between">
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Diferencia
        </span>
        <div className="flex items-center gap-2">
          {esUpgrade && (
            <>
              <ArrowUp className="w-4 h-4 text-green-500" />
              <span className="font-bold text-green-600 dark:text-green-400">
                +{formatCurrency(diferencia)}
              </span>
              <Badge variant="success" size="sm">Upgrade</Badge>
            </>
          )}
          {esDowngrade && (
            <>
              <ArrowDown className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(diferencia)}
              </span>
              <Badge variant="warning" size="sm">Downgrade</Badge>
            </>
          )}
          {esMismoPrecio && (
            <>
              <Minus className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-gray-600 dark:text-gray-400">
                {formatCurrency(0)}
              </span>
            </>
          )}
        </div>
      </div>

      {esDowngrade && (
        <div className="flex items-start gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Al hacer downgrade, algunas funciones pueden no estar disponibles.
            El cambio se aplicará en tu próximo ciclo de facturación.
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Drawer principal para cambiar plan
 * @param {boolean} isUserPage - Si true, usa endpoint de usuario (sin permisos admin)
 */
function CambiarPlanDrawer({ isOpen, onClose, suscripcion, onSuccess, isUserPage = false }) {
  const { error: showError, success } = useToast();

  // State
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mensual');
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Queries
  const { data: planes, isLoading: loadingPlanes } = usePlanesPublicos();

  // Query de prorrateo (solo se activa cuando hay plan seleccionado y es página de usuario)
  const {
    data: prorrateo,
    isLoading: loadingProrrateo,
    error: errorProrrateo,
  } = useCalcularProrrateo(planSeleccionado?.id, {
    enabled: isUserPage && !!planSeleccionado && planSeleccionado.id !== suscripcion?.plan_id,
  });

  // Mutations - usar hook apropiado según contexto
  const cambiarPlanAdminMutation = useCambiarPlanSuscripcion();
  const cambiarMiPlanMutation = useCambiarMiPlan();
  const cambiarPlanMutation = isUserPage ? cambiarMiPlanMutation : cambiarPlanAdminMutation;

  // Planes disponibles (el endpoint /publicos ya retorna solo activos)
  const planesDisponibles = useMemo(() => {
    if (!planes) return [];
    return planes;
  }, [planes]);

  // Determinar si es un upgrade de pago (requiere checkout)
  const esUpgradePago = useMemo(() => {
    if (!planSeleccionado || !suscripcion) return false;
    const precioActual = parseFloat(suscripcion.precio_actual || 0);
    const precioNuevoMensual = calcularPrecioMensualEquivalente(planSeleccionado, periodoSeleccionado);
    return precioNuevoMensual > precioActual && precioNuevoMensual > 0;
  }, [planSeleccionado, suscripcion, periodoSeleccionado]);

  // Determinar si es un downgrade (ahora con prorrateo automático)
  const esDowngrade = useMemo(() => {
    if (!planSeleccionado || !suscripcion) return false;
    const precioActual = parseFloat(suscripcion.precio_actual || 0);
    const precioNuevoMensual = calcularPrecioMensualEquivalente(planSeleccionado, periodoSeleccionado);
    return precioNuevoMensual < precioActual;
  }, [planSeleccionado, suscripcion, periodoSeleccionado]);

  // Handler de confirmación
  const handleConfirmar = async () => {
    if (!planSeleccionado || !suscripcion) return;

    // Si es upgrade a plan de pago, ir a checkout de MercadoPago
    if (isUserPage && esUpgradePago) {
      setIsCheckoutLoading(true);
      try {
        const response = await suscripcionesNegocioApi.iniciarCheckout({
          plan_id: planSeleccionado.id,
          periodo: periodoSeleccionado,
        });

        const initPoint = response.data?.data?.init_point;
        if (initPoint) {
          success('Redirigiendo a MercadoPago...');
          // Redirigir a MercadoPago
          window.location.href = initPoint;
        } else {
          showError('No se pudo obtener el enlace de pago');
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Error al iniciar el checkout');
      } finally {
        setIsCheckoutLoading(false);
      }
      return;
    }

    // Para downgrades y cambios sin pago, usar la mutación directa
    // El backend aplica el prorrateo automáticamente
    const mutateParams = isUserPage
      ? { nuevo_plan_id: planSeleccionado.id, cambio_inmediato: true }
      : { id: suscripcion.id, nuevo_plan_id: planSeleccionado.id };

    cambiarPlanMutation.mutate(
      mutateParams,
      {
        onSuccess: () => {
          setPlanSeleccionado(null);
          if (esDowngrade && prorrateo?.requiereCredito) {
            success(`Plan cambiado. Se aplicó un crédito de ${formatCurrency(Math.abs(prorrateo.diferencia))} para tu próxima factura.`);
          } else {
            success('Plan cambiado exitosamente');
          }
          onSuccess?.();
        },
        onError: (err) => {
          showError(err.message || 'Error al cambiar el plan');
        },
      }
    );
  };

  // Reset al cerrar
  const handleClose = () => {
    setPlanSeleccionado(null);
    setPeriodoSeleccionado('mensual');
    onClose();
  };

  // Texto del botón según el tipo de cambio
  const getBotonTexto = () => {
    if (isUserPage && esUpgradePago) return 'Ir a Pagar';
    if (isUserPage && esDowngrade) return 'Confirmar Downgrade';
    return 'Confirmar Cambio';
  };

  // Verificar si se puede confirmar (esperando prorrateo en downgrades)
  const puedeConfirmar = useMemo(() => {
    if (!planSeleccionado) return false;
    if (isUserPage && esDowngrade && loadingProrrateo) return false;
    return true;
  }, [planSeleccionado, isUserPage, esDowngrade, loadingProrrateo]);

  return (
    <>
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="Cambiar Plan"
      size="md"
    >
      <div className="flex flex-col h-full">
        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingPlanes ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : planesDisponibles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No hay planes disponibles para cambiar.
              </p>
            </div>
          ) : (
            <>
              {/* Selector de periodo */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Periodo de facturación
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CICLO_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriodoSeleccionado(value)}
                      className={cn(
                        'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                        periodoSeleccionado === value
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {periodoSeleccionado !== 'mensual' && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Los precios se muestran como equivalente mensual. El cobro se realiza mensualmente.
                  </p>
                )}
              </div>

              {/* Lista de planes */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selecciona un nuevo plan
                </h3>
                <div className="space-y-3">
                  {planesDisponibles.map((plan) => (
                    <PlanSeleccionCard
                      key={plan.id}
                      plan={plan}
                      planActualId={suscripcion?.plan_id}
                      isSelected={planSeleccionado?.id === plan.id}
                      onSelect={setPlanSeleccionado}
                      periodoSeleccionado={periodoSeleccionado}
                    />
                  ))}
                </div>
              </div>

              {/* Resumen si hay plan seleccionado */}
              {planSeleccionado && !isUserPage && (
                <ResumenCambio
                  planActual={suscripcion}
                  planNuevo={planSeleccionado}
                  periodoSeleccionado={periodoSeleccionado}
                />
              )}

              {/* Prorrateo detallado para usuarios (con cálculo real) */}
              {planSeleccionado && isUserPage && planSeleccionado.id !== suscripcion?.plan_id && (
                <ProrrateoResumen
                  prorrateo={prorrateo}
                  isLoading={loadingProrrateo}
                  error={errorProrrateo}
                />
              )}
            </>
          )}
        </div>

        {/* Footer fijo */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={cambiarPlanMutation.isPending || isCheckoutLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmar}
              disabled={!puedeConfirmar || cambiarPlanMutation.isPending || isCheckoutLoading}
              loading={cambiarPlanMutation.isPending || isCheckoutLoading}
            >
              {getBotonTexto()}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  </>
  );
}

export default CambiarPlanDrawer;
