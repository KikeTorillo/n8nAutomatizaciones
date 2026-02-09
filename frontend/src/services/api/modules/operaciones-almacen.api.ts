import apiClient from '../client';

/**
 * API de Operaciones de Almacén
 */
export const operacionesAlmacenApi = {
  /** Listar operaciones con filtros */
  listar: (params: Record<string, unknown> = {}) => apiClient.get('/inventario/operaciones', { params }),

  /** Obtener operación por ID con items */
  obtenerPorId: (id: number) => apiClient.get(`/inventario/operaciones/${id}`),

  /** Crear operación manual */
  crear: (data: Record<string, unknown>) => apiClient.post('/inventario/operaciones', data),

  /** Actualizar operación */
  actualizar: (id: number, data: Record<string, unknown>) => apiClient.put(`/inventario/operaciones/${id}`, data),

  /** Asignar operación a usuario */
  asignar: (id: number, data: Record<string, unknown> = {}) => apiClient.post(`/inventario/operaciones/${id}/asignar`, data),

  /** Iniciar procesamiento de operación */
  iniciar: (id: number) => apiClient.post(`/inventario/operaciones/${id}/iniciar`),

  /** Completar operación procesando items */
  completar: (id: number, data: Record<string, unknown>) => apiClient.post(`/inventario/operaciones/${id}/completar`, data),

  /** Cancelar operación */
  cancelar: (id: number, data: Record<string, unknown> = {}) => apiClient.post(`/inventario/operaciones/${id}/cancelar`, data),

  /** Procesar item individual */
  procesarItem: (itemId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/operaciones/items/${itemId}/procesar`, data),

  /** Cancelar item */
  cancelarItem: (itemId: number) => apiClient.post(`/inventario/operaciones/items/${itemId}/cancelar`),

  /** Obtener cadena completa de operaciones */
  obtenerCadena: (id: number) => apiClient.get(`/inventario/operaciones/${id}/cadena`),

  /** Obtener operaciones pendientes por sucursal */
  obtenerPendientes: (sucursalId: number) => apiClient.get(`/inventario/operaciones/pendientes/${sucursalId}`),

  /** Obtener estadísticas por tipo */
  obtenerEstadisticas: (sucursalId: number) => apiClient.get(`/inventario/operaciones/estadisticas/${sucursalId}`),

  /** Obtener resumen para vista Kanban */
  obtenerResumenKanban: (sucursalId: number) => apiClient.get(`/inventario/operaciones/kanban/${sucursalId}`),
};
