import apiClient from '../client';

/**
 * API de Comisiones
 */
export const comisionesApi = {
  // ========== Configuración de Comisiones ==========

  /** Crear o actualizar configuración de comisión */
  crearConfiguracion: (data: Record<string, unknown>) => apiClient.post('/comisiones/configuracion', data),

  /** Listar configuraciones de comisión */
  listarConfiguraciones: (params: Record<string, unknown> = {}) => apiClient.get('/comisiones/configuracion', { params }),

  /** Obtener historial de cambios en configuración */
  obtenerHistorialConfiguracion: (params: Record<string, unknown> = {}) =>
    apiClient.get('/comisiones/configuracion/historial', { params }),

  /** Eliminar configuración de comisión */
  eliminarConfiguracion: (id: number) => apiClient.delete(`/comisiones/configuracion/${id}`),

  // ========== Consulta de Comisiones ==========

  /** Obtener comisiones de un profesional */
  obtenerPorProfesional: (profesionalId: number, params: Record<string, unknown> = {}) =>
    apiClient.get(`/comisiones/profesional/${profesionalId}`, { params }),

  /** Obtener comisiones por período */
  obtenerPorPeriodo: (params: Record<string, unknown> = {}) => apiClient.get('/comisiones/periodo', { params }),

  /** Obtener comisión por ID */
  obtener: (id: number) => apiClient.get(`/comisiones/${id}`),

  /** Marcar comisión como pagada */
  marcarComoPagada: (id: number, data: Record<string, unknown>) => apiClient.patch(`/comisiones/${id}/pagar`, data),

  // ========== Dashboard y Reportes ==========

  /** Obtener métricas del dashboard de comisiones */
  obtenerDashboard: (params: Record<string, unknown> = {}) => apiClient.get('/comisiones/dashboard', { params }),

  /** Obtener estadísticas de comisiones */
  obtenerEstadisticas: (params: Record<string, unknown> = {}) => apiClient.get('/comisiones/estadisticas', { params }),

  /** Obtener datos para gráfica de comisiones por día */
  obtenerGraficaPorDia: (params: Record<string, unknown> = {}) => apiClient.get('/comisiones/grafica/por-dia', { params }),
};
