import { memo } from 'react';
import { Check, Star } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { CICLO_LABELS, CICLO_MESES } from '@/hooks/suscripciones-negocio';

/**
 * Calcula el precio total de un plan según el periodo seleccionado
 */
function calcularPrecioPorPeriodo(plan, periodo) {
  if (!plan) return 0;

  const campoDirecto = {
    mensual: 'precio_mensual',
    trimestral: 'precio_trimestral',
    semestral: 'precio_semestral',
    anual: 'precio_anual',
  }[periodo];

  const precioDirecto = parseFloat(plan[campoDirecto]);
  if (!isNaN(precioDirecto) && precioDirecto > 0) {
    return precioDirecto;
  }

  // Fallback: multiplicar precio mensual por meses
  const meses = CICLO_MESES[periodo] || 1;
  return (parseFloat(plan.precio_mensual) || 0) * meses;
}

/**
 * Card para mostrar información de un plan de suscripción
 * @param {Object} plan - Datos del plan
 * @param {boolean} isPopular - Marcar como plan popular
 * @param {boolean} isSelected - Plan actualmente seleccionado
 * @param {Function} onSelect - Callback al seleccionar
 * @param {Function} onEdit - Callback al editar
 * @param {string} periodoSeleccionado - Periodo de facturación seleccionado
 */
function PlanCard({ plan, isPopular, isSelected, onSelect, onEdit, periodoSeleccionado = 'mensual' }) {
  if (!plan) return null;

  const meses = CICLO_MESES[periodoSeleccionado] || 1;
  const precioTotal = calcularPrecioPorPeriodo(plan, periodoSeleccionado);
  const precioMensualEquiv = precioTotal / meses;
  const diasTrial = plan.dias_trial ?? plan.dias_prueba ?? 0;
  const caracteristicas = plan.features || plan.caracteristicas || [];

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-xl border-2 p-6 transition-all',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600',
        isPopular && 'ring-2 ring-primary-500'
      )}
    >
      {/* Badge popular */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="primary" size="sm" className="gap-1">
            <Star className="w-3 h-3 fill-current" />
            Popular
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {plan.nombre}
        </h3>
        {plan.descripcion && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {plan.descripcion}
          </p>
        )}
      </div>

      {/* Precio */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(precioMensualEquiv)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">/mes</span>
        </div>
        {meses > 1 && (
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            Total: {formatCurrency(precioTotal)}/{CICLO_LABELS[periodoSeleccionado]?.toLowerCase()}
          </p>
        )}
        {diasTrial > 0 && (
          <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
            {diasTrial} días de prueba gratis
          </p>
        )}
      </div>

      {/* Características */}
      {caracteristicas.length > 0 && (
        <ul className="space-y-3 mb-6">
          {caracteristicas.map((caracteristica, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {caracteristica}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Acciones */}
      <div className="space-y-2">
        {onSelect && (
          <Button
            variant={isSelected ? 'primary' : 'outline'}
            className="w-full"
            onClick={() => onSelect(plan)}
          >
            {isSelected ? 'Plan Actual' : 'Seleccionar'}
          </Button>
        )}
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onEdit(plan)}
          >
            Editar plan
          </Button>
        )}
      </div>

      {/* Estado */}
      {!plan.activo && (
        <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-900/70 rounded-xl flex items-center justify-center">
          <Badge variant="default" size="lg">Inactivo</Badge>
        </div>
      )}
    </div>
  );
}

PlanCard.displayName = 'PlanCard';

export default memo(PlanCard);
