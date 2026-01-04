/**
 * ====================================================================
 * END NODE - Nodo de fin del workflow
 * ====================================================================
 */

import { memo } from 'react';
import { Position } from 'reactflow';
import { Square, CheckCircle, XCircle } from 'lucide-react';
import BaseNode, { NodeHandle } from './BaseNode';

function EndNode({ data, selected }) {
  const config = data?.config || {};
  const estadoFinal = config.estado_nuevo;

  // Determinar icono basado en el resultado esperado
  const esAprobado = estadoFinal === 'aprobado' || estadoFinal === 'enviada';
  const Icon = esAprobado ? CheckCircle : estadoFinal === 'rechazado' ? XCircle : Square;

  return (
    <BaseNode
      nodeType="fin"
      selected={selected}
      isCircle
      className="w-16 h-16 flex items-center justify-center"
      hasError={data?.hasError}
      hasWarning={data?.hasWarning}
    >
      {/* Solo handle de entrada */}
      <NodeHandle
        type="target"
        position={Position.Top}
        id="in"
      />

      <div className="flex flex-col items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
    </BaseNode>
  );
}

export default memo(EndNode);
