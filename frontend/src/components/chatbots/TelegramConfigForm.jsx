import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '@/components/forms/FormField';
import { Button, Input } from '@/components/ui';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

// Schema de validación para bot token de Telegram
const telegramSchema = z.object({
  nombre_bot: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  bot_token: z
    .string()
    .min(1, 'El token del bot es requerido')
    .regex(
      /^\d{8,10}:[A-Za-z0-9_-]{35,}$/,
      'Formato de token inválido. Debe ser: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890'
    ),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
});

/**
 * Formulario de configuración de Telegram Bot
 *
 * @param {Object} props
 * @param {Object} props.defaultValues - Valores por defecto del formulario
 * @param {Function} props.onSubmit - Callback al enviar el formulario
 * @param {Function} props.onSkip - Callback al saltar este paso
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} props.isSuccess - Estado de éxito
 */
function TelegramConfigForm({
  defaultValues = {},
  onSubmit,
  onSkip,
  isLoading = false,
  isSuccess = false,
}) {
  const [showInstructions, setShowInstructions] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(telegramSchema),
    defaultValues: {
      bot_token: defaultValues.bot_token || '',
      nombre_bot: defaultValues.nombre_bot || '',
      descripcion: defaultValues.descripcion || '',
    },
  });

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-primary-800 dark:text-primary-200">
            <p className="font-semibold mb-1">¿No tienes un bot de Telegram?</p>
            <p className="mb-2">
              Necesitas crear uno con @BotFather antes de continuar.
            </p>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline"
            >
              {showInstructions ? 'Ocultar instrucciones' : 'Ver instrucciones'}
            </button>
          </div>
        </div>
      </div>

      {/* Instrucciones colapsables */}
      {showInstructions && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Cómo crear un bot con @BotFather:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li>
              Abre Telegram y busca{' '}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium inline-flex items-center gap-1"
              >
                @BotFather
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              Envía el comando: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/newbot</code>
            </li>
            <li>Elige un nombre para tu bot (ej: "Mi Negocio Bot")</li>
            <li>
              Elige un username que termine en "bot" (ej: "minegocio_bot")
            </li>
            <li>
              @BotFather te dará un <strong>token</strong> que se ve así:
              <code className="block bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded mt-1 text-xs">
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
        {isLoading && (
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <LoadingSpinner size="sm" text="Validando token y configurando workflow..." />
          </div>
        )}

        {/* Success state */}
        {isSuccess && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-semibold mb-1">¡Bot configurado exitosamente!</p>
                <p>El workflow de n8n ha sido creado y activado.</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-end pt-4 border-t dark:border-gray-700 gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
          >
            Saltar por ahora
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Configurando...' : 'Configurar Bot'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TelegramConfigForm;
