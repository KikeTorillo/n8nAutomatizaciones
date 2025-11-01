import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import PlatformCard from './PlatformCard';
import TelegramConfigForm from './TelegramConfigForm';
import WhatsAppConfigForm from './WhatsAppConfigForm';
import { useConfigurarTelegram, useConfigurarWhatsApp } from '@/hooks/useChatbots';
import { useToast } from '@/hooks/useToast';
import { MessageCircle, MessageSquare, Bot } from 'lucide-react';

/**
 * Modal para configurar un nuevo chatbot
 * Reutiliza los componentes del onboarding
 */
function ConfigurarChatbotModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Mutations
  const configurarTelegramMutation = useConfigurarTelegram();
  const configurarWhatsAppMutation = useConfigurarWhatsApp();

  // Configuración de plataformas
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
      await configurarTelegramMutation.mutateAsync({
        nombre: data.nombre_bot,
        bot_token: data.bot_token,
        descripcion: data.descripcion,
        configuracion: {
          plataforma: 'telegram',
          ai_model: 'deepseek-chat',
          ai_temperature: 0.7,
        },
      });

      toast.success('¡Bot de Telegram configurado exitosamente!');
      onSuccess();
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
      await configurarWhatsAppMutation.mutateAsync({
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

      toast.success('¡Bot de WhatsApp configurado exitosamente!');
      onSuccess();
    } catch (error) {
      console.error('Error configurando bot de WhatsApp:', error);
      toast.error(
        error.response?.data?.error || error.message || 'Error al configurar el bot de WhatsApp'
      );
    }
  };

  // Handler para cerrar modal
  const handleClose = () => {
    setSelectedPlatform(null);
    onClose();
  };

  // Handler para volver a selección de plataforma
  const handleBack = () => {
    setSelectedPlatform(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedPlatform ? `Configurar ${selectedPlatform === 'telegram' ? 'Telegram' : 'WhatsApp'}` : 'Nuevo Chatbot con IA'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Selección de Plataforma */}
        {!selectedPlatform && (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
              <p className="text-gray-600">
                Selecciona la plataforma donde quieres conectar tu chatbot inteligente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </>
        )}

        {/* Formulario de Telegram */}
        {selectedPlatform === 'telegram' && (
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-1"
            >
              ← Cambiar plataforma
            </button>

            <TelegramConfigForm
              defaultValues={{}}
              onSubmit={handleTelegramSubmit}
              onSkip={handleClose}
              isLoading={configurarTelegramMutation.isPending}
              isSuccess={configurarTelegramMutation.isSuccess}
            />
          </div>
        )}

        {/* Formulario de WhatsApp */}
        {selectedPlatform === 'whatsapp' && (
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center gap-1"
            >
              ← Cambiar plataforma
            </button>

            <WhatsAppConfigForm
              defaultValues={{}}
              onSubmit={handleWhatsAppSubmit}
              onSkip={handleClose}
              isLoading={configurarWhatsAppMutation.isPending}
              isSuccess={configurarWhatsAppMutation.isSuccess}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ConfigurarChatbotModal;
