/**
 * ====================================================================
 * ETAPA SORTABLE ITEM - Item Sortable de Etapa
 * ====================================================================
 *
 * Componente de etapa individual para la lista sortable:
 * - Handle de drag (GripVertical)
 * - Color preview
 * - Nombre y probabilidad
 * - Badges de Ganada/Perdida
 * - Acciones: Editar, Eliminar
 *
 * Enero 2026
 * ====================================================================
 */

import { memo } from 'react';
import PropTypes from 'prop-types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Trophy, XCircle } from 'lucide-react';
import { Button, Badge } from '@/components/ui';

/**
 * Item sortable de etapa del pipeline
 */
const EtapaSortableItem = memo(function EtapaSortableItem({
  etapa,
  onEdit,
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
  } = useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 bg-white dark:bg-gray-800
        rounded-lg border border-gray-200 dark:border-gray-700
        ${dragging ? 'shadow-lg opacity-90 ring-2 ring-primary-500' : 'shadow-sm'}
        transition-shadow
      `}
    >
      {/* Handle de drag */}
      <button
        type="button"
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Color preview */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-600"
        style={{ backgroundColor: etapa.color || '#6B7280' }}
        title={`Color: ${etapa.color}`}
      />

      {/* Info de la etapa */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {etapa.nombre}
          </span>

          {/* Badge Ganada */}
          {etapa.es_ganada && (
            <Badge variant="success" className="flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Ganada
            </Badge>
          )}

          {/* Badge Perdida */}
          {etapa.es_perdida && (
            <Badge variant="danger" className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Perdida
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>Probabilidad: {etapa.probabilidad_default || 0}%</span>
          {etapa.descripcion && (
            <span className="truncate max-w-xs" title={etapa.descripcion}>
              {etapa.descripcion}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(etapa)}
          title="Editar etapa"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(etapa)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Eliminar etapa"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

EtapaSortableItem.displayName = 'EtapaSortableItem';

EtapaSortableItem.propTypes = {
  etapa: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    color: PropTypes.string,
    probabilidad_default: PropTypes.number,
    es_ganada: PropTypes.bool,
    es_perdida: PropTypes.bool,
    orden: PropTypes.number,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDragging: PropTypes.bool,
};

export default EtapaSortableItem;
