import { useState, useEffect } from 'react';
import useOnboardingStore from '@/store/onboardingStore';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import {
  CreditCard,
  Check,
  Calendar,
  Package,
  ShoppingCart,
  Sparkles,
  Users,
  Infinity,
  Crown
} from 'lucide-react';

/**
 * Apps disponibles para Plan Free
 */
const APPS_DISPONIBLES = [
  {
    id: 'agendamiento',
    nombre: 'Agendamiento',
    descripcion: 'Gestión de citas y reservaciones',
    icon: Calendar,
    color: 'bg-blue-500',
    features: [
      'Calendario interactivo',
      'Reservas online',
      'Recordatorios automáticos',
      'Gestión de profesionales'
    ]
  },
  {
    id: 'inventario',
    nombre: 'Inventario',
    descripcion: 'Control de productos y stock',
    icon: Package,
    color: 'bg-green-500',
    features: [
      'Control de stock',
      'Alertas de inventario bajo',
      'Análisis ABC',
      'Gestión de proveedores'
    ]
  },
  {
    id: 'pos',
    nombre: 'Punto de Venta',
    descripcion: 'Sistema de ventas y caja',
    icon: ShoppingCart,
    color: 'bg-purple-500',
    features: [
      'Ventas rápidas',
      'Corte de caja',
      'Reportes de ventas',
      'Múltiples métodos de pago'
    ]
  }
];

/**
 * Planes disponibles (Modelo Free/Pro - Nov 2025)
 */
const PLANES = [
  {
    id: 'free',
    codigo: 'free',
    nombre: 'Plan Free',
    precio: 0,
    periodo: 'por siempre',
    descripcion: 'Comienza gratis con 1 app de tu elección',
    badge: 'Gratis',
    badgeColor: 'bg-green-100 text-green-800',
    destacado: false,
    features: [
      '1 App a elegir',
      'Usuarios ilimitados',
      'Soporte por email',
      'Actualizaciones incluidas'
    ]
  },
  {
    id: 'pro',
    codigo: 'pro',
    nombre: 'Plan Pro',
    precio: 249,
    periodo: '/usuario/mes',
    descripcion: 'Todo incluido para hacer crecer tu negocio',
    badge: 'Recomendado',
    badgeColor: 'bg-primary-100 text-primary-800',
    destacado: true,
    features: [
      'Todas las apps incluidas',
      'Agendamiento + Inventario + POS',
      'Comisiones automáticas',
      'Marketplace público',
      'Chatbot IA (WhatsApp/Telegram)',
      'Soporte prioritario',
      '14 días de prueba gratis'
    ]
  }
];

/**
 * Paso 2: Selección de Plan (Modelo Free/Pro - Nov 2025)
 */
