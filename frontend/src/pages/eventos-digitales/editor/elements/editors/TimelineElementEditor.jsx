/**
 * ====================================================================
 * TIMELINE ELEMENT EDITOR
 * ====================================================================
 * Editor de propiedades para elementos de tipo timeline.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2, GripVertical, Clock, MapPin, ChevronUp, ChevronDown } from 'lucide-react';
import {
  TextField,
  TextareaField,
  SelectField,
  TabContent,
} from '@/components/editor-framework';
import { TABS } from '@/components/editor-framework';
import { cn } from '@/lib/utils';

// ========== OPTIONS ==========

const LAYOUT_OPTIONS = [
  { value: 'vertical', label: 'Vertical (timeline)' },
  { value: 'horizontal', label: 'Horizontal (tarjetas)' },
];

// ========== TIMELINE ITEM EDITOR ==========

function TimelineItemEditor({ item, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (field, value) => {
    onChange(index, { ...item, [field]: value });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className="flex-1 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            {item.hora && (
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded">
                {item.hora}
              </span>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {item.titulo || 'Sin título'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(index)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Hora"
              value={item.hora || ''}
              onChange={(v) => handleChange('hora', v)}
              placeholder="14:00"
            />
            <TextField
              label="Título"
              value={item.titulo || ''}
              onChange={(v) => handleChange('titulo', v)}
              placeholder="Actividad"
            />
          </div>
          <TextareaField
            label="Descripción"
            value={item.descripcion || ''}
            onChange={(v) => handleChange('descripcion', v)}
            placeholder="Descripción de la actividad..."
            rows={2}
          />
          <TextField
            label="Ubicación"
            value={item.ubicacion || ''}
            onChange={(v) => handleChange('ubicacion', v)}
            placeholder="Opcional"
          />
        </div>
      )}
    </div>
  );
}

// ========== MAIN COMPONENT ==========

function TimelineElementEditor({
  elemento,
  onChange,
  activeTab = TABS.CONTENIDO,
}) {
  const { contenido = {}, estilos = {} } = elemento;
  const items = contenido.items || [];

  // Handlers
  const handleContenidoChange = useCallback((field, value) => {
    onChange({
      contenido: {
        ...contenido,
        [field]: value,
      },
    });
  }, [contenido, onChange]);

  const handleEstilosChange = useCallback((field, value) => {
    onChange({
      estilos: {
        ...estilos,
        [field]: value,
      },
    });
  }, [estilos, onChange]);

  // Items handlers
  const handleItemChange = useCallback((index, newItem) => {
    const newItems = [...items];
    newItems[index] = newItem;
    handleContenidoChange('items', newItems);
  }, [items, handleContenidoChange]);

  const handleAddItem = useCallback(() => {
    const newItems = [...items, { hora: '', titulo: '', descripcion: '', ubicacion: '' }];
    handleContenidoChange('items', newItems);
  }, [items, handleContenidoChange]);

  const handleDeleteItem = useCallback((index) => {
    const newItems = items.filter((_, i) => i !== index);
    handleContenidoChange('items', newItems);
  }, [items, handleContenidoChange]);

  const handleMoveUp = useCallback((index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    handleContenidoChange('items', newItems);
  }, [items, handleContenidoChange]);

  const handleMoveDown = useCallback((index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    handleContenidoChange('items', newItems);
  }, [items, handleContenidoChange]);

  return (
    <div className="timeline-element-editor space-y-4">
      {/* Tab Contenido */}
      <TabContent isActive={activeTab === TABS.CONTENIDO}>
        <div className="space-y-4">
          <TextField
            label="Título de la sección"
            value={contenido.titulo || ''}
            onChange={(v) => handleContenidoChange('titulo', v)}
            placeholder="Itinerario"
          />

          <TextField
            label="Subtítulo"
            value={contenido.subtitulo || ''}
            onChange={(v) => handleContenidoChange('subtitulo', v)}
            placeholder="Opcional"
          />

          <SelectField
            label="Layout"
            value={contenido.layout || 'vertical'}
            onChange={(v) => handleContenidoChange('layout', v)}
            options={LAYOUT_OPTIONS}
          />

          {/* Items del timeline */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Actividades ({items.length})
              </p>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay actividades. Haz clic en "Agregar" para crear una.
                </p>
              ) : (
                items.map((item, index) => (
                  <TimelineItemEditor
                    key={index}
                    item={item}
                    index={index}
                    onChange={handleItemChange}
                    onDelete={handleDeleteItem}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </TabContent>

      {/* Tab Estilos */}
      <TabContent isActive={activeTab === TABS.ESTILOS}>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Los colores se heredan del tema de la invitación.
          </p>
        </div>
      </TabContent>
    </div>
  );
}

TimelineElementEditor.propTypes = {
  elemento: PropTypes.shape({
    contenido: PropTypes.shape({
      titulo: PropTypes.string,
      subtitulo: PropTypes.string,
      items: PropTypes.array,
      layout: PropTypes.string,
    }),
    estilos: PropTypes.object,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  activeTab: PropTypes.string,
};

export default memo(TimelineElementEditor);
