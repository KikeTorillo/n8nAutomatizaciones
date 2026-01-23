import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Button,
  Checkbox,
  Drawer,
  FormGroup,
  Input,
  Select,
  Badge,
} from '@/components/ui';
import {
  useCrearConector,
  useActualizarConector,
  useGatewaysSoportados,
  useVerificarConector,
} from '@/hooks/suscripciones-negocio';
import { useToast } from '@/hooks/utils';

/**
 * Configuración de gateways y sus campos requeridos
 */
const GATEWAYS_CONFIG = {
  mercadopago: {
    nombre: 'MercadoPago',
    campos: [
      { name: 'access_token', label: 'Access Token', required: true, type: 'password' },
      { name: 'public_key', label: 'Public Key', required: false, type: 'text' },
    ],
    docUrl: 'https://www.mercadopago.com.mx/developers/panel/credentials',
  },
  stripe: {
    nombre: 'Stripe',
    campos: [
      { name: 'secret_key', label: 'Secret Key', required: true, type: 'password', prefix: 'sk_' },
      { name: 'publishable_key', label: 'Publishable Key', required: false, type: 'text', prefix: 'pk_' },
    ],
    docUrl: 'https://dashboard.stripe.com/apikeys',
  },
  paypal: {
    nombre: 'PayPal',
    campos: [
      { name: 'client_id', label: 'Client ID', required: true, type: 'text' },
      { name: 'client_secret', label: 'Client Secret', required: true, type: 'password' },
    ],
    docUrl: 'https://developer.paypal.com/dashboard/applications',
  },
  conekta: {
    nombre: 'Conekta',
    campos: [
      { name: 'private_key', label: 'Private Key', required: true, type: 'password', prefix: 'key_' },
    ],
    docUrl: 'https://panel.conekta.com/api-keys',
  },
};

const ENTORNOS = [
  { value: 'sandbox', label: 'Sandbox (Pruebas)' },
  { value: 'production', label: 'Produccion' },
];

/**
 * Schema de validación para conectores
 */
const conectorSchema = z.object({
  gateway: z.enum(['mercadopago', 'stripe', 'paypal', 'conekta']),
  entorno: z.enum(['sandbox', 'production']),
  nombre_display: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  webhook_url: z.string().optional().or(z.literal('')),
  webhook_secret: z.string().optional().or(z.literal('')),
  es_principal: z.boolean().default(false),
  credenciales: z.record(z.string()).optional(),
});

/**
 * Campo de credencial con toggle de visibilidad
 */
function CredentialField({ campo, register, errors, showPassword, onTogglePassword }) {
  const isPassword = campo.type === 'password';

  return (
    <FormGroup
      label={campo.label}
      error={errors.credenciales?.[campo.name]?.message}
      required={campo.required}
      helper={campo.prefix && `Debe empezar con "${campo.prefix}"`}
    >
      <div className="relative">
        <Input
          type={isPassword && !showPassword[campo.name] ? 'password' : 'text'}
          {...register(`credenciales.${campo.name}`)}
          hasError={!!errors.credenciales?.[campo.name]}
          placeholder={campo.prefix ? `${campo.prefix}...` : `Ingresa ${campo.label}`}
          className={isPassword ? 'pr-10' : ''}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => onTogglePassword(campo.name)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword[campo.name] ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </FormGroup>
  );
}

/**
 * Drawer para crear/editar conectores de pago
 */
