import { useState } from 'react';
import useOnboardingStore from '@/store/onboardingStore';
import { useConfigurarTelegram, useConfigurarWhatsApp } from '@/hooks/useChatbots';
import { useToast } from '@/hooks/useToast';
import PlatformCard from '@/components/chatbots/PlatformCard';
import TelegramConfigForm from '@/components/chatbots/TelegramConfigForm';
import WhatsAppConfigForm from '@/components/chatbots/WhatsAppConfigForm';
import { MessageCircle, MessageSquare, Bot } from 'lucide-react';

/**
 * Paso 7: Selección de Plataforma de Chatbot
 * Permite elegir entre Telegram y WhatsApp Business
 */
function Step7_PlatformSelection() {
  const { formData, updateFormData, nextStep } = useOnboardingStore();
  const toast = useToast();

  // Estado local para la plataforma seleccionada
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Mutations para configurar chatbots
  const configurarTelegramMutation = useConfigurarTelegram();
  const configurarWhatsAppMutation = useConfigurarWhatsApp();

  // Configuración de plataformas disponibles
  const platforms = [
    {
      platform: 'telegram',
      name: 'Telegram',
      description: 'Bot con inteligencia artificial para Telegram',
      icon: <MessageCircle className="w-full h-full" />,
      color: 'blue',
      available: true,
    },
    {
      platform: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Bot oficial con WhatsApp Business Cloud API',
      icon: <MessageSquare className="w-full h-full" />,
      color: 'green',
      available: true,
    },
  ];

  // Handler para submit de Telegram
  const handleTelegramSubmit = async (data) => {
    try {
      const response = await configurarTelegramMutation.mutateAsync({
        nombre: data.nombre_bot,
        bot_token: data.bot_token,
        descripcion: data.descripcion,
        configuracion: {
          plataforma: 'telegram',
          ai_model: 'deepseek-chat',
          ai_temperature: 0.7,
        },
      });

      // Guardar en store
      updateFormData('chatbot', {
        plataforma: 'telegram',
        configurado: true,
        bot_token: data.bot_token,
        nombre_bot: data.nombre_bot,
        username_bot: response.credential?.bot_username || '',
        chatbot_id: response.chatbot?.id,
        workflow_id: response.workflow?.id,
        omitido: false,
      });

      toast.success('¡Bot de Telegram configurado exitosamente!');
      nextStep();
    } catch (error) {
      console.error('Error configurando bot de Telegram:', error);
      toast.error(
        error.response?.data?.error || error.message || 'Error al configurar el bot de Telegram'
      );
    }
  };

  // Handler para submit de WhatsApp
  const handleWhatsAppSubmit = async (data) => {
    try {
      const response = await configurarWhatsAppMutation.mutateAsync({
        nombre: data.nombre,
        api_key: data.api_key,
        phone_number_id: data.phone_number_id,
        business_account_id: data.business_account_id,
        webhook_verify_token: data.webhook_verify_token,
        descripcion: data.descripcion,
        configuracion: {
          plataforma: 'whatsapp_oficial',
          ai_model: 'deepseek-chat',
          ai_temperature: 0.7,
        },
      });

      // Guardar en store
      updateFormData('chatbot', {
        plataforma: 'whatsapp_oficial',
        configurado: true,
        api_key: data.api_key,
        phone_number_id: data.phone_number_id,
        display_phone_number: response.bot_info?.display_phone_number || '',
        chatbot_id: response.chatbot?.id,
        workflow_id: response.workflow?.id,
        omitido: false,
      });

      toast.success('¡Bot de WhatsApp configurado exitosamente!');
      nextStep();
    } catch (error) {
      console.error('Error configurando bot de WhatsApp:', error);
      toast.error(
        error.response?.data?.error || error.message || 'Error al configurar el bot de WhatsApp'
      );
    }
  };

  // Handler para saltar configuración
  const handleSkip = () => {
    updateFormData('chatbot', {
      plataforma: null,
      configurado: false,
      omitido: true,
    });
    nextStep();
  };

  // Valores por defecto según plataforma
  const defaultTelegramValues = {
    bot_token: formData.chatbot?.bot_token || formData.telegram?.bot_token || '',
    nombre_bot: formData.chatbot?.nombre_bot || formData.telegram?.nombre_bot || '',
    descripcion: '',
  };

  const defaultWhatsAppValues = {
    nombre: formData.chatbot?.nombre || '',
    api_key: formData.chatbot?.api_key || '',
    phone_number_id: formData.chatbot?.phone_number_id || '',
    business_account_id: formData.chatbot?.business_account_id || '',
    webhook_verify_token: formData.chatbot?.webhook_verify_token || '',
    descripcion: '',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Chatbot con Inteligencia Artificial
        </h2>
        <p className="text-gray-600">
          Selecciona la plataforma donde quieres conectar tu chatbot inteligente
        </p>
      </div>

      {/* Platform Selection */}
      {!selectedPlatform && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.platform}
              platform={platform.platform}
              name={platform.name}
              description={platform.description}
              icon={platform.icon}
              color={platform.color}
              available={platform.available}
              selected={selectedPlatform === platform.platform}
              onClick={() => setSelectedPlatform(platform.platform)}
            />
          ))}
        </div>
      )}

      {/* Selected Platform Form */}
      {selectedPlatform === 'telegram' && (
        <div>
          {/* Breadcrumb para volver */}
          <button
            type="button"
            onClick={() => setSelectedPlatform(null)}
            className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-1"
          >
            ← Cambiar plataforma
          </button>

          {/* Header de Telegram */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Integración con Telegram
            </h3>
            <p className="text-gray-600">
              Configura tu chatbot de Telegram con IA para automatizar agendamiento
            </p>
          </div>

          {/* Formulario de Telegram */}
          <TelegramConfigForm
            defaultValues={defaultTelegramValues}
            onSubmit={handleTelegramSubmit}
            onSkip={handleSkip}
            isLoading={configurarTelegramMutation.isPending}
            isSuccess={configurarTelegramMutation.isSuccess}
          />
        </div>
      )}

      {selectedPlatform === 'whatsapp' && (
        <div>
          {/* Breadcrumb para volver */}
          <button
            type="button"
            onClick={() => setSelectedPlatform(null)}
            className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-1"
          >
            ← Cambiar plataforma
          </button>

          {/* Header de WhatsApp */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Integración con WhatsApp Business
            </h3>
            <p className="text-gray-600">
              Configura tu chatbot de WhatsApp con IA para automatizar agendamiento
            </p>
          </div>

          {/* Formulario de WhatsApp */}
          <WhatsAppConfigForm
            defaultValues={defaultWhatsAppValues}
            onSubmit={handleWhatsAppSubmit}
            onSkip={handleSkip}
            isLoading={configurarWhatsAppMutation.isPending}
            isSuccess={configurarWhatsAppMutation.isSuccess}
          />
        </div>
      )}
    </div>
  );
}

export default Step7_PlatformSelection;
