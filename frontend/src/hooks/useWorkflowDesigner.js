import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowDesignerApi, workflowsApi } from '@/services/api/endpoints';

// ==================== QUERIES ====================

/**
 * Hook para listar definiciones de workflows (para la lista)
 * @param {Object} params - { entidad_tipo?, activo?, busqueda? }
 */
export function useWorkflowDefiniciones(params = {}) {
  return useQuery({
    queryKey: ['workflow-definiciones', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await workflowsApi.listarDefiniciones(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener una definición de workflow por ID (con pasos y transiciones)
 * @param {number} id - ID del workflow
 */
export function useWorkflowDefinicion(id) {
  return useQuery({
    queryKey: ['workflow-definicion', id],
    queryFn: async () => {
      const response = await workflowsApi.obtenerDefinicion(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para listar tipos de entidad disponibles
 */
export function useEntidadesDisponibles() {
  return useQuery({
    queryKey: ['designer-entidades'],
    queryFn: async () => {
      const response = await workflowDesignerApi.listarEntidades();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora (no cambia frecuentemente)
  });
}

/**
 * Hook para listar roles disponibles para aprobadores
 */
export function useRolesDisponibles() {
  return useQuery({
    queryKey: ['designer-roles'],
    queryFn: async () => {
      const response = await workflowDesignerApi.listarRoles();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

/**
 * Hook para listar permisos disponibles para aprobadores
 */
export function usePermisosDisponibles() {
  return useQuery({
    queryKey: ['designer-permisos'],
    queryFn: async () => {
      const response = await workflowDesignerApi.listarPermisos();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });
}

/**
 * Hook para validar un workflow guardado
 * @param {number} id - ID del workflow
 * @param {boolean} enabled - Si debe ejecutar la validación
 */
export function useValidarWorkflow(id, enabled = false) {
  return useQuery({
    queryKey: ['workflow-validacion', id],
    queryFn: async () => {
      const response = await workflowDesignerApi.validar(id);
      return response.data.data || { valido: false, errores: [] };
    },
    enabled: !!id && enabled,
    staleTime: 1000 * 30, // 30 segundos
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear una nueva definición de workflow
 */
export function useCrearWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await workflowDesignerApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-definiciones'] });
      queryClient.invalidateQueries({ queryKey: ['definiciones-workflow'] });
    },
  });
}

/**
 * Hook para actualizar una definición de workflow
 */
export function useActualizarWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await workflowDesignerApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-definiciones'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-definicion', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['definiciones-workflow'] });
    },
  });
}

/**
 * Hook para eliminar una definición de workflow
 */
export function useEliminarWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await workflowDesignerApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-definiciones'] });
      queryClient.invalidateQueries({ queryKey: ['definiciones-workflow'] });
    },
  });
}

/**
 * Hook para duplicar un workflow
 */
export function useDuplicarWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nuevoCodigo, nuevoNombre }) => {
      const response = await workflowDesignerApi.duplicar(id, {
        nuevo_codigo: nuevoCodigo || undefined,
        nuevo_nombre: nuevoNombre || undefined,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-definiciones'] });
      queryClient.invalidateQueries({ queryKey: ['definiciones-workflow'] });
    },
  });
}

/**
 * Hook para publicar o despublicar un workflow
 */
export function usePublicarWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const response = await workflowDesignerApi.cambiarEstadoPublicacion(id, activo);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-definiciones'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-definicion', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['definiciones-workflow'] });
    },
  });
}

// ==================== UTILIDADES ====================

/**
 * Transforma config de nodo de aprobación al formato del backend
 */
function transformApprovalConfig(config) {
  if (!config?.aprobador) return config;

  const { aprobador, ...rest } = config;
  return {
    ...rest,
    aprobadores_tipo: aprobador.tipo || 'rol',
    aprobadores: aprobador.valor ? [aprobador.valor] : [],
  };
}