function Step2_PlanSelection() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboardingStore();
  const toast = useToast();

  // Estado local
  const [selectedPlan, setSelectedPlan] = useState(formData.plan.plan_codigo || null);
  const [selectedApp, setSelectedApp] = useState(formData.plan.app_seleccionada || null);

  // Sincronizar con store cuando cambian los valores
  useEffect(() => {
    if (selectedPlan) {
      updateFormData('plan', {
        plan_id: selectedPlan === 'free' ? 1 : 2,
        plan_codigo: selectedPlan,
        plan_nombre: selectedPlan === 'free' ? 'Plan Free' : 'Plan Pro',
        plan_precio: selectedPlan === 'free' ? 0 : 249,
        app_seleccionada: selectedPlan === 'free' ? selectedApp : null,
      });
    }
  }, [selectedPlan, selectedApp]);

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);

    // Si cambia a Pro, limpiar app seleccionada
    if (planId === 'pro') {
      setSelectedApp(null);
    }
  };

  const handleSelectApp = (appId) => {
    setSelectedApp(appId);
  };

  const handleContinue = () => {
    if (!selectedPlan) {
      toast.warning('Por favor selecciona un plan');
      return;
    }

    // Si es Plan Free, debe elegir una app
    if (selectedPlan === 'free' && !selectedApp) {
      toast.warning('Por favor selecciona la app que deseas usar');
      return;
    }

    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Elige tu Plan
        </h2>
        <p className="text-gray-600">
          Selecciona el plan que mejor se adapte a tu negocio
        </p>
      </div>

      {/* Planes - Grid 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handleSelectPlan(plan.codigo)}
            className={cn(
              'relative border-2 rounded-xl p-6 cursor-pointer transition-all',
              selectedPlan === plan.codigo
                ? 'border-primary-600 bg-primary-50 shadow-lg'
                : 'border-gray-200 hover:border-primary-300 hover:shadow-md',
              plan.destacado && 'ring-2 ring-primary-500 ring-offset-2'
            )}
          >
            {/* Badge */}
            <div className="flex justify-between items-start mb-4">
              <span className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                plan.badgeColor
              )}>
                {plan.badge}
              </span>

              {/* Check de selección */}
              {selectedPlan === plan.codigo && (
                <div className="bg-primary-600 text-white rounded-full p-1.5">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Nombre y precio */}
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              {plan.destacado && <Crown className="w-5 h-5 text-yellow-500" />}
              {plan.nombre}
            </h3>

            <div className="mb-3">
              <span className="text-3xl font-bold text-gray-900">
                ${plan.precio.toLocaleString('es-MX')}
              </span>
              <span className="text-sm text-gray-600 ml-1">
                {plan.periodo}
              </span>
            </div>

            {/* Descripción */}
            <p className="text-sm text-gray-600 mb-4">
              {plan.descripcion}
            </p>

            {/* Features */}
            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start text-sm text-gray-700">
                  <Check className={cn(
                    'w-4 h-4 mr-2 mt-0.5 flex-shrink-0',
                    plan.destacado ? 'text-primary-600' : 'text-green-600'
                  )} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Icono decorativo para Pro */}
            {plan.destacado && (
              <div className="absolute top-4 right-16 opacity-10">
                <Sparkles className="w-20 h-20 text-primary-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selector de App (Solo visible si Plan Free está seleccionado) */}
      {selectedPlan === 'free' && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Elige tu app gratuita
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Con el Plan Free tienes acceso completo a 1 app. Elige la que mejor se adapte a tu negocio.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {APPS_DISPONIBLES.map((app) => {
              const Icon = app.icon;
              const isSelected = selectedApp === app.id;

              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApp(app.id)}
                  className={cn(
                    'relative border-2 rounded-lg p-4 cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary-600 bg-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  )}
                >
                  {/* Check de selección */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}

                  {/* Icono */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                    app.color
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Nombre y descripción */}
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {app.nombre}
                  </h4>
                  <p className="text-xs text-gray-600 mb-3">
                    {app.descripcion}
                  </p>

                  {/* Mini features */}
                  <ul className="space-y-1">
                    {app.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-center text-xs text-gray-600">
                        <Check className="w-3 h-3 text-green-500 mr-1.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje informativo Pro */}
      {selectedPlan === 'pro' && (
        <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
          <div className="flex items-start gap-4">
            <div className="bg-primary-600 text-white rounded-lg p-3">
              <Infinity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900 mb-1">
                Todo incluido en el Plan Pro
              </h3>
              <p className="text-sm text-primary-700 mb-3">
                Tendrás acceso completo a todas las funcionalidades de la plataforma:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {APPS_DISPONIBLES.map((app) => {
                  const Icon = app.icon;
                  return (
                    <div
                      key={app.id}
                      className="flex items-center gap-2 text-sm text-primary-800"
                    >
                      <div className={cn('p-1 rounded', app.color)}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span>{app.nombre}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-2 text-sm text-primary-800">
                  <div className="p-1 rounded bg-orange-500">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>Comisiones</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-800">
                  <div className="p-1 rounded bg-pink-500">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span>Marketplace</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary-800">
                  <div className="p-1 rounded bg-cyan-500">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <span>Chatbot IA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparativa rápida */}
      <div className="text-center text-sm text-gray-500">
        <p>
          {selectedPlan === 'free'
            ? 'Siempre puedes actualizar a Pro para desbloquear todas las funcionalidades'
            : selectedPlan === 'pro'
              ? 'Comienza con 14 días de prueba gratis, cancela cuando quieras'
              : 'Elige un plan para continuar'}
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedPlan || (selectedPlan === 'free' && !selectedApp)}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}

export default Step2_PlanSelection;
