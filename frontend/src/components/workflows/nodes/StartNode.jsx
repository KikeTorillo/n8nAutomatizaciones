/**
 * ====================================================================
 * START NODE - Nodo de inicio del workflow
 * ====================================================================
 */

import { memo } from 'react';
import { Position } from 'reactflow';
import { Play } from 'lucide-react';
import BaseNode, { NodeHandle } from './BaseNode';

function StartNode({ data, selected }) {
  return (
    <BaseNode
      nodeType="inicio"
      selected={selected}
      isCircle
      className="w-16 h-16 flex items-center justify-center"
      hasError={data?.hasError}
      hasWarning={data?.hasWarning}
    >
      <div className="flex flex-col items-center justify-center">
        <Play className="w-6 h-6" />
      </div>

      {/* Solo handle de salida */}
      <NodeHandle
        type="source"
        position={Position.Bottom}
        id="out"
      />
    </BaseNode>
  );
}

export default memo(StartNode);
