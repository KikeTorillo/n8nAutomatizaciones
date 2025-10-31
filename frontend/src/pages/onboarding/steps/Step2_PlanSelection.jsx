import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { planesApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Check } from 'lucide-react';

/**
 * Paso 2: Selección de Plan
 */
function Step2_PlanSelection() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore();
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState(formData.plan.plan_id);

  // Fetch planes desde el backend
  const { data, isLoading, error } = useQuery({
    queryKey: ['planes'],
    queryFn: async () => {
      const response = await planesApi.listar();
      return response.data.data;
    },
  });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
    updateFormData('plan', {
      plan_id: plan.id,
      plan_codigo: plan.codigo_plan,    // ✅ Guardar código del plan (trial, basico, etc.)
      plan_nombre: plan.nombre,         // Guardar nombre para mostrar
      plan_precio: plan.precio_mensual,
    });
  };

  const handleContinue = () => {
    if (!selectedPlan) {
      toast.warning('Por favor selecciona un plan');
      return;
    }
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Cargando planes disponibles..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error al cargar los planes</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selecciona tu Plan
        </h2>
        <p className="text-gray-600">
          Elige el plan que mejor se adapte a tu negocio
        </p>
      </div>

      {/* Planes - Grid 4 columnas más compacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handleSelectPlan(plan)}
            className={`
              relative border-2 rounded-lg p-4 cursor-pointer transition-all
              ${selectedPlan === plan.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
              }
            `}
          >
            {/* Check badge */}
            {selectedPlan === plan.id && (
              <div className="absolute top-3 right-3">
                <div className="bg-primary-600 text-white rounded-full p-1">
                  <Check className="w-3 h-3" />
                </div>
              </div>
            )}

            {/* Nombre del plan */}
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {plan.nombre}
            </h3>

            {/* Precio */}
            <div className="mb-3">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(plan.precio_mensual)}
              </span>
              <span className="text-sm text-gray-600">/mes</span>
            </div>

            {/* Descripción */}
            {plan.descripcion && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {plan.descripcion}
              </p>
            )}

            {/* Features - más compacto */}
            <ul className="space-y-1.5">
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-primary-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{plan.max_profesionales} profesionales</span>
              </li>
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-primary-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{plan.max_servicios} servicios</span>
              </li>
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-primary-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{plan.max_citas_mes} citas/mes</span>
              </li>
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-primary-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{plan.max_usuarios} usuarios</span>
              </li>
              {plan.incluye_whatsapp && (
                <li className="flex items-start text-xs text-gray-700">
                  <Check className="w-3 h-3 text-primary-600 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>WhatsApp</span>
                </li>
              )}
              {plan.incluye_recordatorios && (
                <li className="flex items-start text-xs text-gray-700">
                  <Check className="w-3 h-3 text-primary-600 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>Recordatorios</span>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button onClick={handleContinue} disabled={!selectedPlan}>
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default Step2_PlanSelection;
