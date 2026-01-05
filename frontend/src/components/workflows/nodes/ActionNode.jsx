/**
 * ====================================================================
 * ACTION NODE - Nodo de accion
 * ====================================================================
 */

import { memo } from 'react';
import { Position } from 'reactflow';
import { Zap, Bell, Globe, ArrowRightLeft } from 'lucide-react';
import BaseNode, { NodeHandle } from './BaseNode';

const ACTION_ICONS = {
  cambiar_estado: ArrowRightLeft,
  notificar: Bell,
  webhook: Globe,
  default: Zap,
};

function ActionNode({ data, selected }) {
  const config = data?.config || {};
  const tipoAccion = config.tipo_accion || 'default';
  const Icon = ACTION_ICONS[tipoAccion] || ACTION_ICONS.default;

  return (
    <BaseNode
      nodeType="accion"
      selected={selected}
      className="min-w-[140px] px-4 py-3"
      hasError={data?.hasError}
      hasWarning={data?.hasWarning}
    >
      {/* Handle de entrada (izquierda para flujo horizontal) */}
      <NodeHandle
        type="target"
        position={Position.Left}
        id="in"
      />

      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {data?.label || 'Accion'}
          </p>
          {tipoAccion !== 'default' && (
            <p className="text-xs opacity-80 mt-0.5 capitalize">
              {tipoAccion.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>

      {/* Handle de salida (derecha para flujo horizontal) */}
      <NodeHandle
        type="source"
        position={Position.Right}
        id="out"
      />
    </BaseNode>
  );
}

export default memo(ActionNode);
