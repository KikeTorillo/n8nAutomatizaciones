import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FormField from '@/components/forms/FormField';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

// Schema de validación para WhatsApp Business Cloud API
const whatsappSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  api_key: z
    .string()
    .min(10, 'El Access Token debe tener al menos 10 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'El Access Token solo puede contener letras, números, guiones y guiones bajos'),
  phone_number_id: z
    .string()
    .min(1, 'El Phone Number ID es requerido')
    .regex(/^\d+$/, 'El Phone Number ID debe ser numérico'),
  business_account_id: z
    .string()
    .regex(/^\d*$/, 'El Business Account ID debe ser numérico')
    .optional()
    .or(z.literal('')),
  webhook_verify_token: z
    .string()
    .regex(/^[A-Za-z0-9_-]*$/, 'Solo caracteres alfanuméricos, guiones y guiones bajos')
    .optional()
    .or(z.literal('')),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
});

/**
 * Formulario de configuración de WhatsApp Business Cloud API
 *
 * @param {Object} props
 * @param {Object} props.defaultValues - Valores por defecto del formulario
 * @param {Function} props.onSubmit - Callback al enviar el formulario
 * @param {Function} props.onSkip - Callback al saltar este paso
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} props.isSuccess - Estado de éxito
 */
function WhatsAppConfigForm({
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
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      nombre: defaultValues.nombre || '',
      api_key: defaultValues.api_key || '',
      phone_number_id: defaultValues.phone_number_id || '',
      business_account_id: defaultValues.business_account_id || '',
      webhook_verify_token: defaultValues.webhook_verify_token || '',
      descripcion: defaultValues.descripcion || '',
    },
  });

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-semibold mb-1">¿No tienes una cuenta de WhatsApp Business?</p>
            <p className="mb-2">
              Necesitas crear una cuenta de WhatsApp Business Cloud API en Meta for Developers.
            </p>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="text-green-600 hover:text-green-700 font-medium underline"
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
            Cómo obtener credenciales de WhatsApp Business Cloud API:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              Ve a{' '}
              <a
                href="https://developers.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
              >
                Meta for Developers
                <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Crea una nueva aplicación o selecciona una existente</li>
            <li>Agrega el producto "WhatsApp" a tu aplicación</li>
            <li>
              En la sección "WhatsApp", ve a{' '}
              <strong>Configuración {'>'} Números de teléfono</strong>
            </li>
            <li>
              Copia el <strong>Phone Number ID</strong> (ID del número de teléfono)
            </li>
            <li>
              Ve a <strong>Configuración {'>'} API</strong> y genera un{' '}
              <strong>Access Token</strong> (Token de acceso)
            </li>
            <li>
              Opcionalmente, copia el{' '}
              <strong>Business Account ID</strong> desde la configuración de la cuenta
            </li>
          </ol>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
            <p className="text-xs text-yellow-800">
              <strong>Importante:</strong> El Access Token es sensible. Guárdalo de forma segura
              y nunca lo compartas públicamente.
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          name="nombre"
          control={control}
          label="Nombre del Bot"
          placeholder="Ej: WhatsApp Asistente Agendamiento"
          required
          helperText="Nombre descriptivo para identificar tu bot de WhatsApp"
        />

        <Controller
          name="api_key"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="password"
              label="Access Token (API Key)"
              placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
              error={errors.api_key?.message}
              helperText="Token de acceso de WhatsApp Business Cloud API"
            />
          )}
        />

        <Controller
          name="phone_number_id"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Phone Number ID"
              placeholder="123456789012345"
              required
              error={errors.phone_number_id?.message}
              helperText="ID del número de teléfono desde Meta for Developers"
            />
          )}
        />

        <Controller
          name="business_account_id"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Business Account ID (Opcional)"
              placeholder="123456789012345"
              error={errors.business_account_id?.message}
              helperText="ID de tu cuenta de negocio de WhatsApp"
            />
          )}
        />

        <Controller
          name="webhook_verify_token"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="text"
              label="Webhook Verify Token (Opcional)"
              placeholder="mi-token-seguro-123"
              error={errors.webhook_verify_token?.message}
              helperText="Token personalizado para verificación de webhook (se generará automáticamente si se deja vacío)"
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <LoadingSpinner size="sm" text="Validando credenciales con Meta y configurando workflow..." />
          </div>
        )}

        {/* Success state */}
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">¡Bot de WhatsApp configurado exitosamente!</p>
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

export default WhatsAppConfigForm;
