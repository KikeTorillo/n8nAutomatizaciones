/**
 * ====================================================================
 * HOOKS - OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * Hooks TanStack Query para gestión de oportunidades y pipeline Kanban
 *
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oportunidadesApi } from '@/services/api/endpoints';

// ====================================================================
// CONSTANTES
// ====================================================================

export const PRIORIDADES_OPORTUNIDAD = [
  { value: 'baja', label: 'Baja', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' },
  { value: 'normal', label: 'Normal', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'alta', label: 'Alta', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  { value: 'urgente', label: 'Urgente', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export const ESTADOS_OPORTUNIDAD = [
  { value: 'abierta', label: 'Abierta', color: 'text-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30' },
  { value: 'ganada', label: 'Ganada', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { value: 'perdida', label: 'Perdida', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
];

export const FUENTES_OPORTUNIDAD = [
  { value: 'web', label: 'Sitio web' },
  { value: 'referido', label: 'Referido' },
  { value: 'llamada', label: 'Llamada entrante' },
  { value: 'evento', label: 'Evento/Feria' },
  { value: 'redes_sociales', label: 'Redes sociales' },
  { value: 'otro', label: 'Otro' },
];

// ====================================================================
// QUERIES - ETAPAS
// ====================================================================

/**
 * Hook para listar etapas del pipeline
 */
export function useEtapasPipeline(incluirInactivas = false) {
  return useQuery({
    queryKey: ['etapas-pipeline', incluirInactivas],
    queryFn: async () => {
      const response = await oportunidadesApi.listarEtapas({ incluirInactivas });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// ====================================================================
// QUERIES - OPORTUNIDADES
// ====================================================================

/**
 * Hook para listar oportunidades con filtros
 */
export function useOportunidades(params = {}) {
  return useQuery({
    queryKey: ['oportunidades', params],
    queryFn: async () => {
      const response = await oportunidadesApi.listar(params);
      return {
        oportunidades: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener oportunidades de un cliente
 */
export function useOportunidadesCliente(clienteId, params = {}) {
  return useQuery({
    queryKey: ['oportunidades-cliente', clienteId, params],
    queryFn: async () => {
      const response = await oportunidadesApi.listarPorCliente(clienteId, params);
      return {
        oportunidades: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener una oportunidad por ID
 */
export function useOportunidad(oportunidadId) {
  return useQuery({
    queryKey: ['oportunidad', oportunidadId],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPorId(oportunidadId);
      return response.data.data;
    },
    enabled: !!oportunidadId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener el pipeline completo (Kanban)
 */
export function usePipeline(vendedorId = null) {
  return useQuery({
    queryKey: ['pipeline', vendedorId],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPipeline({ vendedor_id: vendedorId });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minuto para refrescar frecuentemente
  });
}

/**
 * Hook para obtener estadísticas del pipeline
 */
export function useEstadisticasPipeline(vendedorId = null) {
  return useQuery({
    queryKey: ['pipeline-estadisticas', vendedorId],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerEstadisticas({ vendedor_id: vendedorId });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener pronóstico de ventas
 */
export function usePronosticoVentas(fechaInicio, fechaFin) {
  return useQuery({
    queryKey: ['pronostico-ventas', fechaInicio, fechaFin],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerPronostico({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para obtener estadísticas de oportunidades de un cliente
 */
export function useEstadisticasOportunidadesCliente(clienteId) {
  return useQuery({
    queryKey: ['oportunidades-cliente-estadisticas', clienteId],
    queryFn: async () => {
      const response = await oportunidadesApi.obtenerEstadisticasCliente(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: 1000 * 60 * 2,
  });
}

// ====================================================================
// MUTATIONS - ETAPAS
// ====================================================================

/**
 * Hook para crear etapa
 */
export function useCrearEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await oportunidadesApi.crearEtapa(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['etapas-pipeline']);
      queryClient.invalidateQueries(['pipeline']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear etapa';
      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar etapa
 */
export function useActualizarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ etapaId, data }) => {
      const response = await oportunidadesApi.actualizarEtapa(etapaId, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['etapas-pipeline']);
      queryClient.invalidateQueries(['pipeline']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar etapa';
      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar etapa
 */
export function useEliminarEtapa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapaId) => {
      await oportunidadesApi.eliminarEtapa(etapaId);
      return etapaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['etapas-pipeline']);
      queryClient.invalidateQueries(['pipeline']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al eliminar etapa';
      throw new Error(message);
    },
  });
}

/**
 * Hook para reordenar etapas
 */
export function useReordenarEtapas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordenIds) => {
      const response = await oportunidadesApi.reordenarEtapas({ orden: ordenIds });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['etapas-pipeline']);
      queryClient.invalidateQueries(['pipeline']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al reordenar etapas';
      throw new Error(message);
    },
  });
}

// ====================================================================
// MUTATIONS - OPORTUNIDADES
// ====================================================================

/**
 * Hook para crear oportunidad
 */
export function useCrearOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await oportunidadesApi.crear(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['oportunidades']);
      queryClient.invalidateQueries(['pipeline']);
      queryClient.invalidateQueries(['pipeline-estadisticas']);
      if (data.cliente_id) {
        queryClient.invalidateQueries(['oportunidades-cliente', data.cliente_id]);
        queryClient.invalidateQueries(['oportunidades-cliente-estadisticas', data.cliente_id]);
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear oportunidad';
      throw new Error(message);
    },
  });
}

/**
 * Hook para actualizar oportunidad
 */
export function useActualizarOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, data }) => {
      const response = await oportunidadesApi.actualizar(oportunidadId, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['oportunidad', variables.oportunidadId]);
      queryClient.invalidateQueries(['oportunidades']);
      queryClient.invalidateQueries(['pipeline']);
      queryClient.invalidateQueries(['pipeline-estadisticas']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar oportunidad';
      throw new Error(message);
    },
  });
}

/**
 * Hook para eliminar oportunidad
 */
export function useEliminarOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (oportunidadId) => {
      await oportunidadesApi.eliminar(oportunidadId);
      return oportunidadId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['oportunidades']);
      queryClient.invalidateQueries(['pipeline']);
      queryClient.invalidateQueries(['pipeline-estadisticas']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al eliminar oportunidad';
      throw new Error(message);
    },
  });
}

/**
 * Hook para mover oportunidad a otra etapa (drag & drop)
 */
export function useMoverOportunidad() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, etapaId }) => {
      const response = await oportunidadesApi.mover(oportunidadId, { etapa_id: etapaId });
      return response.data.data;
    },
    onMutate: async ({ oportunidadId, etapaId }) => {
      // Optimistic update para drag & drop fluido
      await queryClient.cancelQueries(['pipeline']);
      const previousPipeline = queryClient.getQueryData(['pipeline']);
      return { previousPipeline };
    },
    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousPipeline) {
        queryClient.setQueryData(['pipeline'], context.previousPipeline);
      }
      const message = error.response?.data?.message || 'Error al mover oportunidad';
      throw new Error(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pipeline']);
      queryClient.invalidateQueries(['pipeline-estadisticas']);
      queryClient.invalidateQueries(['oportunidades']);
    },
  });
}

/**
 * Hook para marcar oportunidad como ganada
 */
export function useMarcarGanada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (oportunidadId) => {
      const response = await oportunidadesApi.marcarGanada(oportunidadId);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['oportunidad', data.id]);
      queryClient.invalidateQueries(['oportunidades']);
      queryClient.invalidateQueries(['pipeline']);
      queryClient.invalidateQueries(['pipeline-estadisticas']);
      queryClient.invalidateQueries(['pronostico-ventas']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al marcar como ganada';
      throw new Error(message);
    },
  });
}

