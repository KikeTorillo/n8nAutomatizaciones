/**
 * ====================================================================
 * TIMELINE ITEMS DRAWER
 * ====================================================================
 * Drawer para editar los hitos del bloque Timeline con:
 * - Lista sortable usando dnd-kit
 * - Agregar/editar/eliminar hitos
 * - Campos: fecha, título, descripción, icono
 * - Reordenar con drag & drop
 *
 * @version 1.0.0
 * @since 2026-02-01
 */

import { useState, useMemo, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  DragOverlay,
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
  Rocket,
  Flag,
  MapPin,
  Award,
  Users,
  Building,
  Star,
  Zap,
  Target,
  Heart,
} from 'lucide-react';
import { Drawer, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

// ========== ICON OPTIONS ==========

const ICON_OPTIONS = [
  { value: 'rocket', label: 'Cohete', Icon: Rocket },
  { value: 'flag', label: 'Bandera', Icon: Flag },
  { value: 'star', label: 'Estrella', Icon: Star },
  { value: 'zap', label: 'Rayo', Icon: Zap },
  { value: 'award', label: 'Premio', Icon: Award },
  { value: 'users', label: 'Usuarios', Icon: Users },
  { value: 'building', label: 'Edificio', Icon: Building },
  { value: 'target', label: 'Objetivo', Icon: Target },
  { value: 'heart', label: 'Corazón', Icon: Heart },
  { value: 'map-pin', label: 'Ubicación', Icon: MapPin },
];

// ========== TIMELINE ITEM (Sortable) ==========

const TimelineItemCard = memo(function TimelineItemCard({
  item,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
  isDragging = false,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;
  const IconComponent = ICON_OPTIONS.find((opt) => opt.value === item.icono)?.Icon || Star;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        dragging ? 'shadow-lg opacity-90 ring-2 ring-primary-500' : 'shadow-sm',
        'transition-shadow'
      )}
    >
      {/* Header - siempre visible */}
      <div className="flex items-center gap-3 p-3">
        {/* Handle de drag */}
        <button
          type="button"
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Icono del hito */}
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>

        {/* Info resumida */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
            {item.fecha || 'Sin fecha'} - {item.titulo || 'Sin título'}
          </span>
        </div>

        {/* Botones */}
        <button
          type="button"
          onClick={() => onToggleExpand(item._id)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(item._id)}
          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Campos expandidos */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Fecha
            </label>
            <input
              type="text"
              value={item.fecha || ''}
              onChange={(e) => onChange(item._id, 'fecha', e.target.value)}
              placeholder="Ej: 2020, Enero 2021, Q1 2022"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Icono */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Icono
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map(({ value, label, Icon: IconOption }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange(item._id, 'icono', value)}
                  title={label}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    item.icono === value
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <IconOption className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Título
            </label>
            <input
              type="text"
              value={item.titulo || ''}
              onChange={(e) => onChange(item._id, 'titulo', e.target.value)}
              placeholder="Título del hito"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Descripción
            </label>
            <textarea
              value={item.descripcion || ''}
              onChange={(e) => onChange(item._id, 'descripcion', e.target.value)}
              placeholder="Descripción del hito"
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
});

TimelineItemCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    fecha: PropTypes.string,
    titulo: PropTypes.string,
    descripcion: PropTypes.string,
    icono: PropTypes.string,
  }).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDragging: PropTypes.bool,
};

// ========== MAIN DRAWER ==========

function TimelineItemsDrawer({ isOpen, onClose, items = [], onChange }) {
  // Agregar _id temporal a cada item para el drag & drop
  const itemsWithIds = useMemo(() => {
    return items.map((item, index) => ({
      ...item,
      _id: item._id || `item-${index}`,
    }));
  }, [items]);

  // Estado local mientras se edita
  const [localItems, setLocalItems] = useState(itemsWithIds);
  const [expandedId, setExpandedId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // Sincronizar cuando se abre el drawer
  useMemo(() => {
    if (isOpen) {
      setLocalItems(itemsWithIds);
      setExpandedId(null);
    }
  }, [isOpen, itemsWithIds]);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Item activo para overlay
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return localItems.find((item) => item._id === activeId);
  }, [activeId, localItems]);

  // Handlers de drag
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setLocalItems((items) => {
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Toggle expandir item
  const handleToggleExpand = useCallback((id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Cambiar campo de un item
  const handleItemChange = useCallback((id, field, value) => {
    setLocalItems((items) =>
      items.map((item) => (item._id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  // Eliminar item
  const handleDeleteItem = useCallback((id) => {
    setLocalItems((items) => items.filter((item) => item._id !== id));
  }, []);

  // Agregar nuevo item
  const handleAddItem = useCallback(() => {
    const newItem = {
      _id: `item-${Date.now()}`,
      fecha: '',
      titulo: '',
      descripcion: '',
      icono: 'star',
    };
    setLocalItems((items) => [...items, newItem]);
    setExpandedId(newItem._id);
  }, []);

  // Guardar cambios
  const handleSave = useCallback(() => {
    // Remover _id temporal antes de guardar
    // eslint-disable-next-line no-unused-vars
    const cleanItems = localItems.map(({ _id, ...rest }) => rest);
    onChange(cleanItems);
    onClose();
  }, [localItems, onChange, onClose]);

  // Cancelar
  const handleCancel = useCallback(() => {
    setLocalItems(itemsWithIds);
    onClose();
  }, [itemsWithIds, onClose]);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleCancel}
      title="Editar Hitos del Timeline"
      subtitle="Arrastra para reordenar, expande para editar"
      size="full"
      showCloseButton
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </div>
      }
    >
      {/* Botón agregar */}
      <div className="mb-4">
        <Button variant="outline" onClick={handleAddItem} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar hito
        </Button>
      </div>

      {/* Lista de hitos */}
      {localItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin hitos</p>
          <p className="text-sm mt-1">Agrega tu primer hito para comenzar</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={localItems.map((item) => item._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {localItems.map((item, index) => (
                <TimelineItemCard
                  key={item._id}
                  item={item}
                  index={index}
                  isExpanded={expandedId === item._id}
                  onToggleExpand={handleToggleExpand}
                  onChange={handleItemChange}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </SortableContext>

          {/* Overlay durante el drag */}
          <DragOverlay>
            {activeItem && (
              <TimelineItemCard
                item={activeItem}
                index={0}
                isExpanded={false}
                onToggleExpand={() => {}}
                onChange={() => {}}
                onDelete={() => {}}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </Drawer>
  );
}

TimelineItemsDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      fecha: PropTypes.string,
      titulo: PropTypes.string,
      descripcion: PropTypes.string,
      icono: PropTypes.string,
    })
  ),
  onChange: PropTypes.func.isRequired,
};

export default memo(TimelineItemsDrawer);
