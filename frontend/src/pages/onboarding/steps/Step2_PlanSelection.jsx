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
  const [selectedPlanData, setSelectedPlanData] = useState(null);

  // Fetch planes desde el backend
  const { data, isLoading, error } = useQuery({
    queryKey: ['planes'],
    queryFn: async () => {
      const response = await planesApi.listar();
      // Filtrar solo planes seleccionables (basico, profesional)
      // El plan 'custom' se mostrará aparte como "Contáctanos"
      const planesSeleccionables = response.data.data.filter(
        plan => ['basico', 'profesional'].includes(plan.codigo_plan)
      );
      const planCustom = response.data.data.find(
        plan => plan.codigo_plan === 'custom'
      );
      return { planesSeleccionables, planCustom };
    },
  });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan.id);
    setSelectedPlanData(plan);
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

    // Continuar al siguiente paso (Paso 3: Crear cuenta)
    // La suscripción se creará DESPUÉS de crear la cuenta si es plan de pago
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

      {/* Planes - Grid 3 columnas (2 seleccionables + 1 contact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Planes seleccionables (Básico y Professional) */}
        {data?.planesSeleccionables?.map((plan) => (
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

            {/* Trial badge */}
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                ✨ 14 días gratis
              </span>
            </div>

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
            </ul>
          </div>
        ))}

        {/* Plan Custom - Contáctanos (NO seleccionable) */}
        {data?.planCustom && (
          <div
            className="relative border-2 border-gray-300 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100"
          >
            {/* Badge Enterprise */}
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                🏢 Enterprise
              </span>
            </div>

            {/* Nombre del plan */}
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {data.planCustom.nombre}
            </h3>

            {/* "Contact us" en lugar de precio */}
            <div className="mb-3">
              <span className="text-2xl font-bold text-gray-900">
                Contáctanos
              </span>
            </div>

            {/* Descripción */}
            <p className="text-xs text-gray-600 mb-3">
              Solución personalizada para organizaciones con necesidades específicas
            </p>

            {/* Features personalizadas */}
            <ul className="space-y-1.5 mb-4">
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-purple-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>Recursos ilimitados</span>
              </li>
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-purple-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>Soporte prioritario</span>
              </li>
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-purple-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>Personalización completa</span>
              </li>
              <li className="flex items-start text-xs text-gray-700">
                <Check className="w-3 h-3 text-purple-600 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>SLA garantizado</span>
              </li>
            </ul>

            {/* Botón Contáctanos */}
            <a
              href="mailto:contacto@tuempresa.com?subject=Consulta Plan Personalizado"
              className="block w-full text-center px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-md transition-colors"
            >
              Contactar ventas
            </a>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedPlan}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default Step2_PlanSelection;
