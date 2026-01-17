/**
 * ====================================================================
 * WORKFLOW DESIGNER PAGE - Editor visual de workflows
 * ====================================================================
 *
 * Pagina principal del diseñador visual con React Flow.
 * Fase 2 del Editor Visual de Workflows.
 *
 * Enero 2026
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useModalManager } from '@/hooks/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodesState, useEdgesState, addEdge, Panel } from 'reactflow';

import WorkflowCanvas from '@/components/workflows/canvas/WorkflowCanvas';
import WorkflowToolbar from '@/components/workflows/toolbar/WorkflowToolbar';
import NodePalette from '@/components/workflows/toolbar/NodePalette';
import { NodeConfigDrawer, WorkflowSettingsDrawer } from '@/components/workflows/drawers';
import { PublishWorkflowModal } from '@/components/workflows/modals';
import { useToast } from '@/hooks/utils';
import { useWorkflowValidation } from '@/hooks/sistema';
import {
  useWorkflowDefinicion,
  useCrearWorkflow,
  useActualizarWorkflow,
  usePublicarWorkflow,
  pasosToNodes,
  transicionesToEdges,
  nodesToPasos,
  edgesToTransiciones,
} from '@/hooks/sistema';

// ID counter para nodos nuevos
let nodeIdCounter = 0;
const getNodeId = (type) => `${type}_${Date.now()}_${nodeIdCounter++}`;

// Nodos iniciales para nuevo workflow
const INITIAL_NODES = [
  {
    id: 'inicio_1',
    type: 'inicio',
    position: { x: 250, y: 50 },
    data: { label: 'Inicio' },
  },
];

const INITIAL_EDGES = [];

function WorkflowDesignerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const isNew = !id || id === 'nuevo';

  // Estado del workflow
  const [workflowData, setWorkflowData] = useState({
    codigo: '',
    nombre: 'Nuevo Workflow',
    descripcion: '',
    entidad_tipo: 'orden_compra',
    condicion_activacion: null,
    prioridad: 0,
    activo: false,
  });

  // Estados de React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

  // Estados UI
  const [isDirty, setIsDirty] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);

  // Modales centralizados
  const { openModal, closeModal, isOpen } = useModalManager({
    publish: { isOpen: false },
  });
  const initialLoadDone = useRef(false);

  // Hook de validación
  const validation = useWorkflowValidation(nodes, edges, workflowData);

  // Queries y mutations
  const { data: existingWorkflow, isLoading } = useWorkflowDefinicion(
    isNew ? null : parseInt(id)
  );
  const crearMutation = useCrearWorkflow();
  const actualizarMutation = useActualizarWorkflow();
  const publicarMutation = usePublicarWorkflow();

  // Cargar workflow existente
  useEffect(() => {
    if (existingWorkflow && !isNew) {
      setWorkflowData({
        codigo: existingWorkflow.codigo,
        nombre: existingWorkflow.nombre,
        descripcion: existingWorkflow.descripcion || '',
        entidad_tipo: existingWorkflow.entidad_tipo,
        condicion_activacion: existingWorkflow.condicion_activacion,
        prioridad: existingWorkflow.prioridad || 0,
        activo: existingWorkflow.activo,
      });

      // Convertir pasos y transiciones a formato React Flow
      const loadedNodes = pasosToNodes(existingWorkflow.pasos);
      const loadedEdges = transicionesToEdges(existingWorkflow.transiciones);

      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setIsDirty(false);

      // Marcar carga inicial como completada (después de un tick para que los states se actualicen)
      setTimeout(() => {
        initialLoadDone.current = true;
      }, 0);
    }
  }, [existingWorkflow, isNew, setNodes, setEdges]);


  // Handler para conectar nodos
  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  // Handler para drop de nodos desde la paleta
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowInstance) return;

      // Obtener posicion del drop
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Crear nuevo nodo
      const newNode = {
        id: getNodeId(type),
        type,
        position,
        data: {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setIsDirty(true);
    },
    [reactFlowInstance, setNodes]
  );

  // Handler click en nodo
  const onNodeClick = useCallback((event, node) => {
    // Solo abrir drawer si no está en modo publicado
    if (!workflowData.activo) {
      setSelectedNode(node);
      setIsNodeConfigOpen(true);
    }
  }, [workflowData.activo]);

  // Handler para guardar configuración del nodo
  const handleNodeConfigSave = useCallback(({ label, config }) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label,
              config,
            },
          };
        }
        return node;
      })
    );
    setIsDirty(true);
    setIsNodeConfigOpen(false);
  }, [selectedNode, setNodes]);

  // Handler para cerrar drawer de configuración
  const handleNodeConfigClose = useCallback(() => {
    setIsNodeConfigOpen(false);
    setSelectedNode(null);
  }, []);

  // Enriquecer nodos con información de validación
  const nodesWithValidation = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        hasError: validation.nodoTieneError(node.id),
        hasWarning: validation.nodoTieneWarning(node.id),
      },
    }));
  }, [nodes, validation]);

  // Errores formateados para el toolbar
  const validationErrors = useMemo(() => {
    return validation.errores.map((e) => e.mensaje);
  }, [validation.errores]);

  // Función de validación para llamar manualmente
  const validateWorkflow = useCallback(() => {
    validation.validar();
    return validation.isValid;
  }, [validation]);

  // Guardar workflow
  const handleSave = async () => {
    // Generar codigo automatico si es nuevo y no tiene
    if (isNew && !workflowData.codigo) {
      const timestamp = Date.now().toString(36);
      setWorkflowData((prev) => ({
        ...prev,
        codigo: `workflow_${timestamp}`,
      }));
    }

    // Validar
    if (!validateWorkflow()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }

    // Convertir nodos/edges a formato backend
    const pasos = nodesToPasos(nodes);
    const transiciones = edgesToTransiciones(edges);

    const payload = {
      ...workflowData,
      codigo: workflowData.codigo || `workflow_${Date.now().toString(36)}`,
      pasos,
      transiciones,
    };

    try {
      if (isNew) {
        const result = await crearMutation.mutateAsync(payload);
        toast.success('Workflow creado exitosamente');
        navigate(`/configuracion/workflows/${result.id}`, { replace: true });
      } else {
        await actualizarMutation.mutateAsync({
          id: parseInt(id),
          data: payload,
        });
        toast.success('Workflow guardado');
      }
      setIsDirty(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  // Abrir modal de publicación
  const handleOpenPublishModal = () => {
    if (isDirty) {
      toast.error('Guarda los cambios antes de publicar');
      return;
    }
    openModal('publish');
  };

  // Confirmar publicación/despublicación
  const handleConfirmPublish = async () => {
    const nuevoEstado = !workflowData.activo;

    try {
      await publicarMutation.mutateAsync({
        id: parseInt(id),
        activo: nuevoEstado,
      });
      setWorkflowData((prev) => ({ ...prev, activo: nuevoEstado }));
      closeModal('publish');
      toast.success(nuevoEstado ? 'Workflow publicado' : 'Workflow despublicado');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  // Guardar configuración del workflow
  const handleSettingsSave = (newData) => {
    setWorkflowData((prev) => ({ ...prev, ...newData }));
    setIsDirty(true);
  };

  // Handler para eliminar nodos/edges seleccionados
  const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
    // Guardar selección actual para referencia
    selectedNodesRef.current = selectedNodes;
    selectedEdgesRef.current = selectedEdges;
  }, []);

  // Refs para nodos/edges seleccionados
  const selectedNodesRef = useRef([]);
  const selectedEdgesRef = useRef([]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Solo si no estamos en modo publicado y no hay inputs activos
      if (workflowData.activo) return;
      if (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA') return;

      // Delete o Backspace para eliminar selección
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = selectedNodesRef.current || [];
        const selectedEdges = selectedEdgesRef.current || [];

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          event.preventDefault();

          // No permitir eliminar nodo inicio
          const nodesToDelete = selectedNodes.filter((n) => n.type !== 'inicio');

          if (nodesToDelete.length > 0) {
            const nodeIdsToDelete = nodesToDelete.map((n) => n.id);
            setNodes((nds) => nds.filter((n) => !nodeIdsToDelete.includes(n.id)));
            // También eliminar edges conectados
            setEdges((eds) =>
              eds.filter(
                (e) => !nodeIdsToDelete.includes(e.source) && !nodeIdsToDelete.includes(e.target)
              )
            );
            setIsDirty(true);
          }

          if (selectedEdges.length > 0) {
            const edgeIdsToDelete = selectedEdges.map((e) => e.id);
            setEdges((eds) => eds.filter((e) => !edgeIdsToDelete.includes(e.id)));
            setIsDirty(true);
          }
        }
      }

      // Ctrl+S para guardar
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (isDirty) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workflowData.activo, setNodes, setEdges, isDirty]);

  // Usar el estado de validación del hook
  const isValid = validation.isValid;

  // Loading state
  if (!isNew && isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <WorkflowToolbar
        workflow={workflowData}
        isNew={isNew}
        isDirty={isDirty}
        isValid={isValid}
        validationErrors={validationErrors}
        warningCount={validation.warningCount}
        isSaving={crearMutation.isPending || actualizarMutation.isPending}
        isPublishing={publicarMutation.isPending}
        onSave={handleSave}
        onValidate={validateWorkflow}
        onPublish={handleOpenPublishModal}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar con paleta */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <NodePalette nodes={nodes} />
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <WorkflowCanvas
            nodes={nodesWithValidation}
            edges={edges}
            onNodesChange={(changes) => {
              onNodesChange(changes);
              // Solo marcar dirty para cambios significativos (posición, eliminación)
              // No para dimensiones o selección que ocurren al cargar
              const significantChange = changes.some(
                (c) => c.type === 'position' || c.type === 'remove'
              );
              if (significantChange && initialLoadDone.current) {
                setIsDirty(true);
              }
            }}
            onEdgesChange={(changes) => {
              onEdgesChange(changes);
              // Solo marcar dirty para cambios significativos
              const significantChange = changes.some(
                (c) => c.type === 'remove' || c.type === 'add'
              );
              if (significantChange && initialLoadDone.current) {
                setIsDirty(true);
              }
            }}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onSelectionChange={handleSelectionChange}
            readOnly={workflowData.activo}
          >
            {/* Panel con info del workflow en modo publicado */}
            {workflowData.activo && (
              <Panel position="top-center">
                <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg text-sm">
                  Modo solo lectura - Despublica para editar
                </div>
              </Panel>
            )}
          </WorkflowCanvas>
        </div>
      </div>

      {/* Settings Drawer */}
      <WorkflowSettingsDrawer
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        workflowData={workflowData}
        onSave={handleSettingsSave}
        isNew={isNew}
      />

      {/* Node Config Drawer */}
      <NodeConfigDrawer
        isOpen={isNodeConfigOpen}
        onClose={handleNodeConfigClose}
        node={selectedNode}
        onSave={handleNodeConfigSave}
        entidadTipo={workflowData.entidad_tipo}
      />

      {/* Publish Confirmation Modal */}
      <PublishWorkflowModal
        isOpen={isOpen('publish')}
        onClose={() => closeModal('publish')}
        onConfirm={handleConfirmPublish}
        workflow={workflowData}
        isPublishing={publicarMutation.isPending}
        validationErrors={validationErrors}
        warningCount={validation.warningCount}
      />
    </div>
  );
}

export default WorkflowDesignerPage;
