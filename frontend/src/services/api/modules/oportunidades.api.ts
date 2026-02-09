import apiClient from '../client';

/**
 * API de Oportunidades (CRM)
 */
export const oportunidadesApi = {
  // ========== ETAPAS DEL PIPELINE ==========

  /** Listar etapas del pipeline */
  listarEtapas: (params: Record<string, unknown> = {}) =>
    apiClient.get('/oportunidades/etapas', { params }),

  /** Crear etapa */
  crearEtapa: (data: Record<string, unknown>) =>
    apiClient.post('/oportunidades/etapas', data),

  /** Actualizar etapa */
  actualizarEtapa: (etapaId: number, data: Record<string, unknown>) =>
    apiClient.put(`/oportunidades/etapas/${etapaId}`, data),

  /** Eliminar etapa */
  eliminarEtapa: (etapaId: number) =>
    apiClient.delete(`/oportunidades/etapas/${etapaId}`),

  /** Reordenar etapas */
  reordenarEtapas: (data: Record<string, unknown>) =>
    apiClient.put('/oportunidades/etapas/reordenar', data),

  // ========== PIPELINE ==========

  /** Obtener pipeline completo para Kanban */
  obtenerPipeline: (params: Record<string, unknown> = {}) =>
    apiClient.get('/oportunidades/pipeline', { params }),

  /** Obtener estadísticas del pipeline */
  obtenerEstadisticas: (params: Record<string, unknown> = {}) =>
    apiClient.get('/oportunidades/estadisticas', { params }),

  /** Obtener pronóstico de ventas */
  obtenerPronostico: (params: Record<string, unknown> = {}) =>
    apiClient.get('/oportunidades/pronostico', { params }),

  // ========== CRUD OPORTUNIDADES ==========

  /** Listar oportunidades */
  listar: (params: Record<string, unknown> = {}) =>
    apiClient.get('/oportunidades', { params }),

  /** Listar oportunidades por cliente */
  listarPorCliente: (clienteId: number, params: Record<string, unknown> = {}) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades`, { params }),

  /** Crear oportunidad */
  crear: (data: Record<string, unknown>) =>
    apiClient.post('/oportunidades', data),

  /** Obtener oportunidad por ID */
  obtenerPorId: (oportunidadId: number) =>
    apiClient.get(`/oportunidades/${oportunidadId}`),

  /** Actualizar oportunidad */
  actualizar: (oportunidadId: number, data: Record<string, unknown>) =>
    apiClient.put(`/oportunidades/${oportunidadId}`, data),

  /** Eliminar oportunidad */
  eliminar: (oportunidadId: number) =>
    apiClient.delete(`/oportunidades/${oportunidadId}`),

  // ========== OPERACIONES PIPELINE ==========

  /** Mover oportunidad a otra etapa (drag & drop) */
  mover: (oportunidadId: number, data: Record<string, unknown>) =>
    apiClient.patch(`/oportunidades/${oportunidadId}/mover`, data),

  /** Marcar oportunidad como ganada */
  marcarGanada: (oportunidadId: number) =>
    apiClient.patch(`/oportunidades/${oportunidadId}/ganar`),

  /** Marcar oportunidad como perdida */
  marcarPerdida: (oportunidadId: number, data: Record<string, unknown>) =>
    apiClient.patch(`/oportunidades/${oportunidadId}/perder`, data),

  /** Obtener estadísticas de oportunidades de un cliente */
  obtenerEstadisticasCliente: (clienteId: number) =>
    apiClient.get(`/clientes/${clienteId}/oportunidades/estadisticas`),
};