/**
 * Hook para marcar oportunidad como perdida
 */
export function useMarcarPerdida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ oportunidadId, motivoPerdida }) => {
      const response = await oportunidadesApi.marcarPerdida(oportunidadId, { motivo_perdida: motivoPerdida });
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['oportunidad', data.id]);
      queryClient.invalidateQueries(['oportunidades']);
      queryClient.invalidateQueries(['pipeline']);
      queryClient.invalidateQueries(['pipeline-estadisticas']);
      queryClient.invalidateQueries(['pronostico-ventas']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al marcar como perdida';
      throw new Error(message);
    },
  });
}

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Obtener configuración de prioridad
 */
export function getPrioridadOportunidad(prioridad) {
  return PRIORIDADES_OPORTUNIDAD.find(p => p.value === prioridad) || PRIORIDADES_OPORTUNIDAD[1];
}

/**
 * Obtener configuración de estado
 */
export function getEstado(estado) {
  return ESTADOS_OPORTUNIDAD.find(e => e.value === estado) || ESTADOS_OPORTUNIDAD[0];
}

/**
 * Obtener configuración de fuente
 */
export function getFuente(fuente) {
  return FUENTES_OPORTUNIDAD.find(f => f.value === fuente) || { value: fuente, label: fuente || 'Sin especificar' };
}

/**
 * Formatear valor monetario
 */
export function formatMoney(amount, currency = 'MXN') {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calcular valor ponderado (ingreso * probabilidad)
 */
export function calcularValorPonderado(ingreso, probabilidad) {
  if (!ingreso || !probabilidad) return 0;
  return (ingreso * probabilidad) / 100;
}

/**
 * Obtener color de probabilidad
 */
export function getProbabilidadColor(probabilidad) {
  if (probabilidad >= 75) return 'text-green-500';
  if (probabilidad >= 50) return 'text-primary-500';
  if (probabilidad >= 25) return 'text-yellow-500';
  return 'text-gray-500';
}
