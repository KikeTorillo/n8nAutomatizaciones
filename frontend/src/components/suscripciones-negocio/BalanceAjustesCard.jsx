/**
 * ====================================================================
 * BALANCE AJUSTES CARD
 * ====================================================================
 *
 * Muestra el balance de créditos y cargos pendientes de una suscripción.
 * Se muestra en MiPlanPage cuando hay ajustes pendientes.
 *
 * ====================================================================
 */

import { memo } from 'react';
import {
  CreditCard,
  TrendingDown,
  TrendingUp,
  Info,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

/**
 * Componente que muestra el balance de ajustes pendientes
 *
 * @param {Object} props
 * @param {Object} props.balance - { creditoPendiente, ajustePendiente, neto }
 * @param {string} props.moneda - Moneda de la suscripción (default: MXN)
 */
function BalanceAjustesCard({ balance, moneda = 'MXN' }) {
  if (!balance) return null;

  const { creditoPendiente, ajustePendiente, neto } = balance;

  // Si no hay ajustes pendientes, no mostrar nada
  if (creditoPendiente === 0 && ajustePendiente === 0) {
    return null;
  }

  const tieneCredito = creditoPendiente > 0;
  const tieneCargo = ajustePendiente > 0;
  const netoPositivo = neto > 0;
  const netoNegativo = neto < 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Ajustes Pendientes
          </h3>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Estos ajustes se aplicarán en tu próxima factura
        </p>
      </div>

      {/* Contenido */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Crédito a favor */}
          {tieneCredito && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Crédito a favor
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                -{formatCurrency(creditoPendiente, moneda)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Se descontará de tu próximo pago
              </p>
            </div>
          )}

          {/* Cargo pendiente */}
          {tieneCargo && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Cargo pendiente
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                +{formatCurrency(ajustePendiente, moneda)}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Se agregará a tu próximo pago
              </p>
            </div>
          )}
        </div>

        {/* Balance neto (si hay ambos) */}
        {tieneCredito && tieneCargo && (
          <div className={cn(
            'rounded-lg p-4 flex items-center justify-between',
            netoPositivo && 'bg-orange-50 dark:bg-orange-900/20',
            netoNegativo && 'bg-green-50 dark:bg-green-900/20',
            !netoPositivo && !netoNegativo && 'bg-gray-50 dark:bg-gray-700/50'
          )}>
            <div className="flex items-center gap-2">
              <CreditCard className={cn(
                'w-5 h-5',
                netoPositivo && 'text-orange-600 dark:text-orange-400',
                netoNegativo && 'text-green-600 dark:text-green-400',
                !netoPositivo && !netoNegativo && 'text-gray-500'
              )} />
              <span className={cn(
                'font-medium',
                netoPositivo && 'text-orange-700 dark:text-orange-300',
                netoNegativo && 'text-green-700 dark:text-green-300',
                !netoPositivo && !netoNegativo && 'text-gray-600 dark:text-gray-300'
              )}>
                Balance neto
              </span>
            </div>
            <span className={cn(
              'text-xl font-bold',
              netoPositivo && 'text-orange-600 dark:text-orange-400',
              netoNegativo && 'text-green-600 dark:text-green-400',
              !netoPositivo && !netoNegativo && 'text-gray-600 dark:text-gray-300'
            )}>
              {netoPositivo && '+'}
              {netoNegativo && '-'}
              {formatCurrency(Math.abs(neto), moneda)}
            </span>
          </div>
        )}

        {/* Nota informativa */}
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {tieneCredito && !tieneCargo && (
              <>Este crédito se generó por un cambio de plan y se aplicará automáticamente.</>
            )}
            {tieneCargo && !tieneCredito && (
              <>Este cargo se generó por un upgrade y se cobrará junto con tu próxima factura.</>
            )}
            {tieneCredito && tieneCargo && (
              <>Tienes créditos y cargos pendientes. El balance neto se aplicará en tu próxima factura.</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(BalanceAjustesCard);
