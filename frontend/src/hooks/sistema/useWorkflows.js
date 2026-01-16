import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/services/api/endpoints';

// ==================== QUERIES ====================

/**
 * Hook para obtener aprobaciones pendientes del usuario actual
 * @param {Object} params - { entidad_tipo?, limit?, offset? }
 */
export function useAprobacionesPendientes(params = {}) {
  return useQuery({
    queryKey: ['aprobaciones-pendientes', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await workflowsApi.listarPendientes(sanitizedParams);
      return response.data.data || { instancias: [], total: 0 };
    },
    staleTime: 1000 * 30, // 30 segundos - se refresca frecuentemente
  });
}

/**
 * Hook para contar aprobaciones pendientes (para badge en sidebar)
 * Polling cada 30 segundos para mantener actualizado
 */
export function useContadorAprobaciones() {
  return useQuery({
    queryKey: ['aprobaciones-count'],
    queryFn: async () => {
      const response = await workflowsApi.contarPendientes();
      return response.data.data?.total || 0;
    },
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 30, // Polling cada 30 segundos
  });
}

/**
 * Hook para obtener detalle de una instancia de workflow
 * @param {number} id - ID de la instancia
 */
export function useInstanciaWorkflow(id) {
  return useQuery({
    queryKey: ['instancia-workflow', id],
    queryFn: async () => {
      const response = await workflowsApi.obtenerInstancia(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener historial de aprobaciones
 * @param {Object} params - { entidad_tipo?, estado?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useHistorialAprobaciones(params = {}) {
  return useQuery({
    queryKey: ['historial-aprobaciones', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await workflowsApi.listarHistorial(sanitizedParams);
      return response.data.data || { instancias: [], total: 0 };
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para listar delegaciones del usuario
 * @param {Object} params - { activas?, como_delegado? }
 */
export function useDelegaciones(params = {}) {
  return useQuery({
    queryKey: ['delegaciones', params],
    queryFn: async () => {
      const response = await workflowsApi.listarDelegaciones(params);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para listar definiciones de workflows
 * @param {Object} params - { entidad_tipo?, activo? }
 */
export function useDefinicionesWorkflow(params = {}) {
  return useQuery({
    queryKey: ['definiciones-workflow', params],
    queryFn: async () => {
      const response = await workflowsApi.listarDefiniciones(params);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Hook para obtener una definicion de workflow por ID
 * @param {number} id
 */
export function useDefinicionWorkflow(id) {
  return useQuery({
    queryKey: ['definicion-workflow', id],
    queryFn: async () => {
      const response = await workflowsApi.obtenerDefinicion(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para aprobar una solicitud
 */
export function useAprobarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comentario }) => {
      const response = await workflowsApi.aprobar(id, {
        comentario: comentario?.trim() || undefined,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries(['aprobaciones-pendientes']);
      queryClient.invalidateQueries(['aprobaciones-count']);
      queryClient.invalidateQueries(['instancia-workflow', variables.id]);
      queryClient.invalidateQueries(['historial-aprobaciones']);
      // Invalidar ordenes de compra si aplica
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes']);
    },
  });
}

/**
 * Hook para rechazar una solicitud
 */
export function useRechazarSolicitud() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await workflowsApi.rechazar(id, { motivo });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['aprobaciones-pendientes']);
      queryClient.invalidateQueries(['aprobaciones-count']);
      queryClient.invalidateQueries(['instancia-workflow', variables.id]);
      queryClient.invalidateQueries(['historial-aprobaciones']);
      queryClient.invalidateQueries(['ordenes-compra']);
    },
  });
}

/**
 * Hook para crear delegacion
 */
export function useCrearDelegacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        usuario_delegado_id: data.usuario_delegado_id,
        workflow_id: data.workflow_id || undefined,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        motivo: data.motivo?.trim() || undefined,
      };

      const response = await workflowsApi.crearDelegacion(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegaciones']);
    },
  });
}

/**
 * Hook para actualizar delegacion
 */
export function useActualizarDelegacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        fecha_fin: data.fecha_fin || undefined,
        activo: data.activo !== undefined ? data.activo : undefined,
        motivo: data.motivo?.trim() || undefined,
      };

      // Eliminar campos undefined
      Object.keys(sanitized).forEach((key) => {
        if (sanitized[key] === undefined) delete sanitized[key];
      });

      const response = await workflowsApi.actualizarDelegacion(id, sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegaciones']);
    },
  });
}

/**
 * Hook para eliminar delegacion
 */
export function useEliminarDelegacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await workflowsApi.eliminarDelegacion(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delegaciones']);
    },
  });
}
