/**
 * ====================================================================
 * SIDEBAR CONTAINER - INVITACIONES
 * ====================================================================
 * Sidebar con la paleta de bloques para arrastrar al canvas.
 * Responsive: oculto en móvil, visible en tablet/desktop.
 *
 * @version 1.1.0 - Agregado soporte responsive
 * @since 2026-02-03
 */

import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useEditorLayoutContext } from '@/components/editor-framework';
import { BLOQUES_INVITACION } from '../config';
import { useInvitacionEditor } from '../context';

/**
 * SidebarContainer - Sidebar con paleta de bloques
 */
function SidebarContainer() {
  const { modoPreview, handleAgregarBloque } = useInvitacionEditor();
  const { showSidebar } = useEditorLayoutContext();

  // Ocultar en modo preview o en móvil
  if (modoPreview || !showSidebar) return null;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Bloques
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Arrastra o haz clic para agregar
        </p>
      </div>

      {/* Lista de bloques */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {BLOQUES_INVITACION.map((bloque) => (
          <DraggableBlockItem
            key={bloque.tipo}
            bloque={bloque}
            onClick={() => handleAgregarBloque(bloque.tipo)}
          />
        ))}
      </div>
    </aside>
  );
}

/**
 * DraggableBlockItem - Ítem de bloque draggable
 */
const DraggableBlockItem = memo(function DraggableBlockItem({ bloque, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${bloque.tipo}`,
    data: {
      type: 'palette-item',
      blockType: bloque.tipo,
    },
  });

  const Icon = bloque.icon;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing',
        'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700',
        'border border-transparent hover:border-primary-200 dark:hover:border-primary-800',
        'transition-all duration-200',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(117, 53, 114, 0.1)' }}
      >
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {bloque.label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {bloque.descripcion}
        </p>
      </div>
    </div>
  );
});

export default memo(SidebarContainer);
