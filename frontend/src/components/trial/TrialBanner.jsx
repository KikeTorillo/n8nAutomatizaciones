import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Banner que muestra el estado del trial y permite navegar a planes
 *
 * @param {number} diasRestantes - Días restantes del trial
 * @param {string} planNombre - Nombre del plan actual
 * @param {Function} onDismiss - Callback para cerrar el banner (opcional)
 * @param {string} className - Clases adicionales
 */
function TrialBanner({
  diasRestantes = 0,
  planNombre = 'Trial',
  onDismiss,
  className,
}) {
  const navigate = useNavigate();

  // Determinar urgencia
  const isUrgente = diasRestantes <= 3;
  const isExpirando = diasRestantes <= 7;

  // Colores según urgencia
  const colorClasses = isUrgente
    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    : isExpirando
    ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
    : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';

  const buttonVariant = isUrgente ? 'error' : isExpirando ? 'warning' : 'primary';

  // Mensaje según días restantes
  const mensaje = diasRestantes === 0
    ? 'Tu período de prueba ha terminado'
    : diasRestantes === 1
    ? 'Tu período de prueba termina mañana'
    : `Te quedan ${diasRestantes} días de prueba`;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3 border rounded-lg',
        colorClasses,
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Clock className={cn(
          'w-5 h-5 flex-shrink-0',
          isUrgente ? 'text-red-600 dark:text-red-400' :
          isExpirando ? 'text-yellow-600 dark:text-yellow-400' :
          'text-blue-600 dark:text-blue-400'
        )} />

        <div className="min-w-0">
          <p className="font-medium truncate">
            {mensaje}
          </p>
          <p className="text-sm opacity-75 truncate">
            Actualiza a un plan pago para continuar usando todas las funciones
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant={buttonVariant}
          size="sm"
          onClick={() => navigate('/mi-plan')}
        >
          Gestionar plan
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

TrialBanner.displayName = 'TrialBanner';

export default memo(TrialBanner);
