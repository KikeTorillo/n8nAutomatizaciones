/**
 * ====================================================================
 * ALERTA BLOQUEADO
 * ====================================================================
 * Banner que se muestra en la página de planes cuando el usuario
 * llega redirigido por tener una suscripción en estado bloqueado.
 * ====================================================================
 */

import { AlertTriangle, Clock, XCircle, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Configuración de mensajes según estado
 */
const ESTADOS_CONFIG = {
  suspendida: {
    icon: Ban,
    title: 'Suscripción Suspendida',
    message: 'Tu suscripción ha sido suspendida. Por favor, selecciona un plan para reactivar tu cuenta.',
    variant: 'error',
  },
  cancelada: {
    icon: XCircle,
    title: 'Suscripción Cancelada',
    message: 'Tu suscripción ha sido cancelada. Selecciona un plan para volver a usar el sistema.',
    variant: 'error',
  },
  vencida: {
    icon: Clock,
    title: 'Suscripción Vencida',
    message: 'Tu período de suscripción ha terminado. Renueva tu plan para continuar usando el sistema.',
    variant: 'warning',
  },
  trial_expirado: {
    icon: Clock,
    title: 'Período de Prueba Terminado',
    message: 'Tu período de prueba ha finalizado. Selecciona un plan para continuar disfrutando de todas las funciones.',
    variant: 'warning',
  },
  grace_period_expirado: {
    icon: AlertTriangle,
    title: 'Período de Gracia Terminado',
    message: 'El período de gracia ha expirado. Por favor, actualiza tu método de pago o selecciona un plan.',
    variant: 'error',
  },
  pendiente_pago: {
    icon: AlertTriangle,
    title: 'Pago Pendiente',
    message: 'Tienes un pago pendiente. Completa el pago para continuar usando el sistema.',
    variant: 'warning',
  },
  sin_suscripcion: {
    icon: AlertTriangle,
    title: 'Sin Suscripción Activa',
    message: 'No tienes una suscripción activa. Selecciona un plan para comenzar.',
    variant: 'info',
  },
};

/**
 * Estilos según variante
 */
const VARIANT_STYLES = {
  error: {
    container: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    message: 'text-red-700 dark:text-red-300',
  },
  warning: {
    container: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-800 dark:text-orange-200',
    message: 'text-orange-700 dark:text-orange-300',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    message: 'text-blue-700 dark:text-blue-300',
  },
};

/**
 * Componente AlertaBloqueado
 *
 * @param {string} estado - Estado de la suscripción (suspendida, cancelada, vencida, etc.)
 * @param {string} className - Clases adicionales
 */
function AlertaBloqueado({ estado, className }) {
  // Obtener configuración del estado
  const config = ESTADOS_CONFIG[estado];

  // Si no hay configuración para el estado, no renderizar
  if (!config) return null;

  const { icon: Icon, title, message, variant } = config;
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        'border rounded-lg p-4 mb-6',
        styles.container,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-6 h-6 flex-shrink-0 mt-0.5', styles.icon)} />
        <div>
          <h3 className={cn('font-semibold', styles.title)}>
            {title}
          </h3>
          <p className={cn('text-sm mt-1', styles.message)}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AlertaBloqueado;
