/**
 * ====================================================================
 * WORKFLOW EDGE - Edge personalizado con etiquetas
 * ====================================================================
 */

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from 'reactflow';

// Colores y estilos por tipo de etiqueta
const EDGE_STYLES = {
  aprobar: {
    stroke: '#22c55e',
    strokeWidth: 2,
    label: 'Aprobar',
    labelBg: 'bg-green-100 dark:bg-green-900/50',
    labelText: 'text-green-700 dark:text-green-300',
  },
  rechazar: {
    stroke: '#ef4444',
    strokeWidth: 2,
    label: 'Rechazar',
    labelBg: 'bg-red-100 dark:bg-red-900/50',
    labelText: 'text-red-700 dark:text-red-300',
  },
  si: {
    stroke: '#22c55e',
    strokeWidth: 1.5,
    label: 'Si',
    labelBg: 'bg-green-100 dark:bg-green-900/50',
    labelText: 'text-green-700 dark:text-green-300',
  },
  no: {
    stroke: '#ef4444',
    strokeWidth: 1.5,
    label: 'No',
    labelBg: 'bg-red-100 dark:bg-red-900/50',
    labelText: 'text-red-700 dark:text-red-300',
  },
  timeout: {
    stroke: '#f59e0b',
    strokeWidth: 1.5,
    strokeDasharray: '5,5',
    label: 'Timeout',
    labelBg: 'bg-amber-100 dark:bg-amber-900/50',
    labelText: 'text-amber-700 dark:text-amber-300',
  },
  siguiente: {
    stroke: '#6b7280',
    strokeWidth: 1.5,
    label: '',
    labelBg: 'bg-gray-100 dark:bg-gray-800',
    labelText: 'text-gray-600 dark:text-gray-400',
  },
};

function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}) {
  const etiqueta = data?.etiqueta || 'siguiente';
  const style = EDGE_STYLES[etiqueta] || EDGE_STYLES.siguiente;

  // Usar smooth step para mejor visualizacion
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: style.stroke,
          strokeWidth: selected ? style.strokeWidth + 1 : style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
        }}
      />

      {/* Etiqueta del edge */}
      {style.label && (
        <EdgeLabelRenderer>
          <div
            className={`
              absolute px-2 py-0.5 rounded text-xs font-medium
              ${style.labelBg} ${style.labelText}
              pointer-events-all nodrag nopan
              transform -translate-x-1/2 -translate-y-1/2
              ${selected ? 'ring-1 ring-primary-400' : ''}
            `}
            style={{
              left: labelX,
              top: labelY,
            }}
          >
            {style.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Exportar tipos de edge para React Flow
export const edgeTypes = {
  workflowEdge: memo(WorkflowEdge),
};

export default memo(WorkflowEdge);
