import apiClient from '../client';

/**
 * API de Workflows
 */
export const workflowsApi = {
  // ========== Bandeja de Aprobaciones ==========

  /** Listar aprobaciones pendientes del usuario actual */
  listarPendientes: (params: Record<string, any>) => apiClient.get('/workflows/pendientes', { params }),

  /** Contar aprobaciones pendientes (para badge) */
  contarPendientes: () => apiClient.get('/workflows/pendientes/count'),

  /** Obtener detalle de una instancia de workflow */
  obtenerInstancia: (id: number) => apiClient.get(`/workflows/instancias/${id}`),

  // ========== Acciones ==========

  /** Aprobar una solicitud */
  aprobar: (id: number, data: Record<string, any>) => apiClient.post(`/workflows/instancias/${id}/aprobar`, data),

  /** Rechazar una solicitud */
  rechazar: (id: number, data: Record<string, any>) => apiClient.post(`/workflows/instancias/${id}/rechazar`, data),

  // ========== Historial ==========

  /** Obtener historial de aprobaciones */
  listarHistorial: (params: Record<string, any>) => apiClient.get('/workflows/historial', { params }),

  // ========== Delegaciones ==========

  /** Listar delegaciones del usuario */
  listarDelegaciones: (params: Record<string, any>) => apiClient.get('/workflows/delegaciones', { params }),

  /** Crear delegación */
  crearDelegacion: (data: Record<string, any>) => apiClient.post('/workflows/delegaciones', data),

  /** Actualizar delegación */
  actualizarDelegacion: (id: number, data: Record<string, any>) => apiClient.put(`/workflows/delegaciones/${id}`, data),

  /** Eliminar delegación */
  eliminarDelegacion: (id: number) => apiClient.delete(`/workflows/delegaciones/${id}`),

  // ========== Definiciones (lectura) ==========

  /** Listar definiciones de workflows */
  listarDefiniciones: (params: Record<string, any>) => apiClient.get('/workflows/definiciones', { params }),

  /** Obtener definición por ID */
  obtenerDefinicion: (id: number) => apiClient.get(`/workflows/definiciones/${id}`),
};
