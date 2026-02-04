/**
 * ====================================================================
 * DRAGGABLE BLOCK CARD
 * ====================================================================
 * Card de bloque draggable para variant="grid" (usado en Website).
 * Diseño: Card vertical con icono arriba y nombre abajo.
 *
 * @version 1.0.0
 * @since 2026-02-04
 */

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDraggableId, DEFAULT_UNIFORM_COLOR } from './paletteUtils';

/**
 * DraggableBlockCard - Card de bloque para layout grid
 *
 * @param {Object} props
 * @param {string} props.tipo - Tipo de bloque
 * @param {string} props.nombre - Nombre visible del bloque
 * @param {string} props.descripcion - Descripción (tooltip)
 * @param {React.ComponentType} props.icon - Icono del bloque
 * @param {Object} props.color - {bg, text, dark}
 * @param {Function} props.onClick - Callback al hacer clic
 * @param {boolean} props.disabled - Si está deshabilitado
 * @param {boolean} props.isInDrawer - Si está en drawer móvil
 * @param {string} props.draggablePrefix - Prefijo para el ID draggable
 */
function DraggableBlockCard({
  tipo,
  nombre,
  descripcion = '',
  icon: Icon = Layout,
  color = DEFAULT_UNIFORM_COLOR,
  onClick,
  disabled = false,
  isInDrawer = false,
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

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-left',
        'transition-all cursor-grab active:cursor-grabbing',
        'hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md',
        'group relative',
        isInDrawer ? 'p-4' : 'p-3',
        isDragging && 'opacity-50 scale-95',
        disabled &&
          'opacity-50 cursor-not-allowed hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-none'
      )}
      title={descripcion}
    >
      {/* Drag indicator - oculto en móvil */}
      {!isInDrawer && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3 h-3 text-gray-300 dark:text-gray-600" />
        </div>
      )}

      <div
        className={cn(
          'rounded-lg flex items-center justify-center mb-2',
          'group-hover:scale-110 transition-transform',
          color.bg,
          color.dark,
          isInDrawer ? 'w-10 h-10' : 'w-8 h-8'
        )}
      >
        <Icon className={cn(color.text, isInDrawer ? 'w-5 h-5' : 'w-4 h-4')} />
      </div>
      <p
        className={cn(
          'font-medium text-gray-900 dark:text-gray-100',
          isInDrawer ? 'text-sm' : 'text-xs'
        )}
      >
        {nombre}
      </p>
    </div>
  );
}

export default memo(DraggableBlockCard);
