/**
 * ====================================================================
 * RSVP EDITOR
 * ====================================================================
 * Editor del bloque de confirmación de asistencia (RSVP).
 * Permite configurar campos del formulario de confirmación.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { CheckCircle, Users, UtensilsCrossed } from 'lucide-react';
import { Input, Textarea, ToggleSwitch } from '@/components/ui';
import { NumberField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * RSVPEditor - Editor del bloque de confirmación
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function RSVPEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.rsvp,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Componente de preview
  const preview = useMemo(() => {
    const colorPrimario = tema?.color_primario || '#753572';

    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-2 text-gray-900 dark:text-white">
          {form.titulo || 'Confirma tu Asistencia'}
        </h4>

        {form.subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo}
          </p>
        )}

        {/* Preview del formulario */}
        <div className="space-y-3 max-w-sm mx-auto">
          <input
            placeholder="Nombre completo"
            disabled
            className="w-full px-3 py-2 text-sm border dark:border-gray-600 dark:bg-gray-700 rounded"
          />

          <input
            placeholder="Correo electrónico"
            disabled
            className="w-full px-3 py-2 text-sm border dark:border-gray-600 dark:bg-gray-700 rounded"
          />

          {form.permitir_acompanantes && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ¿Cuántos asistirán? (máx. {form.max_acompanantes || 4})
              </span>
            </div>
          )}

          {form.pedir_restricciones && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <UtensilsCrossed className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Restricciones alimenticias
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 py-2 text-white text-sm rounded font-medium"
              style={{ backgroundColor: colorPrimario }}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Confirmar
            </button>
            <button className="flex-1 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              No puedo asistir
            </button>
          </div>
        </div>
      </div>
    );
  }, [form, tema?.color_primario]);

  return (
    <BaseAutoSaveEditor preview={preview}>
      <Input
        label="Título"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Confirma tu Asistencia"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo || ''}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Necesitamos saber si podrás acompañarnos"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Mensajes de respuesta */}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Mensaje al confirmar
        </h4>
        <Input
          value={form.texto_confirmado || ''}
          onChange={(e) => handleFieldChange('texto_confirmado', e.target.value)}
          placeholder="¡Gracias por confirmar!"
          className="dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mensaje al rechazar
        </h4>
        <Input
          value={form.texto_rechazado || ''}
          onChange={(e) => handleFieldChange('texto_rechazado', e.target.value)}
          placeholder="Lamentamos que no puedas asistir"
          className="dark:bg-gray-600 dark:border-gray-500"
        />
      </div>

      {/* Opciones del formulario */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Opciones del formulario
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <ToggleSwitch
              checked={form.permitir_acompanantes || false}
              onChange={(checked) => handleFieldChange('permitir_acompanantes', checked)}
              label="Permitir acompañantes"
            />
          </div>

          {form.permitir_acompanantes && (
            <NumberField
              label="Máximo de acompañantes"
              value={form.max_acompanantes || 4}
              onChange={(val) => handleFieldChange('max_acompanantes', val)}
              min={0}
              max={10}
            />
          )}

          <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
            <ToggleSwitch
              checked={form.pedir_restricciones || false}
              onChange={(checked) => handleFieldChange('pedir_restricciones', checked)}
              label="Preguntar restricciones alimenticias"
            />
          </div>
        </div>
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(RSVPEditor);
