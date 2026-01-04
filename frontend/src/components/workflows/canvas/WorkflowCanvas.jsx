/**
 * ====================================================================
 * WORKFLOW CANVAS - Canvas principal de React Flow
 * ====================================================================
 */

import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges/WorkflowEdge';

// Opciones por defecto del edge
const defaultEdgeOptions = {
  type: 'workflowEdge',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
  },
};

// Estilos del MiniMap por tipo de nodo
const minimapNodeColor = (node) => {
  const colors = {
    inicio: '#22c55e',
    aprobacion: '#753572',
    condicion: '#f59e0b',
    accion: '#3b82f6',
    fin: '#ef4444',
  };
  return colors[node.type] || '#6b7280';
};

function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onDrop,
  onDragOver,
  onSelectionChange,
  readOnly = false,
  children,
}) {
  const reactFlowWrapper = useRef(null);

  // Handler para conexiones
  const handleConnect = useCallback(
    (params) => {
      // Determinar etiqueta basada en el sourceHandle
      let etiqueta = 'siguiente';
      if (params.sourceHandle === 'aprobar') etiqueta = 'aprobar';
      else if (params.sourceHandle === 'rechazar') etiqueta = 'rechazar';
      else if (params.sourceHandle === 'si') etiqueta = 'si';
      else if (params.sourceHandle === 'no') etiqueta = 'no';

      const newEdge = {
        ...params,
        type: 'workflowEdge',
        data: { etiqueta },
        animated: etiqueta === 'aprobar',
      };

      if (onConnect) {
        onConnect(newEdge);
      }
    },
    [onConnect]
  );

  // Validar conexiones
  const isValidConnection = useCallback(
    (connection) => {
      // No permitir conexiones al mismo nodo
      if (connection.source === connection.target) return false;

      // Verificar que no exista ya una conexion igual
      const existingEdge = edges.find(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle
      );
      if (existingEdge) return false;

      return true;
    },
    [edges]
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        proOptions={{ hideAttribution: true }}
        className="bg-gray-50 dark:bg-gray-900"
      >
        {/* Fondo con grid */}
        <Background
          variant="dots"
          gap={20}
          size={1}
          color="#94a3b8"
          className="dark:opacity-30"
        />

        {/* Controles de zoom */}
        <Controls
          position="bottom-right"
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !shadow-lg"
        />

        {/* MiniMapa */}
        <MiniMap
          nodeColor={minimapNodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="bottom-left"
          className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !shadow-lg"
        />

        {/* Panel para elementos adicionales (toolbar, paleta, etc) */}
        {children}
      </ReactFlow>
    </div>
  );
}

export default WorkflowCanvas;
