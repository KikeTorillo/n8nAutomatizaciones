/**
 * ====================================================================
 * APPROVAL NODE - Nodo de aprobacion
 * ====================================================================
 */

import { memo } from 'react';
import { Position } from 'reactflow';
import { UserCheck, Clock, Users } from 'lucide-react';
import BaseNode, { NodeHandle } from './BaseNode';

function ApprovalNode({ data, selected }) {
  const config = data?.config || {};
  const tieneTimeout = config.timeout_horas > 0;
  const tipoAprobador = config.aprobador?.tipo;

  // Icono segun tipo de aprobador
  const AprobadorIcon = tipoAprobador === 'usuario' ? UserCheck : Users;

  return (
    <BaseNode
      nodeType="aprobacion"
      selected={selected}
      className="min-w-[160px] px-4 py-3"
      hasError={data?.hasError}
      hasWarning={data?.hasWarning}
    >
      {/* Handle de entrada (izquierda para flujo horizontal) */}
      <NodeHandle
        type="target"
        position={Position.Left}
        id="in"
      />

      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <AprobadorIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {data?.label || 'Aprobacion'}
          </p>
          {tipoAprobador && (
            <p className="text-xs opacity-80 mt-0.5">
              Por {tipoAprobador}
            </p>
          )}
          {tieneTimeout && (
            <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
              <Clock className="w-3 h-3" />
              <span>{config.timeout_horas}h</span>
            </div>
          )}
        </div>
      </div>

      {/* Handles de salida: aprobar (arriba-derecha) y rechazar (abajo-derecha) */}
      <NodeHandle
        type="source"
        position={Position.Right}
        id="aprobar"
        style={{ top: '30%' }}
      />
      <NodeHandle
        type="source"
        position={Position.Right}
        id="rechazar"
        style={{ top: '70%' }}
      />
    </BaseNode>
  );
}

export default memo(ApprovalNode);
