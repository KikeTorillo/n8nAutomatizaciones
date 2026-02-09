/**
 * ====================================================================
 * CREDITO ESTADO CARD - Panel de Estado de Crédito
 * ====================================================================
 *
 * Muestra el estado actual del crédito de un cliente:
 * - Límite de crédito
 * - Saldo utilizado
 * - Disponible
 * - Días de crédito
 * - Barra de progreso de uso
 *
 * Enero 2026
 * ====================================================================
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { CreditCard, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import { StatCard, ProgressBar, Badge } from '@/components/ui';
import { formatMoney } from '@/hooks/personas';

/**
 * Formatea un monto monetario
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Panel de estado del crédito del cliente
 */
const CreditoEstadoCard = memo(function CreditoEstadoCard({
  estadoCredito,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!estadoCredito) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <CreditCard className="w-5 h-5" />
          <span>No hay información de crédito disponible</span>
        </div>
      </div>
    );
  }

  const {
    permite_credito,
    limite_credito = 0,
    saldo_credito = 0,
    dias_credito = 30,
    credito_suspendido = false,
  } = estadoCredito;

  const disponible = limite_credito - saldo_credito;
  const porcentajeUsado = limite_credito > 0 ? (saldo_credito / limite_credito) * 100 : 0;

  // Determinar estado visual
  const getEstadoBadge = () => {
    if (!permite_credito) {
      return { label: 'Sin Crédito', variant: 'neutral', icon: Ban };
    }
    if (credito_suspendido) {
      return { label: 'Suspendido', variant: 'danger', icon: AlertTriangle };
    }
    if (porcentajeUsado >= 90) {
      return { label: 'Casi Agotado', variant: 'warning', icon: AlertTriangle };
    }
    return { label: 'Activo', variant: 'success', icon: CheckCircle };
  };

  const estadoBadge = getEstadoBadge();
  const EstadoIcon = estadoBadge.icon;

  // Determinar color de la barra de progreso
  const getBarColor = () => {
    if (credito_suspendido) return 'red';
    if (porcentajeUsado >= 90) return 'red';
    if (porcentajeUsado >= 70) return 'yellow';
    return 'green';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
            <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Estado del Crédito
          </h3>
        </div>
        <Badge
          variant={estadoBadge.variant}
          className="flex items-center gap-1"
        >
          <EstadoIcon className="w-3 h-3" />
          {estadoBadge.label}
        </Badge>
      </div>

      {/* Métricas */}
      {permite_credito ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Límite de Crédito
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(limite_credito)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Saldo Utilizado
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(saldo_credito)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Disponible
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(disponible)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Días de Crédito
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {dias_credito} días
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Uso del crédito
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {porcentajeUsado.toFixed(1)}%
              </span>
            </div>
            <ProgressBar
              value={saldo_credito}
              max={limite_credito}
              color={getBarColor()}
              size="md"
            />
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <Ban className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Este cliente no tiene crédito habilitado.</p>
          <p className="text-sm mt-1">
            Puedes habilitarlo desde la configuración del cliente.
          </p>
        </div>
      )}
    </div>
  );
});

CreditoEstadoCard.displayName = 'CreditoEstadoCard';

CreditoEstadoCard.propTypes = {
  estadoCredito: PropTypes.shape({
    permite_credito: PropTypes.bool,
    limite_credito: PropTypes.number,
    saldo_credito: PropTypes.number,
    dias_credito: PropTypes.number,
    credito_suspendido: PropTypes.bool,
  }),
  isLoading: PropTypes.bool,
};

export default CreditoEstadoCard;
