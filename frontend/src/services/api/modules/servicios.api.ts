import apiClient from '../client';

/**
 * API de Servicios
 */
export const serviciosApi = {
  /** Crear servicio */
  crear: (data: Record<string, unknown>) => apiClient.post('/servicios', data),

  /** Crear múltiples servicios en transacción (bulk) */
  crearBulk: (servicios: Record<string, unknown>[]) => apiClient.post('/servicios/bulk-create', {
    servicios
  }),

  /** Listar servicios con filtros y paginación */
  listar: (params: Record<string, unknown> = {}) => apiClient.get('/servicios', { params }),

  /** Obtener servicio por ID */
  obtener: (id: number) => apiClient.get(`/servicios/${id}`),

  /** Actualizar servicio */
  actualizar: (id: number, data: Record<string, unknown>) => apiClient.put(`/servicios/${id}`, data),

  /** Eliminar servicio (soft delete) */
  eliminar: (id: number) => apiClient.delete(`/servicios/${id}`),

  /** Buscar servicios (búsqueda rápida) */
  buscar: (params: Record<string, unknown>) => apiClient.get('/servicios/buscar', { params }),

  /** Obtener profesionales asignados al servicio */
  obtenerProfesionales: (id: number) => apiClient.get(`/servicios/${id}/profesionales`),

  /** Asignar profesional al servicio */
  asignarProfesional: (id: number, data: Record<string, unknown>) => apiClient.post(`/servicios/${id}/profesionales`, data),

  /** Desasignar profesional del servicio */
  desasignarProfesional: (id: number, profId: number) => apiClient.delete(`/servicios/${id}/profesionales/${profId}`),

  /** Obtener servicios de un profesional */
  obtenerServiciosPorProfesional: (profesionalId: number, params: Record<string, unknown> = {}) =>
    apiClient.get(`/servicios/profesionales/${profesionalId}/servicios`, { params }),

  /** Obtener estadísticas de asignaciones servicio-profesional */
  obtenerEstadisticasAsignaciones: () =>
    apiClient.get('/servicios/estadisticas/asignaciones'),

  // =====================================================================
  // ROUND-ROBIN: Orden de profesionales (Ene 2026)
  // =====================================================================

  /** Obtener profesionales con orden de rotación */
  obtenerProfesionalesConOrden: (id: number) =>
    apiClient.get(`/servicios/${id}/profesionales/orden`),

  /** Actualizar orden de rotación de profesionales */
  actualizarOrdenProfesionales: (id: number, orden: Array<{ profesional_id: number; orden: number }>) =>
    apiClient.put(`/servicios/${id}/profesionales/orden`, { orden }),
};
