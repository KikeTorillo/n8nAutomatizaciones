/**
 * ====================================================================
 * TIMELINE EDITOR (INVITACIONES - ITINERARIO)
 * ====================================================================
 * Editor del bloque de itinerario/programa del día.
 * Permite agregar eventos con hora, título, descripción e icono.
 *
 * Features:
 * - Acordeón colapsable: solo una actividad expandida a la vez
 * - Drag & drop para reordenar actividades
 * - Auto-expandir al agregar nueva actividad
 *
 * GUARDADO AUTOMÁTICO: Los cambios se propagan inmediatamente al store
 * y se guardan automáticamente después de 2s de inactividad.
 *
 * @version 3.0.0
 * @since 2026-02-03
 * @updated 2026-02-07 - Acordeón colapsable + DnD reordenar
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { Clock, Plus, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Input, Textarea, Select, IconPickerCompact } from '@/components/ui';
import { ColorField, useBlockEditor, useArrayItemHandlers } from '@/components/editor-framework';
import { BLOCK_DEFAULTS } from '../../config';

// ========== SORTABLE ACTIVITY ITEM ==========

const SortableActivityItem = memo(function SortableActivityItem({
  id,
  item,
  index,
  isExpanded,
  onToggle,
  onDelete,
  onChange,
  tema,
  canDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
    >
      {/* Header — siempre visible */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Handle de drag */}
        <button
          type="button"
          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <Clock
          className="w-4 h-4 flex-shrink-0"
          style={{ color: tema?.color_primario || '#ec4899' }}
        />

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
          {item.hora ? `${item.hora} — ` : ''}{item.titulo || 'Nueva actividad'}
        </span>

        {canDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Cuerpo — solo si expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-200 dark:border-gray-600 space-y-3">
          <Input
            label="Hora"
            type="time"
            value={item.hora || ''}
            onChange={(e) => onChange(index, 'hora', e.target.value)}
            className="dark:bg-gray-600 dark:border-gray-500"
          />

          <Input
            label="Título"
            value={item.titulo || ''}
            onChange={(e) => onChange(index, 'titulo', e.target.value)}
            placeholder="Ceremonia"
            className="dark:bg-gray-600 dark:border-gray-500"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Icono
            </label>
            <IconPickerCompact
              value={item.icono || 'Clock'}
              onChange={(val) => onChange(index, 'icono', val)}
              placeholder="Seleccionar icono"
            />
          </div>

          <Textarea
            label="Descripción (opcional)"
            value={item.descripcion || ''}
            onChange={(e) => onChange(index, 'descripcion', e.target.value)}
            placeholder="Breve descripción"
            rows={2}
            className="dark:bg-gray-600 dark:border-gray-500"
          />
        </div>
      )}
    </div>
  );
});

// ========== MAIN EDITOR ==========

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
  const [expandedIndex, setExpandedIndex] = useState(null);

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
  const { form, handleFieldChange, handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange, handleArrayItemReorder } = useBlockEditor(contenido, defaultValues, {
    estilos,
    onChange,
    bloqueIdKey: '_bloqueId',
  });

  const {
    handleAgregar: handleAgregarItem,
    handleEliminar: handleEliminarItem,
    handleChange: handleChangeItem,
    handleReordenar,
  } = useArrayItemHandlers(
    { handleArrayItemAdd, handleArrayItemRemove, handleArrayItemChange, handleArrayItemReorder },
    'items',
    defaultItem
  );

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // IDs estables para dnd-kit
  const sortableIds = useMemo(
    () => (form.items || []).map((_, i) => `activity-${i}`),
    [form.items]
  );

  // Handler de drag end
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortableIds.indexOf(active.id);
    const newIndex = sortableIds.indexOf(over.id);
    handleReordenar(oldIndex, newIndex);

    // Ajustar expandedIndex si cambió la posición del item expandido
    if (expandedIndex === oldIndex) {
      setExpandedIndex(newIndex);
    } else if (expandedIndex !== null) {
      if (oldIndex < expandedIndex && newIndex >= expandedIndex) {
        setExpandedIndex(expandedIndex - 1);
      } else if (oldIndex > expandedIndex && newIndex <= expandedIndex) {
        setExpandedIndex(expandedIndex + 1);
      }
    }
  }, [handleReordenar, expandedIndex, sortableIds]);

  // Agregar y auto-expandir
  const handleAgregarYExpandir = useCallback(() => {
    handleAgregarItem();
    setExpandedIndex((form.items || []).length);
  }, [handleAgregarItem, form.items]);

  // Eliminar y ajustar expanded
  const handleEliminarYAjustar = useCallback((index) => {
    handleEliminarItem(index);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && index < expandedIndex) {
      setExpandedIndex(expandedIndex - 1);
    }
  }, [handleEliminarItem, expandedIndex]);

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

      {/* Lista de actividades */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Actividades ({(form.items || []).length})
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={handleAgregarYExpandir}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {(form.items || []).map((item, index) => (
                <SortableActivityItem
                  key={sortableIds[index]}
                  id={sortableIds[index]}
                  item={item}
                  index={index}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  onDelete={() => handleEliminarYAjustar(index)}
                  onChange={handleChangeItem}
                  tema={tema}
                  canDelete={(form.items || []).length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export default memo(TimelineEditor);
