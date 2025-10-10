import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { whatsappApi } from '@/services/api/endpoints';
import useOnboardingStore from '@/store/onboardingStore';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { MessageCircle, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Paso 6: Integración WhatsApp
 */
function Step6_WhatsAppIntegration() {
  const navigate = useNavigate();
  const { resetOnboarding, prevStep } = useOnboardingStore();
  const [isConnected, setIsConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Fetch QR Code
  const { data: qrData, isLoading: isLoadingQR, error: qrError } = useQuery({
    queryKey: ['whatsapp-qr'],
    queryFn: async () => {
      const response = await whatsappApi.obtenerQR();
      return response.data.data;
    },
    retry: 2,
  });

  // Polling para verificar estado de conexión
  const { data: statusData } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const response = await whatsappApi.verificarEstado();
      return response.data.data;
    },
    refetchInterval: isConnected ? false : 3000, // Poll cada 3 segundos hasta conectar
    enabled: !!qrData, // Solo hacer polling si ya tenemos el QR
  });

  // Verificar si se conectó
  useEffect(() => {
    if (statusData?.status === 'connected') {
      setIsConnected(true);
      setPhoneNumber(statusData.phone_number);
    }
  }, [statusData]);

  const handleFinish = () => {
    // Limpiar onboarding store
    resetOnboarding();

    // Redirigir al dashboard
    navigate('/dashboard');
  };

  const handleSkip = () => {
    resetOnboarding();
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Integración WhatsApp
        </h2>
        <p className="text-gray-600">
          Conecta tu WhatsApp para habilitar la IA conversacional
        </p>
      </div>

      {/* Estados */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        {/* Loading QR */}
        {isLoadingQR && (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Generando código QR..." />
          </div>
        )}

        {/* Error */}
        {qrError && (
          <div className="text-center py-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              Error al generar código QR
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {qrError.message}
            </p>
            <Button onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Conectado */}
        {isConnected && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡WhatsApp Conectado!
            </h3>
            <p className="text-gray-600 mb-4">
              Tu número: <span className="font-medium">{phoneNumber}</span>
            </p>
            <p className="text-sm text-gray-600">
              Ya puedes usar la IA conversacional para gestionar citas por WhatsApp
            </p>
          </div>
        )}

        {/* Mostrar QR */}
        {!isLoadingQR && !qrError && qrData && !isConnected && (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Escanea el código QR con WhatsApp
            </h3>

            {/* QR Code */}
            <div className="flex justify-center mb-4">
              <img
                src={`data:image/png;base64,${qrData.qr_code_base64}`}
                alt="WhatsApp QR Code"
                className="w-64 h-64 border-4 border-gray-200 rounded-lg"
              />
            </div>

            {/* Instrucciones */}
            <div className="text-left max-w-md mx-auto space-y-2 mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Paso 1:</span> Abre WhatsApp en tu teléfono
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Paso 2:</span> Ve a{' '}
                <span className="font-medium">Configuración → Dispositivos vinculados</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Paso 3:</span> Toca en{' '}
                <span className="font-medium">Vincular un dispositivo</span>
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Paso 4:</span> Escanea este código QR
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Esperando escaneo...
            </div>
          </div>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={isConnected}
        >
          Anterior
        </Button>
        <div className="flex gap-2">
          {!isConnected && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
            >
              Saltar por ahora
            </Button>
          )}
          <Button
            type="button"
            onClick={handleFinish}
            disabled={!isConnected && !qrError}
          >
            {isConnected ? 'Ir al Dashboard' : 'Finalizar más tarde'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step6_WhatsAppIntegration;
