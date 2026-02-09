/**
 * ====================================================================
 * PRORRATEO RESUMEN
 * ====================================================================
 *
 * Muestra el resumen del cálculo de prorrateo al cambiar de plan.
 * Indica si es upgrade (cargo) o downgrade (crédito).
 *
 * ====================================================================
 */

import { memo } from 'react';
import {
  ArrowUp,
  ArrowDown,
  CreditCard,
  Clock,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Badge, LoadingSpinner } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

/**
 * Componente para mostrar detalle del prorrateo
 */
function ProrrateoResumen({ prorrateo, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 py-4">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Calculando prorrateo...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error al calcular prorrateo</p>
            <p className="text-sm">{error.message || 'Intenta nuevamente'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!prorrateo) {
    return null;
  }

  const {
    planActualNombre,
    planNuevoNombre,
    precioActual,
    precioNuevo,
    creditoPlanAnterior,
    cargoPlanNuevo,
    diferencia,
    diasUsados,
    diasRestantes,
    diasTotales,
    periodo,
    tipo,
    esUpgrade,
    moneda,
    mensaje,
    requiereCobroInmediato,
  } = prorrateo;

  const esDowngrade = tipo === 'downgrade';
  const sinCambio = diferencia === 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden">
      {/* Header con tipo de cambio */}
      <div className={cn(
        'px-4 py-3 flex items-center gap-2',
        esUpgrade && 'bg-green-100 dark:bg-green-900/30',
        esDowngrade && 'bg-orange-100 dark:bg-orange-900/30',
        sinCambio && 'bg-gray-100 dark:bg-gray-600/30'
      )}>
        {esUpgrade && (
          <>
            <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-green-700 dark:text-green-300">
              Upgrade de plan
            </span>
            <Badge variant="success" size="sm" className="ml-auto">
              +{formatCurrency(diferencia, moneda)}
            </Badge>
          </>
        )}
        {esDowngrade && (
          <>
            <ArrowDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="font-semibold text-orange-700 dark:text-orange-300">
              Downgrade de plan
            </span>
            <Badge variant="warning" size="sm" className="ml-auto">
              Crédito: {formatCurrency(Math.abs(diferencia), moneda)}
            </Badge>
          </>
        )}
        {sinCambio && (
          <>
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Sin diferencia de precio
            </span>
          </>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-4">
        {/* Planes */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan actual</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {planActualNombre}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(precioActual, moneda)}/{periodo}
            </p>
          </div>
          <div className="text-gray-300 dark:text-gray-600 text-2xl">→</div>
          <div className="flex-1 text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nuevo plan</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {planNuevoNombre}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(precioNuevo, moneda)}/{periodo}
            </p>
          </div>
        </div>

        {/* Desglose del prorrateo */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300">
              {diasUsados} días usados de {diasTotales} ({diasRestantes} restantes)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="bg-white dark:bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Crédito por plan anterior
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(creditoPlanAnterior, moneda)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Cargo nuevo plan
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(cargoPlanNuevo, moneda)}
              </p>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className={cn(
          'rounded-lg p-3 flex items-center justify-between',
          esUpgrade && 'bg-green-50 dark:bg-green-900/20',
          esDowngrade && 'bg-orange-50 dark:bg-orange-900/20',
          sinCambio && 'bg-gray-100 dark:bg-gray-600/30'
        )}>
          <div className="flex items-center gap-2">
            <CreditCard className={cn(
              'w-5 h-5',
              esUpgrade && 'text-green-600 dark:text-green-400',
              esDowngrade && 'text-orange-600 dark:text-orange-400',
              sinCambio && 'text-gray-500'
            )} />
            <span className={cn(
              'font-medium',
              esUpgrade && 'text-green-700 dark:text-green-300',
              esDowngrade && 'text-orange-700 dark:text-orange-300',
              sinCambio && 'text-gray-600 dark:text-gray-300'
            )}>
              {esUpgrade ? 'Cargo adicional' : esDowngrade ? 'Crédito a favor' : 'Diferencia'}
            </span>
          </div>
          <span className={cn(
            'text-xl font-bold',
            esUpgrade && 'text-green-600 dark:text-green-400',
            esDowngrade && 'text-orange-600 dark:text-orange-400',
            sinCambio && 'text-gray-600 dark:text-gray-300'
          )}>
            {esUpgrade && '+'}
            {esDowngrade && '-'}
            {formatCurrency(Math.abs(diferencia), moneda)}
          </span>
        </div>

        {/* Mensaje informativo */}
        <div className={cn(
          'flex items-start gap-2 text-sm p-3 rounded-lg',
          esUpgrade && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
          esDowngrade && 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
          sinCambio && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        )}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{mensaje}</span>
        </div>

        {/* Advertencia para downgrade */}
        {esDowngrade && (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Al hacer downgrade, el crédito se aplicará automáticamente en tu próxima factura.
              Algunas funcionalidades del plan actual pueden no estar disponibles.
            </span>
          </div>
        )}

        {/* Advertencia para upgrade */}
        {requiereCobroInmediato && esUpgrade && (
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              El cargo se procesará inmediatamente y tendrás acceso a las nuevas funcionalidades.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProrrateoResumen);
