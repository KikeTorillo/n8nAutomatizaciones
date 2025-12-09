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

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
      }
    : {};

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
        bg-white border border-gray-200 rounded-md
        hover:border-pink-300 hover:bg-pink-50
        transition-colors text-xs
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'shadow-lg ring-2 ring-pink-400' : ''}
      `}
    >
      {/* Avatar/Icono */}
      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        {numPersonas > 1 ? (
          <Users className="w-3 h-3 text-gray-600" />
        ) : (
          <User className="w-3 h-3 text-gray-600" />
        )}
      </div>

      {/* Nombre y número de personas */}
      <div className="min-w-0 max-w-[120px]">
        <p className="text-xs font-medium text-gray-900 truncate">
          {invitado.nombre}
        </p>
        {numPersonas > 1 && (
          <p className="text-[10px] text-gray-500 leading-tight">
            {numPersonas} pers.
          </p>
        )}
      </div>

      {/* Indicador visual para drag */}
      {isDraggable && (
        <div className="flex flex-col gap-0.5 opacity-30 ml-1">
          <div className="w-3 h-0.5 bg-gray-400 rounded" />
          <div className="w-3 h-0.5 bg-gray-400 rounded" />
        </div>
      )}
    </div>
  );
}

export default InvitadoChip;
