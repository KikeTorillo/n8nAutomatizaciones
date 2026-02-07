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
import { CheckCircle } from 'lucide-react';
import { Input, Textarea, ToggleSwitch } from '@/components/ui';
import { BaseAutoSaveEditor, useBlockEditor } from '@/components/editor-framework';
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
  const { form, handleFieldChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  return (
    <BaseAutoSaveEditor>
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

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Preguntar restricciones alimentarias
        </span>
        <ToggleSwitch
          enabled={form.pedir_restricciones || false}
          onChange={(val) => handleFieldChange('pedir_restricciones', val)}
          label="Preguntar restricciones alimentarias"
          size="sm"
        />
      </div>

    </BaseAutoSaveEditor>
  );
}

export default memo(RSVPEditor);
