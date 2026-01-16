import apiClient from '../client';
/**
 * API de Vacaciones
 */
export const vacacionesApi = {
  // --- POLÍTICA ---

  /**
   * Obtener política de vacaciones de la organización
   * @returns {Promise<Object>} Política
   */
  obtenerPolitica: () => apiClient.get('/vacaciones/politica'),

  /**
   * Actualizar política de vacaciones
   * @param {Object} data - Datos de la política
   * @returns {Promise<Object>} Política actualizada
   */
  actualizarPolitica: (data) => apiClient.put('/vacaciones/politica', data),

  // --- NIVELES ---

  /**
   * Listar niveles de vacaciones por antigüedad
   * @param {Object} params - { activo? }
   * @returns {Promise<Array>} Niveles
   */
  listarNiveles: (params = {}) => apiClient.get('/vacaciones/niveles', { params }),

  /**
   * Crear nivel de vacaciones
   * @param {Object} data - Datos del nivel
   * @returns {Promise<Object>} Nivel creado
   */
  crearNivel: (data) => apiClient.post('/vacaciones/niveles', data),

  /**
   * Actualizar nivel
   * @param {number} id - ID del nivel
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Nivel actualizado
   */
  actualizarNivel: (id, data) => apiClient.put(`/vacaciones/niveles/${id}`, data),

  /**
   * Eliminar nivel
   * @param {number} id - ID del nivel
   * @returns {Promise<Object>} Resultado
   */
  eliminarNivel: (id) => apiClient.delete(`/vacaciones/niveles/${id}`),

  /**
   * Crear niveles preset por país (México LFT o Colombia)
   * @param {Object} data - { pais: 'mexico'|'colombia', sobrescribir? }
   * @returns {Promise<Array>} Niveles creados
   */
  crearNivelesPreset: (data) => apiClient.post('/vacaciones/niveles/preset', data),

  // --- SALDOS ---

  /**
   * Obtener mi saldo de vacaciones
   * @param {Object} params - { anio? }
   * @returns {Promise<Object>} { saldo, nivel }
   */
  obtenerMiSaldo: (params = {}) => apiClient.get('/vacaciones/mi-saldo', { params }),

  /**
   * Listar saldos de vacaciones (admin)
   * @param {Object} params - { anio?, profesional_id?, con_pendientes?, page?, limit? }
   * @returns {Promise<Object>} { data, total, page, limit }
   */
  listarSaldos: (params = {}) => apiClient.get('/vacaciones/saldos', { params }),

  /**
   * Ajustar saldo manualmente
   * @param {number} id - ID del saldo
   * @param {Object} data - { dias_ajuste, motivo }
   * @returns {Promise<Object>} Saldo actualizado
   */
  ajustarSaldo: (id, data) => apiClient.put(`/vacaciones/saldos/${id}/ajustar`, data),

  /**
   * Generar saldos para un año
   * @param {Object} data - { anio, profesional_id?, sobrescribir? }
   * @returns {Promise<Object>} { creados, actualizados, errores }
   */
  generarSaldosAnio: (data) => apiClient.post('/vacaciones/saldos/generar-anio', data),

  // --- SOLICITUDES ---

  /**
   * Crear solicitud de vacaciones
   * @param {Object} data - { fecha_inicio, fecha_fin, es_medio_dia?, turno_medio_dia?, motivo_solicitud? }
   * @returns {Promise<Object>} Solicitud creada
   */
  crearSolicitud: (data) => apiClient.post('/vacaciones/solicitudes', data),

  /**
   * Listar mis solicitudes
   * @param {Object} params - { estado?, anio?, page?, limit? }
   * @returns {Promise<Object>} { data, total }
   */
  listarMisSolicitudes: (params = {}) => apiClient.get('/vacaciones/mis-solicitudes', { params }),

  /**
   * Listar todas las solicitudes (admin)
   * @param {Object} params - { estado?, profesional_id?, fecha_inicio?, fecha_fin?, anio?, page?, limit? }
   * @returns {Promise<Object>} { data, total }
   */
  listarSolicitudes: (params = {}) => apiClient.get('/vacaciones/solicitudes', { params }),

  /**
   * Listar solicitudes pendientes de aprobación
   * @param {Object} params - { page?, limit? }
   * @returns {Promise<Object>} { data, total }
   */
  listarPendientes: (params = {}) => apiClient.get('/vacaciones/solicitudes/pendientes', { params }),

  /**
   * Obtener solicitud por ID
   * @param {number} id - ID de la solicitud
   * @returns {Promise<Object>} Solicitud
   */
  obtenerSolicitud: (id) => apiClient.get(`/vacaciones/solicitudes/${id}`),

  /**
   * Aprobar solicitud
   * @param {number} id - ID de la solicitud
   * @param {Object} data - { notas_internas? }
   * @returns {Promise<Object>} Solicitud aprobada
   */
  aprobarSolicitud: (id, data = {}) => apiClient.post(`/vacaciones/solicitudes/${id}/aprobar`, data),

  /**
   * Rechazar solicitud
   * @param {number} id - ID de la solicitud
   * @param {Object} data - { motivo_rechazo, notas_internas? }
   * @returns {Promise<Object>} Solicitud rechazada
   */
  rechazarSolicitud: (id, data) => apiClient.post(`/vacaciones/solicitudes/${id}/rechazar`, data),

  /**
   * Cancelar solicitud
   * @param {number} id - ID de la solicitud
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Solicitud cancelada
   */
  cancelarSolicitud: (id, data = {}) => apiClient.delete(`/vacaciones/solicitudes/${id}`, { data }),

  // --- DASHBOARD ---

  /**
   * Obtener dashboard de vacaciones del usuario
   * @param {Object} params - { anio? }
   * @returns {Promise<Object>} Dashboard con saldo, nivel, solicitudes recientes
   */
  obtenerDashboard: (params = {}) => apiClient.get('/vacaciones/dashboard', { params }),

  /**
   * Obtener estadísticas generales (admin)
   * @param {Object} params - { anio?, departamento_id? }
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: (params = {}) => apiClient.get('/vacaciones/estadisticas', { params }),
};

// ==================== MOTIVOS DE SALIDA (GAP-001) ====================
