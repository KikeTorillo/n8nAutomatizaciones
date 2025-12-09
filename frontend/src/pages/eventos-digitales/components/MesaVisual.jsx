import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Edit2, Trash2, X, Check, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Input from '@/components/ui/Input';

/**
 * Componente visual de una mesa en el seating chart
 * - Draggable para mover posición
 * - Droppable para recibir invitados
 */
function MesaVisual({
  mesa,
  asignados,
  porcentaje,
  isEditing,
  onEdit,
  onDelete,
  onDesasignarInvitado,
  onSave,
  onCancelEdit,
}) {
  const [editData, setEditData] = useState({
    nombre: mesa.nombre,
    capacidad: mesa.capacidad,
  });
  const [showInvitados, setShowInvitados] = useState(false);

  // Draggable para mover mesa
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `mesa-${mesa.id}`,
    disabled: isEditing,
  });

  // Droppable para recibir invitados
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `mesa-${mesa.id}`,
    disabled: porcentaje >= 100,
  });

  // Combinar refs
  const setNodeRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  // Estilos según tipo de mesa
  const getMesaShape = () => {
    switch (mesa.tipo) {
      case 'cuadrada':
        return 'rounded-lg';
      case 'rectangular':
        return 'rounded-lg aspect-[2/1]';
      default:
        return 'rounded-full';
    }
  };

  // Color según ocupación
  const getOcupacionColor = () => {
    if (porcentaje >= 100) return 'border-red-400 bg-red-50';
    if (porcentaje >= 75) return 'border-yellow-400 bg-yellow-50';
    return 'border-green-400 bg-green-50';
  };

  // Tamaño según capacidad
  const getSize = () => {
    if (mesa.capacidad <= 4) return 'w-20 h-20';
    if (mesa.capacidad <= 8) return 'w-24 h-24';
    if (mesa.capacidad <= 12) return 'w-28 h-28';
    return 'w-32 h-32';
  };

  // Estilos de transformación
  const style = {
    position: 'absolute',
    left: `${mesa.posicion_x}%`,
    top: `${mesa.posicion_y}%`,
    transform: transform
      ? `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) rotate(${mesa.rotacion || 0}deg)`
      : `translate(-50%, -50%) rotate(${mesa.rotacion || 0}deg)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : isOver ? 50 : 10,
    transition: isDragging ? 'none' : 'box-shadow 0.2s',
  };

  if (isEditing) {
    return (
      <div
        style={{
          ...style,
          transform: `translate(-50%, -50%)`,
        }}
        className="bg-white rounded-lg shadow-lg p-4 min-w-[200px] z-50"
      >
        <div className="space-y-3">
          <Input
            label="Nombre"
            value={editData.nombre}
            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
            size="sm"
          />
          <Input
            label="Capacidad"
            type="number"
            min={1}
            max={50}
            value={editData.capacidad}
            onChange={(e) => setEditData({ ...editData, capacidad: parseInt(e.target.value) || 8 })}
            size="sm"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEdit}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => onSave(editData)}
              className="p-1.5 rounded-lg hover:bg-green-100"
            >
              <Check className="w-4 h-4 text-green-600" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragAttributes}
      {...dragListeners}
      className={`
        ${getSize()}
        ${getMesaShape()}
        ${getOcupacionColor()}
        border-2 cursor-move
        flex flex-col items-center justify-center
        shadow-md hover:shadow-lg
        group
        ${isOver ? 'ring-2 ring-pink-400 ring-offset-2' : ''}
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
    >
      {/* Contenido de la mesa */}
      <div className="text-center pointer-events-none select-none">
        <p className="font-semibold text-xs text-gray-800 truncate max-w-[60px]">
          {mesa.numero ? `Mesa ${mesa.numero}` : mesa.nombre}
        </p>
        <p className="text-[10px] text-gray-600">
          {asignados}/{mesa.capacidad}
        </p>
      </div>


      {/* Botones de acción (hover) */}
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <Edit2 className="w-3 h-3 text-gray-600" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-white rounded-full shadow-md hover:bg-red-100"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </div>

      {/* Botón para ver invitados */}
      {mesa.invitados?.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInvitados(!showInvitados);
          }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-gray-700 z-20"
        >
          <Users className="w-3 h-3" />
          {mesa.invitados.length}
          {showInvitados ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {/* Panel expandible con lista de invitados */}
      {showInvitados && mesa.invitados?.length > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-8 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm text-gray-800 flex items-center gap-1">
                <Users className="w-4 h-4" />
                Invitados ({mesa.invitados.length})
              </p>
              <button
                onClick={() => setShowInvitados(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <ul className="space-y-1">
              {mesa.invitados.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
                  <div>
                    <span className="text-sm text-gray-800 truncate block max-w-[120px]">{inv.nombre}</span>
                    {inv.num_asistentes > 1 && (
                      <span className="text-xs text-gray-500">{inv.num_asistentes} personas</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDesasignarInvitado(inv.id);
                    }}
                    className="p-1.5 hover:bg-red-100 rounded text-red-600"
                    title="Quitar de mesa"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default MesaVisual;
