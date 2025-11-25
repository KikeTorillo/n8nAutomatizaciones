import { Link } from 'react-router-dom';
import useOnboardingStore from '@/store/onboardingStore';
import { cn } from '@/lib/utils';
import { Building2, CreditCard, UserPlus } from 'lucide-react';

// Importar los pasos (3 pasos - Modelo Free/Pro Nov 2025)
import Step1_BusinessInfo from './steps/Step1_BusinessInfo';
import Step2_PlanSelection from './steps/Step2_PlanSelection';
import Step3_AccountSetup from './steps/Step3_AccountSetup';

/**
 * Flujo de Onboarding - Componente Principal
 *
 * Modelo Free/Pro (Nov 2025):
 * - Paso 1: Info del Negocio
 * - Paso 2: Selección de Plan (Free con selector de app / Pro con todo incluido)
 * - Paso 3: Crear Cuenta
 */
function OnboardingFlow() {
  const { currentStep, completedSteps, getProgress, totalSteps } = useOnboardingStore();

  // Configuración de pasos - Onboarding simplificado (3 pasos)
  const steps = [
    {
      number: 1,
      title: 'Info Negocio',
      icon: Building2,
      component: Step1_BusinessInfo,
    },
    {
      number: 2,
      title: 'Plan',
      icon: CreditCard,
      component: Step2_PlanSelection,
    },
    {
      number: 3,
      title: 'Cuenta',
      icon: UserPlus,
      component: Step3_AccountSetup,
    },
  ];

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a SaaS Agendamiento!
            </h1>
            <p className="text-xl text-gray-600">
              Crea tu cuenta en solo 3 pasos rápidos
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Paso {currentStep} de {steps.length}
              </span>
              <span className="text-sm font-medium text-primary-600">
                {getProgress()}% completado
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>

          {/* Stepper */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 overflow-hidden">
            <div className="flex justify-between items-center relative">
              {steps.map((step) => {
                const isActive = currentStep === step.number;
                const isCompleted = completedSteps.includes(step.number);
                const Icon = step.icon;

                return (
                  <div
                    key={step.number}
                    className="flex flex-col items-center gap-2 relative z-10"
                  >
                    {/* Círculo del paso */}
                    <div
                      className={cn(
                        'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all',
                        isActive && 'bg-primary-600 text-white ring-4 ring-primary-100',
                        isCompleted && !isActive && 'bg-green-500 text-white',
                        !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                      )}
                    >
                      <Icon className="w-4 h-4 md:w-6 md:h-6" />
                    </div>

                    {/* Título del paso */}
                    <span
                      className={cn(
                        'text-[10px] md:text-xs font-medium text-center transition-all max-w-[60px] md:max-w-none',
                        isActive && 'text-primary-700',
                        isCompleted && !isActive && 'text-green-600',
                        !isActive && !isCompleted && 'text-gray-500'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenido del paso actual */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {CurrentStepComponent ? (
              <CurrentStepComponent />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">Paso no encontrado</p>
              </div>
            )}
          </div>

          {/* Link para volver */}
          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;
