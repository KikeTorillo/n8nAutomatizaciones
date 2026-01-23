import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Button, LoadingSpinner } from '@/components/ui';
import { suscripcionesNegocioApi } from '@/services/api/modules/suscripciones-negocio.api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Página de callback después del pago en MercadoPago
 *
 * Esta página recibe los parámetros de MercadoPago y muestra el resultado:
 * - collection_status: approved, pending, rejected, cancelled
 * - external_reference: sus_123_pago_456
 * - payment_id: ID del pago en MP
 */
function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parámetros de MercadoPago
  const collectionStatus = searchParams.get('collection_status') || searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const paymentId = searchParams.get('payment_id');
  const suscripcionIdParam = searchParams.get('suscripcion_id');

  // Parsear external_reference: "sus_123_pago_456"
  const suscripcionId = suscripcionIdParam ||
    (externalReference?.match(/sus_(\d+)/)?.[1]);

  // Query para obtener estado actualizado de la suscripción
  const {
    data: resultado,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['checkout-resultado', suscripcionId, collectionStatus],
    queryFn: () =>
      suscripcionesNegocioApi.obtenerResultadoCheckout({
        suscripcion_id: suscripcionId,
        external_reference: externalReference,
        collection_status: collectionStatus,
      }),
    enabled: !!suscripcionId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const suscripcion = resultado?.data?.data?.suscripcion;
  const estadoResultado = resultado?.data?.data?.resultado_pago?.estado;

  // Determinar estado a mostrar (priorizar estado del backend si está disponible)
  const estadoFinal = suscripcion?.estado === 'activa' ? 'aprobado' :
    estadoResultado || (collectionStatus === 'approved' ? 'aprobado' :
      collectionStatus === 'pending' ? 'pendiente' :
        collectionStatus === 'rejected' ? 'rechazado' : 'desconocido');

  // Configuración según estado
  const estadoConfig = {
    aprobado: {
      icon: CheckCircle,
      iconClass: 'text-green-500',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      title: 'Pago Exitoso',
      subtitle: 'Tu suscripción ha sido activada correctamente.',
      showPlanInfo: true,
    },
    pendiente: {
      icon: Clock,
      iconClass: 'text-yellow-500',
      bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
      title: 'Pago Pendiente',
      subtitle: 'Tu pago está siendo procesado. Te notificaremos cuando se complete.',
      showPlanInfo: true,
    },
    rechazado: {
      icon: XCircle,
      iconClass: 'text-red-500',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      title: 'Pago Rechazado',
      subtitle: 'No pudimos procesar tu pago. Por favor, intenta con otro método de pago.',
      showPlanInfo: false,
    },
    desconocido: {
      icon: HelpCircle,
      iconClass: 'text-gray-500',
      bgClass: 'bg-gray-50 dark:bg-gray-900/20',
      title: 'Estado Desconocido',
      subtitle: 'No pudimos determinar el estado de tu pago. Contacta a soporte si el problema persiste.',
      showPlanInfo: false,
    },
  };

  const config = estadoConfig[estadoFinal] || estadoConfig.desconocido;
  const IconComponent = config.icon;

  // Si no hay suscripcion_id, mostrar error
  if (!suscripcionId && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full text-center">
          <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Enlace inválido
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No se encontró información del pago. Si realizaste un pago, por favor contacta a soporte.
          </p>
          <Button onClick={() => navigate('/planes')} variant="primary">
            Ir a Planes
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Verificando estado del pago...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full">
        {/* Card principal */}
        <div className={cn(
          'rounded-2xl p-8 text-center',
          config.bgClass
        )}>
          {/* Icono */}
          <div className="mb-6">
            <IconComponent className={cn('w-20 h-20 mx-auto', config.iconClass)} />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {config.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {config.subtitle}
          </p>

          {/* Info del plan (si aplica) */}
          {config.showPlanInfo && suscripcion && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {suscripcion.plan_nombre}
                </span>
              </div>
              {suscripcion.precio_actual && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Precio</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {formatCurrency(suscripcion.precio_actual)}/mes
                  </span>
                </div>
              )}
              {suscripcion.fecha_proximo_cobro && (
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Próximo cobro</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(suscripcion.fecha_proximo_cobro).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            {estadoFinal === 'aprobado' && (
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {estadoFinal === 'pendiente' && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar estado
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Ir al Dashboard
                </Button>
              </>
            )}

            {estadoFinal === 'rechazado' && (
              <>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/planes')}
                >
                  Intentar de nuevo
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Ir al Dashboard
                </Button>
              </>
            )}

            {estadoFinal === 'desconocido' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
                Ir al Dashboard
              </Button>
            )}
          </div>

          {/* ID de referencia */}
          {(paymentId || externalReference) && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Referencia: {paymentId || externalReference}
              </p>
            </div>
          )}
        </div>

        {/* Ayuda */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          ¿Tienes problemas?{' '}
          <a
            href="mailto:soporte@nexo.com"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Contacta a soporte
          </a>
        </p>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;