/**
 * Convierte los nodos de React Flow al formato del backend
 * @param {Array} nodes - Nodos de React Flow
 * @returns {Array} Pasos para el backend
 */
export function nodesToPasos(nodes) {
  return nodes.map((node, index) => {
    let config = node.data?.config || {};

    // Transformar config de aprobación al formato del backend
    if (node.type === 'aprobacion') {
      config = transformApprovalConfig(config);
    }

    return {
      codigo: node.id,
      nombre: node.data?.label || node.id,
      descripcion: node.data?.descripcion || config.descripcion || null,
      tipo: node.type || 'accion',
      config,
      orden: index,
      posicion_x: Math.round(node.position?.x || 0),
      posicion_y: Math.round(node.position?.y || 0),
    };
  });
}

/**
 * Convierte los edges de React Flow al formato del backend
 * @param {Array} edges - Edges de React Flow
 * @returns {Array} Transiciones para el backend
 */
export function edgesToTransiciones(edges) {
  return edges.map((edge, index) => ({
    paso_origen_codigo: edge.source,
    paso_destino_codigo: edge.target,
    etiqueta: edge.data?.etiqueta || edge.label || 'siguiente',
    condicion: edge.data?.condicion || null,
    orden: index,
  }));
}

/**
 * Convierte los pasos del backend a nodos de React Flow
 * @param {Array} pasos - Pasos del backend
 * @returns {Array} Nodos de React Flow
 */
export function pasosToNodes(pasos) {
  return (pasos || []).map((paso) => {
    // Extraer posiciones del config._visual
    const visual = paso.config?._visual || {};
    const { _visual, ...configSinVisual } = paso.config || {};

    return {
      id: paso.codigo,
      type: paso.tipo,
      position: {
        x: visual.posicion_x || paso.posicion_x || 0,
        y: visual.posicion_y || paso.posicion_y || 0,
      },
      data: {
        label: paso.nombre,
        descripcion: paso.descripcion,
        config: configSinVisual,
        pasoId: paso.id,
      },
    };
  });
}

/**
 * Convierte las transiciones del backend a edges de React Flow
 * @param {Array} transiciones - Transiciones del backend
 * @returns {Array} Edges de React Flow
 */
export function transicionesToEdges(transiciones) {
  return (transiciones || []).map((trans) => ({
    id: `${trans.paso_origen_codigo}-${trans.paso_destino_codigo}`,
    source: trans.paso_origen_codigo,
    target: trans.paso_destino_codigo,
    label: trans.etiqueta,
    type: 'workflowEdge',
    animated: trans.etiqueta === 'aprobar',
    data: {
      etiqueta: trans.etiqueta,
      condicion: trans.condicion,
      transicionId: trans.id,
    },
    style: getEdgeStyle(trans.etiqueta),
  }));
}

/**
 * Obtiene el estilo de un edge según su etiqueta
 * @param {string} etiqueta
 * @returns {Object} Estilos CSS
 */
function getEdgeStyle(etiqueta) {
  const styles = {
    aprobar: { stroke: '#22c55e', strokeWidth: 2 },
    rechazar: { stroke: '#ef4444', strokeWidth: 2 },
    si: { stroke: '#22c55e', strokeWidth: 1.5 },
    no: { stroke: '#ef4444', strokeWidth: 1.5 },
    timeout: { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '5,5' },
    siguiente: { stroke: '#6b7280', strokeWidth: 1.5 },
  };

  return styles[etiqueta] || styles.siguiente;
}

/**
 * Hook combinado que prepara datos para usar con React Flow
 */
export function useWorkflowDesignerData(workflowId) {
  const { data: definicion, isLoading, error } = useWorkflowDefinicion(workflowId);

  const nodes = definicion ? pasosToNodes(definicion.pasos) : [];
  const edges = definicion ? transicionesToEdges(definicion.transiciones) : [];

  return {
    definicion,
    nodes,
    edges,
    isLoading,
    error,
  };
}
