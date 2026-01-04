/**
 * ====================================================================
 * CONDITION NODE - Nodo de condicion (diamante)
 * ====================================================================
 */

import { memo } from 'react';
import { Position } from 'reactflow';
import { GitBranch } from 'lucide-react';
import BaseNode, { NodeHandle } from './BaseNode';

function ConditionNode({ data, selected }) {
  const config = data?.config || {};
  const condicion = config.condicion;

  // Generar resumen de la condición
  const resumenCondicion = condicion?.condiciones?.[0]
    ? `${condicion.condiciones[0].campo || '?'} ${condicion.condiciones[0].operador || ''}`
    : null;

  return (
    <div className="relative">
      <BaseNode
        nodeType="condicion"
        selected={selected}
        isDiamond
        hasError={data?.hasError}
        hasWarning={data?.hasWarning}
      >
        <GitBranch className="w-5 h-5" />
      </BaseNode>

      {/* Handle de entrada (arriba) */}
      <NodeHandle
        type="target"
        position={Position.Top}
        id="in"
        style={{ top: -6 }}
      />

      {/* Handle Si (izquierda) */}
      <NodeHandle
        type="source"
        position={Position.Left}
        id="si"
        style={{ left: -6 }}
      />

      {/* Handle No (derecha) */}
      <NodeHandle
        type="source"
        position={Position.Right}
        id="no"
        style={{ right: -6 }}
      />

      {/* Etiquetas */}
      <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-medium text-green-600 dark:text-green-400">
        Si
      </span>
      <span className="absolute -right-7 top-1/2 -translate-y-1/2 text-[10px] font-medium text-red-600 dark:text-red-400">
        No
      </span>

      {/* Tooltip con condicion */}
      {resumenCondicion && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] bg-gray-800 text-white px-2 py-0.5 rounded">
            {resumenCondicion}
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(ConditionNode);
