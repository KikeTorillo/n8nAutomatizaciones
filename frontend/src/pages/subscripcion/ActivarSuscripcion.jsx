import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscripcionesApi, planesApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui';
import { CreditCard, ArrowLeft, CheckCircle, Clock, ExternalLink } from 'lucide-react';

/**
 * Página para Activar Suscripción con Pago - Usando init_point de Mercado Pago
 * Se accede desde el Dashboard cuando el usuario quiere activar su suscripción
 * El usuario será redirigido a Mercado Pago para completar el pago
 */
function ActivarSuscripcion() {
  const navigate = useNavigate();
  const toast = useToast();

  // Obtener estado del trial
  const { data: estadoTrial, isLoading: loadingTrial } = useQuery({
    queryKey: ['estado-trial'],
    queryFn: () => subscripcionesApi.obtenerEstadoTrial(),
    select: (response) => response.data.data,
  });

  // Obtener suscripción actual
  const { data: suscripcionActual, isLoading: loadingSuscripcion } = useQuery({
    queryKey: ['suscripcion-actual'],
    queryFn: () => subscripcionesApi.obtenerActual(),
    select: (response) => response.data.data,
  });

  // Obtener plan Pro (plan destino después del pago)
  const { data: planPro, isLoading: loadingPlanPro } = useQuery({
    queryKey: ['plan-pro'],
    queryFn: () => planesApi.listar(),
    select: (response) => {
      const planes = response.data.data || response.data || [];
      return planes.find(p => p.codigo_plan === 'pro');
    },
  });

  // Mutation para activar pago - Obtiene init_point y redirige a Mercado Pago
  const activarPagoMutation = useMutation({
    mutationFn: async () => {
      return await subscripcionesApi.activarPago();
    },
    onSuccess: (response) => {
      const initPoint = response.data.data.init_point;

      if (!initPoint) {
        toast.error('No se pudo generar el link de pago. Intenta nuevamente.');
        return;
      }

      console.log('✅ Init point generado:', initPoint);
      toast.success('Redirigiendo a Mercado Pago...');

      // Redirigir al usuario a Mercado Pago para completar el pago
      setTimeout(() => {
        window.location.href = initPoint;
      }, 1000);
    },
    onError: (error) => {
      console.error('❌ Error generando link de pago:', error);

      const errorMessage = error.response?.data?.message || 'Error al generar el link de pago';
      toast.error(`Error: ${errorMessage}`);
    },
  });

  const handleActivarPago = () => {
    activarPagoMutation.mutate();
  };

  if (loadingTrial || loadingSuscripcion || loadingPlanPro) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando información...</p>
        </div>
      </div>
    );
  }

  // Solo mostrar formulario de pago si está en trial (puede upgrade a Pro)
  const puedeActivarPago = estadoTrial?.plan_codigo === 'trial';
  if (!puedeActivarPago) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Tu suscripción está activa
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {estadoTrial?.plan_codigo === 'pro'
              ? 'Ya tienes el plan Pro activo. ¡Disfruta de todas las funciones!'
              : 'Este plan no requiere activación de pago.'}
          </p>
          <Button onClick={() => navigate('/home')}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header con botón volver */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/home')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Inicio
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Activar Suscripción</h1>
        {/* Info del Trial */}
        {estadoTrial?.trial_activo && (
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                  Trial Activo
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                  Te quedan {estadoTrial.dias_restantes} {estadoTrial.dias_restantes === 1 ? 'día' : 'días'} de prueba.
                  Activa tu suscripción ahora para evitar interrupciones en el servicio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Card Principal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          {/* Info del Plan Pro (destino) */}
          <div className="text-center mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Plan {planPro?.nombre_plan || 'Pro'}
            </h2>
            <p className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              ${planPro?.precio_mensual || 249}
              <span className="text-2xl font-normal text-gray-600 dark:text-gray-400"> MXN/mes</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Facturación mensual automática
            </p>
          </div>

          {/* Descripción del Proceso */}
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-2">
                  Pago Seguro con Mercado Pago
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
                  Serás redirigido a Mercado Pago para completar tu suscripción de forma segura.
                  Una vez completado el pago, volverás automáticamente a tu panel.
                </p>
                <ul className="text-sm text-primary-700 dark:text-primary-300 space-y-1">
                  <li>✓ Proceso 100% seguro y encriptado</li>
                  <li>✓ Puedes pagar con tarjeta de crédito o débito</li>
                  <li>✓ También puedes usar otros métodos de pago disponibles</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botón de Acción */}
          <div className="space-y-4">
            <Button
              onClick={handleActivarPago}
              isLoading={activarPagoMutation.isPending}
              disabled={activarPagoMutation.isPending}
              className="w-full py-4 text-lg"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {activarPagoMutation.isPending
                ? 'Generando link de pago...'
                : 'Continuar a Mercado Pago'}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Al continuar, aceptas que se realizará un cargo de ${planPro?.precio_mensual || 249} MXN
              de forma mensual hasta que canceles la suscripción.
            </p>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">¿Qué sucede después?</h4>
          <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600 dark:text-primary-400">1.</span>
              <span>Serás redirigido a Mercado Pago para completar el pago</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600 dark:text-primary-400">2.</span>
              <span>Ingresa los datos de tu tarjeta de crédito o débito</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600 dark:text-primary-400">3.</span>
              <span>Confirma el pago y serás redirigido de vuelta</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary-600 dark:text-primary-400">4.</span>
              <span>¡Listo! Tu suscripción estará activa y podrás usar todas las funciones</span>
            </li>
          </ol>
        </div>

        {/* Info de Suscripción */}
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Información de la Suscripción</h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• La suscripción se renueva automáticamente cada mes</li>
            <li>• Puedes cancelar en cualquier momento desde tu panel</li>
            <li>• Recibirás un recibo por email después de cada cargo</li>
            <li>• Tus datos están protegidos con encriptación de Mercado Pago</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default ActivarSuscripcion;
