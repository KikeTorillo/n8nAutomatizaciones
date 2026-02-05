/**
 * ====================================================================
 * LAYERS PANEL
 * ====================================================================
 * Panel de capas para visualizar y reordenar elementos por z-index.
 * Muestra una lista de todos los elementos de la sección actual.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { getElementType } from '../elements/elementTypes';

// ========== LAYER ITEM ==========

function LayerItem({
  elemento,
  isSelected,
  onSelect,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
}) {
  const elementType = getElementType(elemento.tipo);
  const Icon = elementType?.icon;
  const isHidden = elemento.visible === false;

  // Texto descriptivo del elemento
  const displayText = useMemo(() => {
    if (elemento.contenido?.texto) {
      return elemento.contenido.texto.substring(0, 30) + (elemento.contenido.texto.length > 30 ? '...' : '');
    }
    return elementType?.label || elemento.tipo;
  }, [elemento, elementType]);

  return (
    <div
      className={cn(
        'layer-item flex items-center gap-2 px-2 py-1.5 cursor-pointer',
        'hover:bg-gray-100 dark:hover:bg-gray-700/50',
        'transition-colors duration-100',
        isSelected && 'bg-primary-50 dark:bg-primary-900/30 border-l-2 border-primary-500',
        isHidden && 'opacity-50',
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <GripVertical className="w-3 h-3 text-gray-400 cursor-grab flex-shrink-0" />

      {/* Icon */}
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-500" />}
      </div>

      {/* Name */}
      <span className={cn(
        'flex-1 text-sm truncate',
        isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300',
      )}>
        {displayText}
      </span>

      {/* Layer (z-index) */}
      <span className="text-xs text-gray-400 w-6 text-center flex-shrink-0">
        {elemento.capa || 1}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp?.();
          }}
          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Subir capa"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown?.();
          }}
          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Bajar capa"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility?.();
          }}
          className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title={isHidden ? 'Mostrar' : 'Ocultar'}
        >
          {isHidden ? (
            <EyeOff className="w-3 h-3" />
          ) : (
            <Eye className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}

// ========== MAIN COMPONENT ==========

function LayersPanel({
  elementos = [],
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onMoveLayer,
  onReorderElements,
  className,
}) {
  // Ordenar elementos por capa (mayor primero = más arriba en la lista)
  const sortedElements = useMemo(() => {
    return [...elementos].sort((a, b) => (b.capa || 1) - (a.capa || 1));
  }, [elementos]);

  // Handlers
  const handleMoveUp = useCallback((elementId) => {
    onMoveLayer?.(elementId, 'up');
  }, [onMoveLayer]);

  const handleMoveDown = useCallback((elementId) => {
    onMoveLayer?.(elementId, 'down');
  }, [onMoveLayer]);

  return (
    <div className={cn('layers-panel h-full flex flex-col bg-white dark:bg-gray-800', className)}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <Layers className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Capas
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {elementos.length}
        </span>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto py-1">
        {sortedElements.length > 0 ? (
          sortedElements.map((elemento) => (
            <LayerItem
              key={elemento.id}
              elemento={elemento}
              isSelected={elemento.id === selectedElementId}
              onSelect={() => onSelectElement?.(elemento.id)}
              onToggleVisibility={() => onToggleVisibility?.(elemento.id)}
              onMoveUp={() => handleMoveUp(elemento.id)}
              onMoveDown={() => handleMoveDown(elemento.id)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4">
            No hay elementos
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Mayor número = más arriba
        </p>
      </div>
    </div>
  );
}

LayersPanel.propTypes = {
  elementos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      tipo: PropTypes.string.isRequired,
      capa: PropTypes.number,
      visible: PropTypes.bool,
      contenido: PropTypes.object,
    })
  ),
  selectedElementId: PropTypes.string,
  onSelectElement: PropTypes.func,
  onToggleVisibility: PropTypes.func,
  onMoveLayer: PropTypes.func,
  onReorderElements: PropTypes.func,
  className: PropTypes.string,
};

export default memo(LayersPanel);
