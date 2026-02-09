import apiClient from '../client';

/**
 * API de Vacaciones
 */
export const vacacionesApi = {
  // --- POLÍTICA ---

  /** Obtener política de vacaciones de la organización */
  obtenerPolitica: () => apiClient.get('/vacaciones/politica'),

  /** Actualizar política de vacaciones */
  actualizarPolitica: (data: Record<string, unknown>) => apiClient.put('/vacaciones/politica', data),

  // --- NIVELES ---

  /** Listar niveles de vacaciones por antigüedad */
  listarNiveles: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/niveles', { params }),

  /** Crear nivel de vacaciones */
  crearNivel: (data: Record<string, unknown>) => apiClient.post('/vacaciones/niveles', data),

  /** Actualizar nivel */
  actualizarNivel: (id: number, data: Record<string, unknown>) => apiClient.put(`/vacaciones/niveles/${id}`, data),

  /** Eliminar nivel */
  eliminarNivel: (id: number) => apiClient.delete(`/vacaciones/niveles/${id}`),

  /** Crear niveles preset por país (México LFT o Colombia) */
  crearNivelesPreset: (data: Record<string, unknown>) => apiClient.post('/vacaciones/niveles/preset', data),

  // --- SALDOS ---

  /** Obtener mi saldo de vacaciones */
  obtenerMiSaldo: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/mi-saldo', { params }),

  /** Listar saldos de vacaciones (admin) */
  listarSaldos: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/saldos', { params }),

  /** Ajustar saldo manualmente */
  ajustarSaldo: (id: number, data: Record<string, unknown>) => apiClient.put(`/vacaciones/saldos/${id}/ajustar`, data),

  /** Generar saldos para un año */
  generarSaldosAnio: (data: Record<string, unknown>) => apiClient.post('/vacaciones/saldos/generar-anio', data),

  // --- SOLICITUDES ---

  /** Crear solicitud de vacaciones */
  crearSolicitud: (data: Record<string, unknown>) => apiClient.post('/vacaciones/solicitudes', data),

  /** Listar mis solicitudes */
  listarMisSolicitudes: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/mis-solicitudes', { params }),

  /** Listar todas las solicitudes (admin) */
  listarSolicitudes: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/solicitudes', { params }),

  /** Listar solicitudes pendientes de aprobación */
  listarPendientes: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/solicitudes/pendientes', { params }),

  /** Obtener solicitud por ID */
  obtenerSolicitud: (id: number) => apiClient.get(`/vacaciones/solicitudes/${id}`),

  /** Aprobar solicitud */
  aprobarSolicitud: (id: number, data: Record<string, unknown> = {}) => apiClient.post(`/vacaciones/solicitudes/${id}/aprobar`, data),

  /** Rechazar solicitud */
  rechazarSolicitud: (id: number, data: Record<string, unknown>) => apiClient.post(`/vacaciones/solicitudes/${id}/rechazar`, data),

  /** Cancelar solicitud */
  cancelarSolicitud: (id: number, data: Record<string, unknown> = {}) => apiClient.delete(`/vacaciones/solicitudes/${id}`, { data }),

  // --- DASHBOARD ---

  /** Obtener dashboard de vacaciones del usuario */
  obtenerDashboard: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/dashboard', { params }),

  /** Obtener estadísticas generales (admin) */
  obtenerEstadisticas: (params: Record<string, unknown> = {}) => apiClient.get('/vacaciones/estadisticas', { params }),
};
