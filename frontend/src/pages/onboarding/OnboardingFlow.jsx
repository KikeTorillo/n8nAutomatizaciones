import { Link } from 'react-router-dom';
import useOnboardingStore from '@/store/onboardingStore';
import { cn } from '@/lib/utils';
import { Building2, CreditCard, UserPlus, Users, Clock, Scissors, MessageCircle, CheckCircle, Sparkles } from 'lucide-react';

// Importar los pasos
import Step1_BusinessInfo from './steps/Step1_BusinessInfo';
import Step2_PlanSelection from './steps/Step2_PlanSelection';
import Step3_AccountSetup from './steps/Step3_AccountSetup';
import Step4_Professionals from './steps/Step4_Professionals';
import Step5_Schedules from './steps/Step5_Schedules';
import Step6_Services from './steps/Step6_Services';
import Step7_WhatsAppIntegration from './steps/Step7_WhatsAppIntegration';
import Step8_Review from './steps/Step8_Review';
import Step9_Welcome from './steps/Step9_Welcome';

/**
 * Flujo de Onboarding - Componente Principal
 */
function OnboardingFlow() {
  const { currentStep, completedSteps, getProgress } = useOnboardingStore();

  // Configuración de pasos
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
    {
      number: 4,
      title: 'Profesionales',
      icon: Users,
      component: Step4_Professionals,
    },
    {
      number: 5,
      title: 'Horarios',
      icon: Clock,
      component: Step5_Schedules,
    },
    {
      number: 6,
      title: 'Servicios',
      icon: Scissors,
      component: Step6_Services,
    },
    {
      number: 7,
      title: 'WhatsApp',
      icon: MessageCircle,
      component: Step7_WhatsAppIntegration,
    },
    {
      number: 8,
      title: 'Resumen',
      icon: CheckCircle,
      component: Step8_Review,
    },
    {
      number: 9,
      title: 'Bienvenida',
      icon: Sparkles,
      component: Step9_Welcome,
    },
  ];

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ¡Bienvenido a SaaS Agendamiento!
            </h1>
            <p className="text-xl text-gray-600">
              Configura tu cuenta en solo 9 pasos
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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center">
              {steps.map((step, index) => {
                const isActive = currentStep === step.number;
                const isCompleted = completedSteps.includes(step.number);
                const Icon = step.icon;

                return (
                  <div
                    key={step.number}
                    className={cn(
                      'flex flex-col items-center gap-2',
                      index < steps.length - 1 && 'flex-1'
                    )}
                  >
                    {/* Círculo del paso */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all',
                        isActive && 'bg-primary-600 text-white ring-4 ring-primary-100',
                        isCompleted && !isActive && 'bg-green-500 text-white',
                        !isActive && !isCompleted && 'bg-gray-200 text-gray-500'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Título del paso */}
                    <span
                      className={cn(
                        'text-xs font-medium text-center transition-all',
                        isActive && 'text-primary-700',
                        isCompleted && !isActive && 'text-green-600',
                        !isActive && !isCompleted && 'text-gray-500'
                      )}
                    >
                      {step.title}
                    </span>

                    {/* Línea conectora */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute h-0.5 bg-gray-200 w-full top-6 -z-10" />
                    )}
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
