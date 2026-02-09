/**
 * ====================================================================
 * TAB CONFIGURACION - Cliente Form Drawer
 * ====================================================================
 *
 * Contiene: Marketing, Canales digitales, Notas medicas, Estado
 *
 * Enero 2026
 */

import { memo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Settings, MessageCircle, Bell, Heart, Power, CreditCard } from 'lucide-react';
import { FormGroup, Input, Textarea, Checkbox } from '@/components/ui';
import { ToggleSwitch } from '@/components/ui';

/**
 * Tab de configuracion del cliente
 */
const ClienteFormConfigTab = memo(function ClienteFormConfigTab({
  control,
  register,
  errors,
}) {
  // Watch para mostrar campos condicionales de crédito
  const permiteCredito = useWatch({ control, name: 'permite_credito' });

  return (
    <div className="space-y-6">
      {/* Marketing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Bell className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
          Comunicaciones
        </h3>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Controller
            name="marketing_permitido"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Marketing permitido</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recibir promociones, ofertas y novedades
                  </p>
                </div>
                <ToggleSwitch
                  enabled={field.value}
                  onChange={field.onChange}
                  label="Marketing permitido"
                />
              </div>
            )}
          />
        </div>
      </div>

      {/* Canales digitales */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Canales Digitales
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Conecta con el cliente a traves de mensajeria instantanea.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGroup
            label="WhatsApp"
            error={errors.whatsapp_phone?.message}
            helper="Formato: +521XXXXXXXXXX"
          >
            <Input
              {...register('whatsapp_phone')}
              placeholder="+521234567890"
              hasError={!!errors.whatsapp_phone}
            />
          </FormGroup>

          <FormGroup
            label="Telegram Chat ID"
            error={errors.telegram_chat_id?.message}
            helper="ID numerico del chat"
          >
            <Input
              {...register('telegram_chat_id')}
              placeholder="123456789"
              hasError={!!errors.telegram_chat_id}
            />
          </FormGroup>
        </div>
      </div>

      {/* Notas medicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Heart className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
          Notas Medicas / Alergias
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Informacion importante sobre la salud del cliente que el profesional debe conocer.
        </p>

        <FormGroup error={errors.notas_medicas?.message}>
          <Textarea
            {...register('notas_medicas')}
            rows={4}
            placeholder="Ej: Alergia al latex, condicion cardiaca, embarazo..."
            hasError={!!errors.notas_medicas}
          />
        </FormGroup>
      </div>

      {/* Estado */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <Power className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
          Estado del Cliente
        </h3>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Controller
            name="activo"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Cliente activo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Los clientes inactivos no aparecen en busquedas ni pueden agendar citas
                  </p>
                </div>
                <ToggleSwitch
                  enabled={field.value}
                  onChange={field.onChange}
                  label="Cliente activo"
                />
              </div>
            )}
          />
        </div>
      </div>

      {/* Crédito/Fiado */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
          Crédito / Fiado
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Permite que el cliente realice compras a crédito (fiado) en el punto de venta.
        </p>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <Controller
            name="permite_credito"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Habilitar crédito</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    El cliente podrá comprar a crédito hasta el límite establecido
                  </p>
                </div>
                <ToggleSwitch
                  enabled={field.value}
                  onChange={field.onChange}
                  label="Habilitar crédito"
                />
              </div>
            )}
          />
        </div>

        {/* Campos condicionales de crédito */}
        {permiteCredito && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <FormGroup
              label="Límite de Crédito"
              error={errors.limite_credito?.message}
              helper="Monto máximo que puede deber el cliente"
              required
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  $
                </span>
                <Input
                  {...register('limite_credito')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  hasError={!!errors.limite_credito}
                  className="pl-7"
                />
              </div>
            </FormGroup>

            <FormGroup
              label="Días de Crédito"
              error={errors.dias_credito?.message}
              helper="Plazo para pagar (1-365 días)"
            >
              <Input
                {...register('dias_credito')}
                type="number"
                min="1"
                max="365"
                placeholder="30"
                hasError={!!errors.dias_credito}
              />
            </FormGroup>
          </div>
        )}
      </div>
    </div>
  );
});

export default ClienteFormConfigTab;
