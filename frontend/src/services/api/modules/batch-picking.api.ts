import apiClient from '../client';

/**
 * API de Batch Picking
 */
export const batchPickingApi = {
  /** Listar batches con filtros */
  listar: (params: Record<string, unknown> = {}) => apiClient.get('/inventario/batch-picking', { params }),

  /** Obtener batch por ID con operaciones */
  obtenerPorId: (id: number) => apiClient.get(`/inventario/batch-picking/${id}`),

  /** Crear batch de picking */
  crear: (data: Record<string, unknown>) => apiClient.post('/inventario/batch-picking', data),

  /** Actualizar batch */
  actualizar: (id: number, data: Record<string, unknown>) => apiClient.put(`/inventario/batch-picking/${id}`, data),

  /** Eliminar batch (solo si está en borrador) */
  eliminar: (id: number) => apiClient.delete(`/inventario/batch-picking/${id}`),

  /** Agregar operación al batch */
  agregarOperacion: (batchId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/batch-picking/${batchId}/operaciones`, data),

  /** Quitar operación del batch */
  quitarOperacion: (batchId: number, operacionId: number) =>
    apiClient.delete(`/inventario/batch-picking/${batchId}/operaciones/${operacionId}`),

  /** Iniciar procesamiento del batch */
  iniciar: (id: number) => apiClient.post(`/inventario/batch-picking/${id}/iniciar`),

  /** Procesar item del batch */
  procesarItem: (id: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/batch-picking/${id}/procesar-item`, data),

  /** Completar batch */
  completar: (id: number) => apiClient.post(`/inventario/batch-picking/${id}/completar`),

  /** Cancelar batch */
  cancelar: (id: number) => apiClient.post(`/inventario/batch-picking/${id}/cancelar`),

  /** Obtener lista consolidada de productos a recoger */
  obtenerListaConsolidada: (id: number) => apiClient.get(`/inventario/batch-picking/${id}/lista-consolidada`),

  /** Obtener estadísticas del batch */
  obtenerEstadisticas: (id: number) => apiClient.get(`/inventario/batch-picking/${id}/estadisticas`),

  /** Obtener batches pendientes de una sucursal */
  obtenerPendientes: (sucursalId: number) => apiClient.get(`/inventario/batch-picking/pendientes/${sucursalId}`),

  /** Obtener operaciones de picking disponibles para batch */
  obtenerOperacionesDisponibles: (sucursalId: number) =>
    apiClient.get(`/inventario/batch-picking/operaciones-disponibles/${sucursalId}`),
};
