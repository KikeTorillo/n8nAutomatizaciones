import { CreditCard, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { usePagos, ESTADO_PAGO_LABELS, ESTADO_PAGO_COLORS, METODO_PAGO_LABELS } from '@/hooks/suscripciones-negocio';

/**
 * Tab de historial de pagos de la suscripción
 * @param {number} suscripcionId - ID de la suscripción
 */
function SuscripcionPagosTab({ suscripcionId }) {
  const { data, isLoading } = usePagos({ suscripcion_id: suscripcionId, limit: 50 });
  const pagos = data?.items || [];

  // Mapear colores a variantes de Badge
  const getVariant = (estado) => {
    const color = ESTADO_PAGO_COLORS[estado];
    const map = {
      yellow: 'warning',
      green: 'success',
      red: 'error',
      purple: 'primary',
      orange: 'warning',
    };
    return map[color] || 'default';
  };

  // Icono según estado
  const getIcon = (estado) => {
    switch (estado) {
      case 'completado': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fallido': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pendiente': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CreditCard className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (pagos.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Sin pagos registrados"
        description="Aún no hay pagos registrados para esta suscripción"
      />
    );
  }

  return (
    <div className="space-y-4">
      {pagos.map((pago) => (
        <div
          key={pago.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-4"
        >
          {/* Icono */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {getIcon(pago.estado)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(pago.monto)}
              </span>
              <Badge variant={getVariant(pago.estado)} size="sm">
                {ESTADO_PAGO_LABELS[pago.estado] || pago.estado}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(pago.fecha_pago || pago.creado_en)}
              </span>
              {pago.metodo_pago && (
                <span>{METODO_PAGO_LABELS[pago.metodo_pago] || pago.metodo_pago}</span>
              )}
              {pago.referencia_externa && (
                <span className="font-mono text-xs">{pago.referencia_externa}</span>
              )}
            </div>
          </div>

          {/* Monto Reembolsado */}
          {pago.monto_reembolsado > 0 && (
            <div className="text-right">
              <p className="text-sm text-red-500">
                Reembolsado: {formatCurrency(pago.monto_reembolsado)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SuscripcionPagosTab;
