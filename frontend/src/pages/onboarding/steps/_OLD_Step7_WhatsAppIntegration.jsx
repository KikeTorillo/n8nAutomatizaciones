import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useOnboardingStore from '@/store/onboardingStore';
import { useConfigurarTelegram } from '@/hooks/useChatbots';
import { useToast } from '@/hooks/useToast';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { MessageCircle, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

// Schema de validación para bot token de Telegram
const telegramSchema = z.object({
  bot_token: z
    .string()
    .min(1, 'El token del bot es requerido')
    .regex(
      /^\d{8,10}:[A-Za-z0-9_-]{35,}$/,
      'Formato de token inválido. Debe ser: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890'
    ),
  nombre_bot: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
});

/**
 * Paso 7: Integración Telegram Bot
 * Reemplaza la integración de WhatsApp
 */
function Step7_WhatsAppIntegration() {
  const { formData, updateFormData, nextStep } = useOnboardingStore();
  const toast = useToast();
  const [showInstructions, setShowInstructions] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(telegramSchema),
    defaultValues: {
      bot_token: formData.telegram?.bot_token || '',
      nombre_bot: formData.telegram?.nombre_bot || '',
      descripcion: '',
    },
  });

  // Mutation para configurar Telegram
  const configurarTelegramMutation = useConfigurarTelegram();

  const onSubmit = async (data) => {
    try {
      // Configurar chatbot en backend
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
      updateFormData('telegram', {
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
      console.error('Error configurando bot:', error);
      toast.error(
        error.response?.data?.error || 'Error al configurar el bot de Telegram'
      );
    }
  };

  const handleSkip = () => {
    // Marcar como omitido
    updateFormData('telegram', {
      configurado: false,
      omitido: true,
    });
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Integración con Telegram
        </h2>
        <p className="text-gray-600">
          Configura tu chatbot de Telegram con IA para automatizar agendamiento
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">¿No tienes un bot de Telegram?</p>
            <p className="mb-2">
              Necesitas crear uno con @BotFather antes de continuar.
            </p>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-blue-600 hover:text-blue-700 font-medium underline"
            >
              {showInstructions ? 'Ocultar instrucciones' : 'Ver instrucciones'}
            </button>
          </div>
        </div>
      </div>

      {/* Instrucciones colapsables */}
      {showInstructions && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">
            Cómo crear un bot con @BotFather:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              Abre Telegram y busca{' '}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                @BotFather
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Envía el comando: <code className="bg-gray-200 px-1 rounded">/newbot</code></li>
            <li>Elige un nombre para tu bot (ej: "Mi Negocio Bot")</li>
            <li>
              Elige un username que termine en "bot" (ej: "minegocio_bot")
            </li>
            <li>
              @BotFather te dará un <strong>token</strong> que se ve así:
              <code className="block bg-gray-200 px-2 py-1 rounded mt-1 text-xs">
                123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
              </code>
            </li>
            <li>Copia ese token y pégalo en el formulario de abajo</li>
          </ol>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="nombre_bot"
          control={control}
          label="Nombre del Bot"
          placeholder="Ej: Mi Negocio Asistente"
          required
          helperText="Nombre descriptivo para identificar tu bot"
        />

        <Controller
          name="bot_token"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Bot Token"
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890"
              required
              error={errors.bot_token?.message}
              helperText="Token proporcionado por @BotFather"
            />
          )}
        />

        <FormField
          name="descripcion"
          control={control}
          label="Descripción (Opcional)"
          placeholder="Breve descripción de qué hará tu bot"
          helperText="Ayuda a identificar el propósito del bot"
        />

        {/* Estado de carga */}
        {configurarTelegramMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <LoadingSpinner size="sm" text="Validando token y configurando workflow..." />
          </div>
        )}

        {/* Success state */}
        {configurarTelegramMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">¡Bot configurado exitosamente!</p>
                <p>El workflow de n8n ha sido creado y activado.</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-end pt-4 border-t gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={configurarTelegramMutation.isPending}
          >
            Saltar por ahora
          </Button>
          <Button
            type="submit"
            isLoading={configurarTelegramMutation.isPending}
            disabled={configurarTelegramMutation.isPending}
          >
            {configurarTelegramMutation.isPending
              ? 'Configurando...'
              : 'Configurar Bot'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Step7_WhatsAppIntegration;
