/**
 * ====================================================================
 * ELEMENTS PALETTE
 * ====================================================================
 * Panel de paleta de elementos para arrastrar al canvas.
 * Muestra elementos disponibles agrupados por categoría.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, GripVertical, Plus } from 'lucide-react';
import {
  getElementTypesByCategory,
  ELEMENT_CATEGORIES,
  createElementFromType,
} from '../elements/elementTypes';

// ========== DRAGGABLE ELEMENT ITEM ==========

function DraggableElementItem({ type, onAdd }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `element-${type.tipo}`,
    data: {
      type: 'new-element',
      elementType: type.tipo,
    },
  });

  const Icon = type.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'element-item flex items-center gap-2 p-2 rounded-md cursor-grab',
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'hover:border-primary-300 dark:hover:border-primary-600',
        'hover:shadow-sm transition-all duration-150',
        isDragging && 'opacity-50 shadow-lg',
      )}
      onClick={() => onAdd?.(type.tipo)}
    >
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
        {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">
        {type.label}
      </span>
      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  );
}

// ========== CATEGORY GROUP ==========

function CategoryGroup({ category, types, onAddElement, defaultExpanded = true }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const categoryInfo = ELEMENT_CATEGORIES[category] || { label: category, orden: 99 };

  return (
    <div className="category-group">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 text-sm font-semibold',
          'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100',
          'transition-colors duration-150',
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        {categoryInfo.label}
        <span className="ml-auto text-xs text-gray-400">{types.length}</span>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 gap-1.5 px-2 pb-3">
          {types.map((type) => (
            <DraggableElementItem
              key={type.tipo}
              type={type}
              onAdd={onAddElement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== MAIN COMPONENT ==========

function ElementsPalette({
  availableTypes = null,
  onAddElement,
  sectionId,
  className,
  title = 'Elementos',
  showQuickAdd = true,
}) {
  // Obtener tipos agrupados por categoría
  const typesByCategory = useMemo(
    () => getElementTypesByCategory(availableTypes),
    [availableTypes]
  );

  // Ordenar categorías
  const sortedCategories = useMemo(() => {
    return Object.entries(typesByCategory).sort((a, b) => {
      const orderA = ELEMENT_CATEGORIES[a[0]]?.orden ?? 99;
      const orderB = ELEMENT_CATEGORIES[b[0]]?.orden ?? 99;
      return orderA - orderB;
    });
  }, [typesByCategory]);

  // Handler para agregar elemento
  const handleAddElement = useCallback((tipo) => {
    const nuevoElemento = createElementFromType(tipo);
    onAddElement?.(nuevoElemento, sectionId);
  }, [onAddElement, sectionId]);

  // Elementos quick-add (los más usados)
  const quickAddTypes = useMemo(() => {
    const allTypes = Object.values(typesByCategory).flat();
    // Seleccionar los primeros 4 tipos más comunes
    return allTypes.slice(0, 4);
  }, [typesByCategory]);

  return (
    <div className={cn('elements-palette h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>

      {/* Quick Add (elementos frecuentes) */}
      {showQuickAdd && quickAddTypes.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Agregar rápido
          </p>
          <div className="flex flex-wrap gap-2">
            {quickAddTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.tipo}
                  type="button"
                  onClick={() => handleAddElement(type.tipo)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                    'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
                    'hover:bg-primary-100 dark:hover:bg-primary-900/50',
                    'transition-colors duration-150',
                  )}
                >
                  <Plus className="w-3 h-3" />
                  {Icon && <Icon className="w-3 h-3" />}
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de categorías */}
      <div className="flex-1 overflow-y-auto py-2">
        {sortedCategories.map(([category, types]) => (
          <CategoryGroup
            key={category}
            category={category}
            types={types}
            onAddElement={handleAddElement}
            defaultExpanded={category === 'basico'}
          />
        ))}
      </div>

      {/* Footer con instrucciones */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Arrastra un elemento al canvas o haz clic para agregarlo
        </p>
      </div>
    </div>
  );
}

ElementsPalette.propTypes = {
  availableTypes: PropTypes.arrayOf(PropTypes.string),
  onAddElement: PropTypes.func.isRequired,
  sectionId: PropTypes.string,
  className: PropTypes.string,
  title: PropTypes.string,
  showQuickAdd: PropTypes.bool,
};

export default memo(ElementsPalette);
