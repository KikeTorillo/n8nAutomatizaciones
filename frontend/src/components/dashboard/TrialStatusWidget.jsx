import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { subscripcionesApi } from '@/services/api/endpoints';
import Button from '@/components/ui/Button';
import { Clock, Sparkles, CreditCard, AlertCircle } from 'lucide-react';

/**
 * Widget de Estado de Trial
 * Muestra información del trial activo y botón para activar pago
 */
function TrialStatusWidget() {
  const navigate = useNavigate();

  // Obtener estado del trial
  const { data: estadoTrial, isLoading } = useQuery({
    queryKey: ['estado-trial'],
    queryFn: () => subscripcionesApi.obtenerEstadoTrial(),
    select: (response) => response.data.data,
    staleTime: 2 * 60 * 1000, // Cache de 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });

  // No mostrar nada si está cargando o no hay trial
  if (isLoading || !estadoTrial?.tiene_trial) {
    return null;
  }

  // No mostrar para planes gratuitos sin trial de tiempo
  const esPlanGratuito = ['custom'].includes(estadoTrial.plan_codigo);
  if (esPlanGratuito) {
    return null;
  }

  const { trial_activo, trial_vencido, dias_restantes } = estadoTrial;

  // Trial activo
  if (trial_activo && dias_restantes !== null) {
    const esUrgente = dias_restantes <= 3;
    const colorClasses = esUrgente
      ? 'bg-orange-50 border-orange-200'
      : 'bg-blue-50 border-blue-200';
    const textColorClasses = esUrgente ? 'text-orange-900' : 'text-blue-900';
    const iconColorClasses = esUrgente ? 'text-orange-600' : 'text-blue-600';
    const Icon = esUrgente ? AlertCircle : Sparkles;

    return (
      <div className={`rounded-lg border ${colorClasses} p-4 sm:p-5 mb-6`}>
        {/* Mobile: Stack, Desktop: Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${esUrgente ? 'bg-orange-100' : 'bg-blue-100'}`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClasses}`} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-base sm:text-lg font-semibold ${textColorClasses}`}>
                  {esUrgente ? '¡Trial por Vencer!' : 'Trial Activo'}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  esUrgente ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  <Clock className="w-3 h-3 mr-1" />
                  {dias_restantes} {dias_restantes === 1 ? 'día' : 'días'} restantes
                </span>
              </div>
              <p className={`text-sm mt-2 ${esUrgente ? 'text-orange-700' : 'text-blue-700'}`}>
                {esUrgente
                  ? `Tu período de prueba termina pronto. Activa tu suscripción para continuar sin interrupciones.`
                  : `Estás probando todas las funciones del plan. Puedes activar tu suscripción en cualquier momento.`}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Vence el: {new Date(estadoTrial.fecha_fin_trial).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/suscripcion')}
            variant={esUrgente ? 'primary' : 'outline'}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Activar Suscripción
          </Button>
        </div>
      </div>
    );
  }

  // Trial vencido
  if (trial_vencido) {
    return (
      <div className="rounded-lg border bg-red-50 border-red-200 p-4 sm:p-5 mb-6">
        {/* Mobile: Stack, Desktop: Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-red-900">
                  Trial Vencido
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Acción requerida
                </span>
              </div>
              <p className="text-sm text-red-700 mt-2">
                Tu período de prueba ha finalizado. Activa tu suscripción para continuar usando todas las funciones.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Tus datos están seguros y se mantendrán por 30 días.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/suscripcion')}
            variant="primary"
            className="w-full sm:w-auto flex-shrink-0"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Activar Ahora
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

export default TrialStatusWidget;
