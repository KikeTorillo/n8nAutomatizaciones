import { useDraggable } from '@dnd-kit/core';
import { User, Users } from 'lucide-react';

/**
 * Chip draggable de invitado para asignar a mesa
 */
function InvitadoChip({ invitado, isDraggable = true }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `invitado-${invitado.id}`,
    disabled: !isDraggable,
  });

  const style = {
    ...(transform
      ? {
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 100 : 1,
        }
      : {}),
    touchAction: isDraggable ? 'none' : 'auto', // Crítico para touch/mobile drag
  };

  // Número de personas (invitado + acompañantes)
  const numPersonas = invitado.num_asistentes || 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md
        transition-colors text-xs
        ${isDraggable ? 'cursor-grab active:cursor-grabbing ring-2 ring-primary-300 dark:ring-primary-600 hover:ring-primary-400 dark:hover:ring-primary-500' : ''}
        ${isDragging ? 'shadow-lg ring-2 ring-pink-400' : ''}
      `}
    >
      {/* Avatar/Icono */}
      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        {numPersonas > 1 ? (
          <Users className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        ) : (
          <User className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        )}
      </div>

      {/* Nombre y número de personas */}
      <div className="min-w-0 max-w-[120px]">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
          {invitado.nombre}
        </p>
        {numPersonas > 1 && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
            {numPersonas} pers.
          </p>
        )}
      </div>

      {/* Indicador visual para drag */}
      {isDraggable && (
        <div className="flex flex-col gap-0.5 opacity-30 ml-1">
          <div className="w-3 h-0.5 bg-gray-400 dark:bg-gray-500 rounded" />
          <div className="w-3 h-0.5 bg-gray-400 dark:bg-gray-500 rounded" />
        </div>
      )}
    </div>
  );
}

export default InvitadoChip;
