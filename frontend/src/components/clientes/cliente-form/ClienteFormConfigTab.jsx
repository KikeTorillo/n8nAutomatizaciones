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
import { Controller } from 'react-hook-form';
import { Settings, MessageCircle, Bell, Heart, Power } from 'lucide-react';
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
    </div>
  );
});

export default ClienteFormConfigTab;
