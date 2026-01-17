/**
 * ====================================================================
 * COMPONENTE - KANBAN COLUMN (ETAPA PIPELINE)
 * ====================================================================
 *
 * Columna del Pipeline Kanban que representa una etapa
 * Usa @dnd-kit/sortable para recibir cards
 *
 * ====================================================================
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/hooks/personas';
import KanbanCard from './KanbanCard';

/**
 * KanbanColumn - Columna de etapa del pipeline
 *
 * @param {Object} props
 * @param {Object} props.etapa - Datos de la etapa
 * @param {Array} props.oportunidades - Oportunidades en esta etapa
 */
export default function KanbanColumn({ etapa, oportunidades = [] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `etapa-${etapa.id}`,
    data: {
      type: 'etapa',
      etapaId: etapa.id,
    },
  });

  // Calcular totales
  const totalValor = oportunidades.reduce(
    (sum, op) => sum + (parseFloat(op.ingreso_esperado) || 0),
    0
  );
  const totalPonderado = oportunidades.reduce(
    (sum, op) =>
      sum + ((parseFloat(op.ingreso_esperado) || 0) * (op.probabilidad || 0)) / 100,
    0
  );

  // IDs para SortableContext
  const oportunidadIds = oportunidades.map((op) => op.id);

  return (
    <div
      className={cn(
        'flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg flex flex-col max-h-[calc(100vh-300px)]',
        isOver && 'ring-2 ring-primary-500 ring-opacity-50'
      )}
    >
      {/* Header de columna */}
      <div
        className="p-3 border-b border-gray-200 dark:border-gray-700 rounded-t-lg"
        style={{ backgroundColor: etapa.color || '#6B7280' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm truncate">
            {etapa.nombre}
          </h3>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
            {oportunidades.length}
          </span>
        </div>
        <div className="mt-1 text-white/80 text-xs">
          {formatMoney(totalValor)}
        </div>
      </div>

      {/* Contenido con oportunidades */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 overflow-y-auto',
          isOver && 'bg-primary-50 dark:bg-primary-900/20'
        )}
      >
        <SortableContext items={oportunidadIds} strategy={verticalListSortingStrategy}>
          {oportunidades.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-500 text-sm">
              Sin oportunidades
            </div>
          ) : (
            oportunidades.map((oportunidad) => (
              <KanbanCard key={oportunidad.id} oportunidad={oportunidad} />
            ))
          )}
        </SortableContext>
      </div>

      {/* Footer con resumen */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Ponderado</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatMoney(totalPonderado)}
          </span>
        </div>
      </div>
    </div>
  );
}