function ConectorFormDrawer({ isOpen, onClose, conector = null, mode = 'create' }) {
  const { success: showSuccess, error: showError } = useToast();
  const esEdicion = mode === 'edit' && conector;

  // Estado para visibilidad de passwords
  const [showPassword, setShowPassword] = useState({});

  // Estado para resultado de verificación
  const [verificacionPendiente, setVerificacionPendiente] = useState(false);
  const [verificacionExitosa, setVerificacionExitosa] = useState(null);

  // Mutations
  const crearMutation = useCrearConector();
  const actualizarMutation = useActualizarConector();
  const verificarMutation = useVerificarConector({
    onSuccess: (data) => {
      setVerificacionPendiente(false);
      setVerificacionExitosa(data?.verificado ?? false);
    },
    onError: () => {
      setVerificacionPendiente(false);
      setVerificacionExitosa(false);
    },
  });

  const mutation = esEdicion ? actualizarMutation : crearMutation;

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    // resolver: zodResolver(conectorSchema), // TODO: Habilitar cuando se resuelva el error de Zod
    defaultValues: {
      gateway: 'mercadopago',
      entorno: 'sandbox',
      nombre_display: '',
      webhook_url: '',
      webhook_secret: '',
      es_principal: false,
      credenciales: {},
    },
  });

  const selectedGateway = watch('gateway');
  const selectedEntorno = watch('entorno');
  const gatewayConfig = GATEWAYS_CONFIG[selectedGateway];

  // Toggle visibilidad de password
  const handleTogglePassword = (campo) => {
    setShowPassword((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  // Cargar datos al editar
  useEffect(() => {
    if (esEdicion && conector) {
      reset({
        gateway: conector.gateway || 'mercadopago',
        entorno: conector.entorno || 'sandbox',
        nombre_display: conector.nombre_display || '',
        webhook_url: conector.webhook_url || '',
        webhook_secret: '', // No se muestra el secret existente por seguridad
        es_principal: conector.es_principal ?? false,
        credenciales: {}, // Credenciales no se cargan por seguridad
      });
      setVerificacionExitosa(conector.verificado ?? null);
    } else {
      reset({
        gateway: 'mercadopago',
        entorno: 'sandbox',
        nombre_display: '',
        webhook_url: '',
        webhook_secret: '',
        es_principal: false,
        credenciales: {},
      });
      setVerificacionExitosa(null);
    }
    setShowPassword({});
    setVerificacionPendiente(false);
  }, [esEdicion, conector, reset, isOpen]);

  // Submit handler
  const onSubmit = (data) => {
    // Limpiar campos vacíos de credenciales
    const credencialesLimpias = {};
    if (data.credenciales) {
      Object.entries(data.credenciales).forEach(([key, value]) => {
        if (value && value.trim()) {
          credencialesLimpias[key] = value.trim();
        }
      });
    }

    // Validar campos requeridos de credenciales
    if (!esEdicion) {
      const camposRequeridos = gatewayConfig.campos.filter((c) => c.required);
      const faltantes = camposRequeridos.filter((c) => !credencialesLimpias[c.name]);

      if (faltantes.length > 0) {
        showError(`Faltan credenciales requeridas: ${faltantes.map((c) => c.label).join(', ')}`);
        return;
      }
    }

    const payload = {
      gateway: data.gateway,
      entorno: data.entorno,
      nombre_display: data.nombre_display || undefined,
      webhook_url: data.webhook_url || undefined,
      webhook_secret: data.webhook_secret || undefined,
      es_principal: data.es_principal,
      credenciales: Object.keys(credencialesLimpias).length > 0 ? credencialesLimpias : undefined,
    };

    if (esEdicion) {
      mutation.mutate(
        { id: conector.id, data: payload },
        {
          onSuccess: () => {
            showSuccess('Conector actualizado correctamente');
            reset();
            onClose();
          },
          onError: (err) => {
            showError(err.message || 'Error al actualizar conector');
          },
        }
      );
    } else {
      mutation.mutate(payload, {
        onSuccess: (response) => {
          showSuccess('Conector creado correctamente');
          reset();
          onClose();
        },
        onError: (err) => {
          showError(err.message || 'Error al crear conector');
        },
      });
    }
  };

  // Verificar conectividad (solo en edición)
  const handleVerificar = () => {
    if (conector?.id) {
      setVerificacionPendiente(true);
      verificarMutation.mutate(conector.id);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Conector' : 'Nuevo Conector de Pago'}
      subtitle={
        esEdicion
          ? 'Modifica las credenciales del conector'
          : 'Configura un gateway de pago para procesar transacciones'
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Gateway y Entorno */}
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Gateway de Pago" error={errors.gateway?.message} required>
            <Select
              {...register('gateway')}
              hasError={!!errors.gateway}
              disabled={esEdicion}
            >
              {Object.entries(GATEWAYS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.nombre}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Entorno" error={errors.entorno?.message} required>
            <Select
              {...register('entorno')}
              hasError={!!errors.entorno}
              disabled={esEdicion}
            >
              {ENTORNOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </Select>
          </FormGroup>
        </div>

        {/* Warning para producción */}
        {selectedEntorno === 'production' && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium">Entorno de Producción</p>
              <p className="mt-1">
                Las credenciales de producción procesarán cobros reales. Asegúrate de usar las
                claves correctas.
              </p>
            </div>
          </div>
        )}

        {/* Nombre Display */}
        <FormGroup
          label="Nombre para Mostrar"
          error={errors.nombre_display?.message}
          helper="Nombre identificador en el sistema (opcional)"
        >
          <Input
            {...register('nombre_display')}
            hasError={!!errors.nombre_display}
            placeholder={`Mi ${gatewayConfig?.nombre || 'Conector'} ${selectedEntorno === 'production' ? 'Prod' : 'Test'}`}
          />
        </FormGroup>

        {/* Credenciales dinámicas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Credenciales de {gatewayConfig?.nombre}
            </h3>
            {gatewayConfig?.docUrl && (
              <a
                href={gatewayConfig.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Obtener credenciales
              </a>
            )}
          </div>

          {esEdicion && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Por seguridad, las credenciales actuales no se muestran. Deja en blanco para mantener
              las existentes.
            </p>
          )}

          {gatewayConfig?.campos.map((campo) => (
            <CredentialField
              key={campo.name}
              campo={campo}
              register={register}
              errors={errors}
              showPassword={showPassword}
              onTogglePassword={handleTogglePassword}
            />
          ))}
        </div>

        {/* Webhook Config */}
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Configuración de Webhook (Opcional)
          </h3>

          <FormGroup
            label="URL del Webhook"
            error={errors.webhook_url?.message}
            helper="URL donde el gateway enviará notificaciones de eventos"
          >
            <Input
              type="url"
              {...register('webhook_url')}
              hasError={!!errors.webhook_url}
              placeholder="https://tu-dominio.com/api/webhooks/pagos"
            />
          </FormGroup>

          <FormGroup
            label="Secreto del Webhook"
            error={errors.webhook_secret?.message}
            helper="Clave secreta para validar firmas de webhook"
          >
            <Input
              type="password"
              {...register('webhook_secret')}
              hasError={!!errors.webhook_secret}
              placeholder="whsec_..."
            />
          </FormGroup>
        </div>

        {/* Es Principal */}
        <Checkbox
          label="Establecer como conector principal"
          description="Se usará por defecto para procesar pagos de este gateway"
          {...register('es_principal')}
        />

        {/* Estado de verificación */}
        {esEdicion && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado de Verificación
              </span>
              {verificacionExitosa === true && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
              {verificacionExitosa === false && (
                <Badge variant="error">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Error
                </Badge>
              )}
              {verificacionExitosa === null && (
                <Badge variant="warning">Sin verificar</Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleVerificar}
              disabled={verificacionPendiente || verificarMutation.isPending}
              className="w-full"
            >
              {(verificacionPendiente || verificarMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Verificar Conectividad'
              )}
            </Button>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={mutation.isPending}>
            {esEdicion ? 'Actualizar' : 'Crear'} Conector
          </Button>
        </div>
      </form>
    </Drawer>
  );
}

export default ConectorFormDrawer;
