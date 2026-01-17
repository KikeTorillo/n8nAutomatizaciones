/**
 * ====================================================================
 * COMPONENTE - KANBAN CARD (OPORTUNIDAD)
 * ====================================================================
 *
 * Card arrastrable para el Pipeline Kanban
 * Usa @dnd-kit/sortable para drag & drop
 *
 * ====================================================================
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMoney, getPrioridadOportunidad } from '@/hooks/personas';

/**
 * KanbanCard - Card de oportunidad arrastrable
 *
 * @param {Object} props
 * @param {Object} props.oportunidad - Datos de la oportunidad
 * @param {boolean} [props.isDragging] - Si esta siendo arrastrada (para overlay)
 */
export default function KanbanCard({ oportunidad, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: oportunidad.id,
    data: {
      type: 'oportunidad',
      oportunidad,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const prioridad = getPrioridadOportunidad(oportunidad.prioridad);
  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-600',
        'hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing',
        isCurrentlyDragging && 'opacity-50 shadow-lg ring-2 ring-primary-500'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header con handle y prioridad */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 text-gray-400">
          <GripVertical className="h-4 w-4" />
        </div>
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            prioridad.bgColor,
            prioridad.color
          )}
        >
          {prioridad.label}
        </span>
      </div>

      {/* Titulo */}
      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">
        {oportunidad.titulo}
      </h4>

      {/* Cliente */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <User className="h-3 w-3" />
        <span className="truncate">{oportunidad.cliente_nombre || 'Sin cliente'}</span>
      </div>

      {/* Footer con valor y probabilidad */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-600">
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatMoney(oportunidad.ingreso_esperado)}
        </span>
        <div className="flex items-center gap-1">
          <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${oportunidad.probabilidad || 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {oportunidad.probabilidad || 0}%
          </span>
        </div>
      </div>

      {/* Fecha cierre si existe */}
      {oportunidad.fecha_cierre_esperada && (
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-2">
          <Calendar className="h-3 w-3" />
          <span>
            {new Date(oportunidad.fecha_cierre_esperada).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
