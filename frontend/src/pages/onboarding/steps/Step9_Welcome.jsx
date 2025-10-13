import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useOnboardingStore from '@/store/onboardingStore';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import { Sparkles, ArrowRight } from 'lucide-react';

/**
 * Paso 9: Pantalla de Bienvenida Final
 * Muestra mensaje de éxito y redirige automáticamente al dashboard
 */
function Step9_Welcome() {
  const navigate = useNavigate();
  const { resetOnboarding, formData } = useOnboardingStore();
  const { user } = useAuthStore();
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    if (!autoRedirect) return;

    // Countdown de 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect]);

  const handleFinish = () => {
    // Limpiar onboarding store
    resetOnboarding();

    // Redirigir al dashboard
    navigate('/dashboard');
  };

  const handleCancelAutoRedirect = () => {
    setAutoRedirect(false);
    setCountdown(0);
  };

  return (
    <div className="space-y-8">
      {/* Header con animación */}
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          ¡Bienvenido a SaaS Agendamiento!
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          {user?.nombre}, tu cuenta está lista para usar
        </p>
        <p className="text-gray-500">
          {formData.businessInfo.nombre_comercial}
        </p>
      </div>

      {/* Mensaje de éxito */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Configuración Completada Exitosamente!
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Has completado todos los pasos del onboarding. Tu sistema de agendamiento está listo para gestionar tus citas,
            profesionales y servicios. ¡Es hora de empezar a crecer tu negocio!
          </p>
        </div>
      </div>

      {/* Próximos pasos */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Qué puedes hacer ahora:
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-sm font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Explora el Dashboard</p>
              <p className="text-sm text-gray-600">
                Familiarízate con las métricas, estadísticas y accesos rápidos
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-sm font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Crea tu Primera Cita</p>
              <p className="text-sm text-gray-600">
                Prueba el sistema creando una cita de prueba
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-sm font-bold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Personaliza tu Configuración</p>
              <p className="text-sm text-gray-600">
                Ajusta horarios, servicios y preferencias según tus necesidades
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary-600 text-sm font-bold">4</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Configura WhatsApp</p>
              <p className="text-sm text-gray-600">
                Activa la IA conversacional para automatizar la gestión de citas
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Auto-redirect countdown */}
      {autoRedirect && countdown > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-900">
            Serás redirigido automáticamente al dashboard en{' '}
            <span className="font-bold text-2xl">{countdown}</span> segundo{countdown !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleCancelAutoRedirect}
            className="text-sm text-blue-700 underline hover:text-blue-900 mt-2"
          >
            Cancelar redirección automática
          </button>
        </div>
      )}

      {/* Botón manual */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleFinish}
          size="lg"
          className="group"
        >
          Ir al Dashboard
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Footer con mensaje motivacional */}
      <div className="text-center pt-6 border-t">
        <p className="text-gray-600 italic">
          "El éxito de tu negocio comienza con una buena organización" ✨
        </p>
      </div>
    </div>
  );
}

export default Step9_Welcome;
