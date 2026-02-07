/**
 * ====================================================================
 * UBICACION EDITOR
 * ====================================================================
 * Editor del bloque de ubicación para invitaciones digitales.
 * Permite mostrar mapa, dirección y enlace a Google Maps.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useMemo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import { BaseAutoSaveEditor, useBlockEditor } from '@/components/editor-framework';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * UbicacionEditor - Editor del bloque de ubicación
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 * @param {Array} props.ubicaciones - Ubicaciones del evento (desde el backend)
 */
function UbicacionEditor({
  contenido,
  estilos,
  onChange,
  tema,
  ubicaciones = [],
}) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.ubicacion,
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  // Opciones de ubicaciones disponibles (sin placeholder propio, Select ya lo tiene)
  const ubicacionOptions = useMemo(() => {
    return ubicaciones.map((ub) => ({
      value: String(ub.id),
      label: ub.nombre || 'Sin nombre',
    }));
  }, [ubicaciones]);

  return (
    <BaseAutoSaveEditor>
      <Input
        label="Título"
        value={form.titulo || ''}
        onChange={(e) => handleFieldChange('titulo', e.target.value)}
        placeholder="Ubicación"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo || ''}
        onChange={(e) => handleFieldChange('subtitulo', e.target.value)}
        placeholder="Te esperamos en este lugar especial"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Selector de ubicación */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Ubicaciones del evento
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Todas</span>
            <ToggleSwitch
              enabled={form.mostrar_todas || false}
              onChange={(val) => handleFieldChange('mostrar_todas', val)}
              label="Mostrar todas"
              size="sm"
            />
          </div>
        </div>

        {!form.mostrar_todas && (
          <Select
            label="Ubicación específica"
            value={form.ubicacion_id != null ? String(form.ubicacion_id) : ''}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange('ubicacion_id', val ? Number(val) : null);
            }}
            options={ubicacionOptions}
            className="dark:bg-gray-600 dark:border-gray-500"
          />
        )}

        {ubicaciones.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ExternalLink className="w-3 h-3" />
            Agrega ubicaciones en la pestaña "Ubicaciones" del evento
          </p>
        )}
      </div>

      {/* Mostrar mapa */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Mostrar mapa interactivo
        </span>
        <ToggleSwitch
          enabled={form.mostrar_mapa !== false}
          onChange={(val) => handleFieldChange('mostrar_mapa', val)}
          label="Mostrar mapa"
          size="sm"
        />
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(UbicacionEditor);
