/**
 * ====================================================================
 * HISTORIAL PAGOS CARD
 * ====================================================================
 * Componente que muestra los últimos pagos de una suscripción.
 * Se usa en la página MiPlanPage.
 * ====================================================================
 */

import { Receipt, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Badge, LoadingSpinner } from '@/components/ui';
import { usePagos } from '@/hooks/suscripciones-negocio';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

/**
 * Configuración de estados de pago
 */
const ESTADO_CONFIG = {
  completado: {
    icon: CheckCircle,
    label: 'Completado',
    variant: 'success',
    iconColor: 'text-green-500',
  },
  pendiente: {
    icon: Clock,
    label: 'Pendiente',
    variant: 'warning',
    iconColor: 'text-yellow-500',
  },
  fallido: {
    icon: XCircle,
    label: 'Fallido',
    variant: 'error',
    iconColor: 'text-red-500',
  },
  reembolsado: {
    icon: AlertCircle,
    label: 'Reembolsado',
    variant: 'default',
    iconColor: 'text-gray-500',
  },
  procesando: {
    icon: Clock,
    label: 'Procesando',
    variant: 'info',
    iconColor: 'text-blue-500',
  },
};

/**
 * Componente de fila de pago
 */
function PagoRow({ pago }) {
  const config = ESTADO_CONFIG[pago.estado] || ESTADO_CONFIG.pendiente;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
      <div className="flex items-center gap-3">
        <Icon className={cn('w-5 h-5', config.iconColor)} />
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatDate(pago.fecha_pago || pago.creado_en)}
          </p>
          {pago.metodo_pago && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pago.metodo_pago}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={config.variant} size="sm">
          {config.label}
        </Badge>
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(pago.monto)}
        </span>
      </div>
    </div>
  );
}

/**
 * Componente de estado vacío
 */
function EmptyState() {
  return (
    <div className="text-center py-6">
      <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No hay pagos registrados
      </p>
    </div>
  );
}

/**
 * HistorialPagosCard
 *
 * @param {number} suscripcionId - ID de la suscripción para filtrar pagos
 * @param {number} limite - Cantidad máxima de pagos a mostrar (default: 5)
 * @param {string} className - Clases adicionales
 */
function HistorialPagosCard({ suscripcionId, limite = 5, className }) {
  // Query de pagos filtrados por suscripción
  const { data, isLoading, isError } = usePagos({
    suscripcion_id: suscripcionId,
    limit: limite,
    page: 1,
  });

  const pagos = data?.items || [];

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Historial de Pagos
          </h3>
          {pagos.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Últimos {pagos.length} pagos
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : isError ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-500 dark:text-red-400">
              Error al cargar el historial de pagos
            </p>
          </div>
        ) : pagos.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {pagos.map((pago) => (
              <PagoRow key={pago.id} pago={pago} />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Link a ver todos (si hay más pagos) */}
      {data?.paginacion?.total > limite && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Mostrando {pagos.length} de {data.paginacion.total} pagos
          </p>
        </div>
      )}
    </div>
  );
}

export default HistorialPagosCard;
