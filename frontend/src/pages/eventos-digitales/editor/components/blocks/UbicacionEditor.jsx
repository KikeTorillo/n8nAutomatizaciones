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
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Input, Textarea, Select, ToggleSwitch } from '@/components/ui';
import { NumberField, BaseAutoSaveEditor } from '@/components/editor-framework';
import { useInvitacionBlockEditor } from '../../hooks';
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
  const { form, handleFieldChange } = useInvitacionBlockEditor(
    contenido,
    estilos,
    defaultValues,
    onChange
  );

  // Opciones de ubicaciones disponibles
  const ubicacionOptions = useMemo(() => {
    const options = [{ value: '', label: 'Seleccionar ubicación...' }];
    ubicaciones.forEach((ub) => {
      options.push({
        value: ub.id,
        label: ub.nombre || 'Sin nombre',
      });
    });
    return options;
  }, [ubicaciones]);

  // Obtener la ubicación seleccionada
  const ubicacionSeleccionada = useMemo(() => {
    if (form.mostrar_todas) return null;
    return ubicaciones.find((u) => u.id === form.ubicacion_id);
  }, [ubicaciones, form.ubicacion_id, form.mostrar_todas]);

  // Componente de preview
  const preview = useMemo(() => {
    const colorPrimario = tema?.color_primario || '#753572';

    return (
      <div className="p-4">
        <h4 className="font-bold text-center mb-4 text-gray-900 dark:text-white">
          {form.titulo || 'Ubicación'}
        </h4>

        {form.subtitulo && (
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
            {form.subtitulo}
          </p>
        )}

        {/* Preview de ubicaciones */}
        <div className="space-y-4">
          {form.mostrar_todas ? (
            // Mostrar todas las ubicaciones
            ubicaciones.slice(0, 2).map((ub, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: colorPrimario }} />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                      {ub.nombre || 'Ubicación'}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {ub.direccion || 'Sin dirección'}
                    </p>
                  </div>
                  <Navigation className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))
          ) : ubicacionSeleccionada ? (
            // Mostrar ubicación específica
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: colorPrimario }} />
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                    {ubicacionSeleccionada.nombre || 'Ubicación'}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {ubicacionSeleccionada.direccion || 'Sin dirección'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Sin ubicación seleccionada
            <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecciona una ubicación
              </p>
            </div>
          )}

          {/* Preview del mapa */}
          {form.mostrar_mapa && (
            <div
              className="bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center"
              style={{ height: form.altura_mapa || 300 }}
            >
              <div className="text-center text-gray-500 dark:text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Mapa de ubicación</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [form, tema?.color_primario, ubicaciones, ubicacionSeleccionada]);

  return (
    <BaseAutoSaveEditor preview={preview}>
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
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Ubicaciones del evento
          </h4>
          <ToggleSwitch
            checked={form.mostrar_todas || false}
            onChange={(checked) => handleFieldChange('mostrar_todas', checked)}
            label="Mostrar todas"
          />
        </div>

        {!form.mostrar_todas && (
          <Select
            label="Ubicación específica"
            value={form.ubicacion_id || ''}
            onChange={(e) => handleFieldChange('ubicacion_id', e.target.value || null)}
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

      {/* Opciones del mapa */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mapa interactivo
          </h4>
          <ToggleSwitch
            checked={form.mostrar_mapa || false}
            onChange={(checked) => handleFieldChange('mostrar_mapa', checked)}
            label="Mostrar mapa"
          />
        </div>

        {form.mostrar_mapa && (
          <NumberField
            label="Altura del mapa (px)"
            value={form.altura_mapa || 300}
            onChange={(val) => handleFieldChange('altura_mapa', val)}
            min={200}
            max={600}
            step={50}
          />
        )}
      </div>
    </BaseAutoSaveEditor>
  );
}

export default memo(UbicacionEditor);
