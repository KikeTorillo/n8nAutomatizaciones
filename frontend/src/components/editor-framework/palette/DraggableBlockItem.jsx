/**
 * ====================================================================
 * DRAGGABLE BLOCK ITEM
 * ====================================================================
 * Item de bloque draggable para variant="list" (usado en Invitaciones).
 * Diseño: Item horizontal con icono a la izquierda, nombre y descripción.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDraggableId, DEFAULT_UNIFORM_COLOR } from './paletteUtils';

/**
 * DraggableBlockItem - Item de bloque para layout lista
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {string} props.nombre - Nombre visible del bloque
 * @param {string} props.descripcion - Descripción visible inline
 * @param {React.ComponentType} props.icon - Icono del bloque
 * @param {Object} props.color - {bg, text, dark} o null para usar inline style
 * @param {Function} props.onClick - Callback al hacer clic
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {string} props.draggablePrefix - Prefijo para el ID draggable
 */
function DraggableBlockItem({
  tipo,
  nombre,
  descripcion = '',
  icon: Icon = Layout,
  color = DEFAULT_UNIFORM_COLOR,
  onClick,
  disabled = false,
  draggablePrefix = 'palette',
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: getDraggableId(tipo, draggablePrefix),
    data: {
      tipo,
      source: 'palette',
      type: 'palette-item',
      blockType: tipo,
    },
    disabled,
  });

  // Si color es null, usar inline style con color primario
  const useInlineStyle = color === null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing',
        'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700',
        'border border-transparent hover:border-primary-200 dark:hover:border-primary-800',
        'transition-all duration-200',
        isDragging && 'opacity-50 scale-95',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          !useInlineStyle && color?.bg,
          !useInlineStyle && color?.dark
        )}
        style={useInlineStyle ? { backgroundColor: 'rgba(117, 53, 114, 0.1)' } : undefined}
      >
        <Icon
          className={cn(
            'w-5 h-5',
            useInlineStyle
              ? 'text-primary-600 dark:text-primary-400'
              : color?.text
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {nombre}
        </p>
        {descripcion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {descripcion}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(DraggableBlockItem);
