import { memo } from 'react';
import { Check, Star } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';
import { CICLO_LABELS } from '@/hooks/suscripciones-negocio';

/**
 * Card para mostrar información de un plan de suscripción
 * @param {Object} plan - Datos del plan
 * @param {boolean} isPopular - Marcar como plan popular
 * @param {boolean} isSelected - Plan actualmente seleccionado
 * @param {Function} onSelect - Callback al seleccionar
 * @param {Function} onEdit - Callback al editar
 */
function PlanCard({ plan, isPopular, isSelected, onSelect, onEdit }) {
  if (!plan) return null;

  // Mapear campos del backend al frontend
  const precio = plan.precio_mensual || plan.precio || 0;
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
            {formatCurrency(precio)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">/mes</span>
        </div>
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
