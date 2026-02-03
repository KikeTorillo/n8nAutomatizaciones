import React, { useState, memo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Edit2, Trash2, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Drawer } from '@/components/ui';

/**
 * Componente visual de una mesa en el seating chart
 * - Draggable para mover posición
 * - Droppable para recibir invitados
 * - Memoizado para evitar re-renders innecesarios
 */
const MesaVisual = memo(function MesaVisual({
  mesa,
  asignados,
  porcentaje,
  isEditMode = false,
  onEdit,
  onDelete,
  onDesasignarInvitado,
}) {
  const [showInvitados, setShowInvitados] = useState(false);

  // Draggable para mover mesa (solo habilitado en modo edición)
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `mesa-${mesa.id}`,
    disabled: !isEditMode,
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
    if (porcentaje >= 100) return 'border-red-400 bg-red-50 dark:bg-red-900/30';
    if (porcentaje >= 75) return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
    return 'border-green-400 bg-green-50 dark:bg-green-900/30';
  };

  // Tamaño según capacidad (responsive: más pequeño en móvil)
  const getSize = () => {
    if (mesa.capacidad <= 4) return 'w-14 h-14 sm:w-20 sm:h-20';
    if (mesa.capacidad <= 8) return 'w-16 h-16 sm:w-24 sm:h-24';
    if (mesa.capacidad <= 12) return 'w-18 h-18 sm:w-28 sm:h-28';
    return 'w-20 h-20 sm:w-32 sm:h-32';
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
    touchAction: isEditMode ? 'none' : 'auto', // Solo bloquear touch en modo edición
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? { ...dragAttributes, ...dragListeners } : {})}
      className={`
        ${getSize()}
        ${getMesaShape()}
        ${getOcupacionColor()}
        border-2
        flex flex-col items-center justify-center
        shadow-md hover:shadow-lg
        group
        ${isOver ? 'ring-2 ring-pink-400 ring-offset-2' : ''}
        ${isEditMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}
        ${isEditMode ? 'ring-2 ring-primary-300 dark:ring-primary-600' : ''}
      `}
    >
      {/* Contenido de la mesa */}
      <div className="text-center pointer-events-none select-none px-1">
        <p className="font-semibold text-[9px] sm:text-xs text-gray-800 dark:text-gray-100 truncate max-w-[40px] sm:max-w-[60px]">
          {mesa.numero ? `M${mesa.numero}` : mesa.nombre}
        </p>
        <p className="text-[8px] sm:text-[10px] text-gray-600 dark:text-gray-300">
          {asignados}/{mesa.capacidad}
        </p>
      </div>


      {/* Botones de acción (siempre visibles en modo edición, hover en modo normal) */}
      <div className={`absolute -top-2 -right-2 transition-opacity flex gap-1 ${
        isEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
        >
          <Edit2 className="w-3 h-3 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-red-100 dark:hover:bg-red-900/30 border border-gray-200 dark:border-gray-600"
        >
          <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
        </button>
      </div>

      {/* Botón para ver invitados */}
      {mesa.invitados?.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowInvitados(!showInvitados);
          }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 hover:bg-gray-700 dark:hover:bg-gray-600 z-20"
        >
          <Users className="w-3 h-3" />
          {mesa.invitados.length}
          {showInvitados ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {/* Drawer de invitados */}
      <Drawer
        isOpen={showInvitados && mesa.invitados?.length > 0}
        onClose={() => setShowInvitados(false)}
        title={mesa.nombre}
        subtitle={`${mesa.invitados?.length || 0} invitados asignados`}
      >
        <ul className="space-y-2">
          {mesa.invitados?.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between py-3 px-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block truncate">
                  {inv.nombre}
                </span>
                {inv.num_asistentes > 1 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {inv.num_asistentes} personas
                  </span>
                )}
              </div>
              <button
                onClick={() => onDesasignarInvitado(inv.id)}
                className="ml-2 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 flex-shrink-0 transition-colors"
                title="Quitar de mesa"
              >
                <X className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>

        {mesa.invitados?.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No hay invitados asignados a esta mesa
          </p>
        )}
      </Drawer>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparador personalizado: solo re-renderiza si cambian datos relevantes
  return (
    prevProps.mesa.id === nextProps.mesa.id &&
    prevProps.mesa.nombre === nextProps.mesa.nombre &&
    prevProps.mesa.numero === nextProps.mesa.numero &&
    prevProps.mesa.tipo === nextProps.mesa.tipo &&
    prevProps.mesa.capacidad === nextProps.mesa.capacidad &&
    prevProps.mesa.posicion_x === nextProps.mesa.posicion_x &&
    prevProps.mesa.posicion_y === nextProps.mesa.posicion_y &&
    prevProps.mesa.rotacion === nextProps.mesa.rotacion &&
    prevProps.mesa.invitados?.length === nextProps.mesa.invitados?.length &&
    prevProps.asignados === nextProps.asignados &&
    prevProps.porcentaje === nextProps.porcentaje &&
    prevProps.isEditMode === nextProps.isEditMode
  );
});

export default MesaVisual;
