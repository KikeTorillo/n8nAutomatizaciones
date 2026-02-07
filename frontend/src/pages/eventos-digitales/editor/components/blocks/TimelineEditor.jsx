/**
 * ====================================================================
 * TIMELINE EDITOR (INVITACIONES - ITINERARIO)
 * ====================================================================
 * Editor del bloque de itinerario/programa del día.
 * Permite agregar eventos con hora, título, descripción e icono.
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 2.0.0
 * @since 2026-02-03
 * @updated 2026-02-04 - Migrado a guardado automático
 */

import { memo, useCallback, useMemo } from 'react';
import { Clock, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button, Input, Textarea, Select, IconPickerCompact } from '@/components/ui';
import { ColorField, useBlockEditor } from '@/components/editor-framework';
import { BLOCK_DEFAULTS } from '../../config';

/**
 * TimelineEditor - Editor del bloque de itinerario
 *
 * @param {Object} props
 * @param {Object} props.contenido - Contenido del bloque
 * @param {Object} props.estilos - Estilos del bloque
 * @param {Function} props.onChange - Callback para cambios (guardado automático)
 * @param {Object} props.tema - Tema de la invitación
 */
function TimelineEditor({ contenido, estilos, onChange, tema }) {
  // Valores por defecto del formulario
  const defaultValues = useMemo(
    () => ({
      ...BLOCK_DEFAULTS.timeline,
    }),
    []
  );

  // Default item para nuevos eventos
  const defaultItem = useMemo(
    () => ({
      hora: '',
      titulo: 'Nueva actividad',
      descripcion: '',
      icono: 'Clock',
    }),
    []
  );

  // Hook para manejo del formulario con guardado automático
  const { form, handleFieldChange, handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  // Handlers para array de items
  const handleAgregarItem = useCallback(() => {
    handleArrayItemAdd('items', defaultItem);
  }, [handleArrayItemAdd, defaultItem]);

  const handleEliminarItem = useCallback((index) => {
    handleArrayItemRemove('items', index);
  }, [handleArrayItemRemove]);

  const handleChangeItem = useCallback((index, campo, valor) => {
    handleArrayItemChange('items', index, campo, valor);
  }, [handleArrayItemChange]);

  // Opciones de layout
  const layoutOptions = [
    { value: 'alternado', label: 'Alternado' },
    { value: 'izquierda', label: 'Izquierda' },
    { value: 'derecha', label: 'Derecha' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Configuración general */}
      <Input
        label="Título de sección"
        value={form.titulo_seccion || ''}
        onChange={(e) => handleFieldChange('titulo_seccion', e.target.value)}
        placeholder="Itinerario del Día"
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      <Textarea
        label="Subtítulo (opcional)"
        value={form.subtitulo_seccion || ''}
        onChange={(e) => handleFieldChange('subtitulo_seccion', e.target.value)}
        placeholder="El programa de actividades para el gran día"
        rows={2}
        className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
      />

      {/* Opciones de estilo */}
      <Select
        label="Disposición"
        value={form.layout || 'alternado'}
        onChange={(e) => handleFieldChange('layout', e.target.value)}
        options={layoutOptions}
        className="dark:bg-gray-700 dark:border-gray-600"
      />

      <ColorField
        label="Color de línea"
        value={form.color_linea || ''}
        onChange={(val) => handleFieldChange('color_linea', val)}
      />

      {/* Lista de eventos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Actividades ({(form.items || []).length})
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarItem}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        {(form.items || []).map((item, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                <Clock
                  className="w-4 h-4"
                  style={{ color: tema?.color_primario || '#753572' }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actividad {index + 1}
                </span>
              </div>
              {(form.items || []).length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarItem(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <Input
                label="Hora"
                type="time"
                value={item.hora || ''}
                onChange={(e) => handleChangeItem(index, 'hora', e.target.value)}
                className="dark:bg-gray-600 dark:border-gray-500"
              />

              <Input
                label="Título"
                value={item.titulo || ''}
                onChange={(e) => handleChangeItem(index, 'titulo', e.target.value)}
                placeholder="Ceremonia"
                className="dark:bg-gray-600 dark:border-gray-500"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Icono
                </label>
                <IconPickerCompact
                  value={item.icono || 'Clock'}
                  onChange={(val) => handleChangeItem(index, 'icono', val)}
                  placeholder="Seleccionar icono"
                />
              </div>

              <Textarea
                label="Descripción (opcional)"
                value={item.descripcion || ''}
                onChange={(e) => handleChangeItem(index, 'descripcion', e.target.value)}
                placeholder="Breve descripción"
                rows={2}
                className="dark:bg-gray-600 dark:border-gray-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(TimelineEditor);
