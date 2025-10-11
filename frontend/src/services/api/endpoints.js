import apiClient from './client';

/**
 * API Endpoints para el sistema
 */

// ==================== AUTH ====================
export const authApi = {
  /**
   * Login de usuario
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, accessToken, refreshToken }
   */
  login: (credentials) => apiClient.post('/auth/login', credentials),

  /**
   * Refresh token
   * @param {string} refreshToken
   * @returns {Promise<Object>} { accessToken, refreshToken }
   */
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),

  /**
   * Logout
   * @returns {Promise<Object>}
   */
  logout: () => apiClient.post('/auth/logout'),
};

// ==================== ORGANIZACIONES ====================
export const organizacionesApi = {
  /**
   * Registro de organización (Onboarding público - Sin autenticación)
   * @param {Object} data - { organizacion, admin, aplicar_plantilla_servicios }
   * @returns {Promise<Object>} { organizacion, admin: { id, nombre, apellidos, email, rol, token }, servicios_creados }
   */
  register: (data) => apiClient.post('/organizaciones/register', data),

  /**
   * Crear organización (solo super_admin - Requiere autenticación)
   * @param {Object} data - Datos de la organización
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/organizaciones', data),

  /**
   * Obtener organización por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/organizaciones/${id}`),

  /**
   * Actualizar organización
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/organizaciones/${id}`, data),

  /**
   * Obtener estadísticas de la organización
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (id) => apiClient.get(`/organizaciones/${id}/estadisticas`),
};

// ==================== USUARIOS ====================
export const usuariosApi = {
  /**
   * Crear usuario (registro)
   * @param {Object} data - Datos del usuario
   * @returns {Promise<Object>} { user, accessToken, refreshToken }
   */
  crear: (data) => apiClient.post('/usuarios', data),

  /**
   * Obtener usuario por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/usuarios/${id}`),

  /**
   * Listar usuarios
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/usuarios'),

  /**
   * Actualizar usuario
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/usuarios/${id}`, data),
};

// ==================== PROFESIONALES ====================
export const profesionalesApi = {
  /**
   * Crear profesional
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/profesionales', data),

  /**
   * Listar profesionales
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/profesionales'),

  /**
   * Obtener profesional por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/profesionales/${id}`),

  /**
   * Actualizar profesional
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/profesionales/${id}`, data),

  /**
   * Eliminar profesional
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/profesionales/${id}`),
};

// ==================== SERVICIOS ====================
export const serviciosApi = {
  /**
   * Crear servicio
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/servicios', data),

  /**
   * Listar servicios
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/servicios'),

  /**
   * Obtener servicio por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/servicios/${id}`),

  /**
   * Actualizar servicio
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/servicios/${id}`, data),

  /**
   * Eliminar servicio
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/servicios/${id}`),
};

// ==================== CLIENTES ====================
export const clientesApi = {
  /**
   * Crear cliente
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/clientes', data),

  /**
   * Listar clientes con paginación
   * @param {Object} params - { page, limit, busqueda, activo, marketing_permitido, ordenPor, orden }
   * @returns {Promise<Object>} { data, pagination }
   */
  listar: (params = {}) => apiClient.get('/clientes', { params }),

  /**
   * Obtener cliente por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/clientes/${id}`),

  /**
   * Actualizar cliente
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/clientes/${id}`, data),

  /**
   * Eliminar cliente (soft delete)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/clientes/${id}`),

  /**
   * Búsqueda rápida de clientes
   * @param {Object} params - { q, limit }
   * @returns {Promise<Object>}
   */
  buscar: (params) => apiClient.get('/clientes/buscar', { params }),

  /**
   * Buscar cliente por teléfono (útil para walk-in)
   * @param {Object} params - { telefono, exacto, incluir_inactivos, crear_si_no_existe }
   * @returns {Promise<Object>}
   */
  buscarPorTelefono: (params) => apiClient.get('/clientes/buscar-telefono', { params }),

  /**
   * Buscar cliente por nombre
   * @param {Object} params - { nombre, limit }
   * @returns {Promise<Object>}
   */
  buscarPorNombre: (params) => apiClient.get('/clientes/buscar-nombre', { params }),

  /**
   * Obtener estadísticas de clientes
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: () => apiClient.get('/clientes/estadisticas'),

  /**
   * Cambiar estado de cliente (activo/inactivo)
   * @param {number} id
   * @param {boolean} activo
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/clientes/${id}/estado`, { activo }),
};

// ==================== CITAS ====================
export const citasApi = {
  /**
   * Crear cita
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/citas', data),

  /**
   * Listar citas
   * @param {Object} params - Filtros opcionales
   * @returns {Promise<Object>}
   */
  listar: (params = {}) => apiClient.get('/citas', { params }),

  /**
   * Obtener cita por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/citas/${id}`),

  /**
   * Actualizar cita
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/citas/${id}`, data),

  /**
   * Cancelar cita
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelar: (id) => apiClient.patch(`/citas/${id}/cancelar`),

  /**
   * Crear cita walk-in (cliente sin cita previa)
   * @param {Object} data - { cliente_id, nombre_cliente, profesional_id, servicio_id, tiempo_espera_aceptado, notas_walk_in }
   * @returns {Promise<Object>}
   */
  crearWalkIn: (data) => apiClient.post('/citas/walk-in', data),

  /**
   * Consultar disponibilidad inmediata para walk-in
   * @param {Object} params - { servicio_id, profesional_id }
   * @returns {Promise<Object>}
   */
  disponibilidadInmediata: (params) => apiClient.get('/citas/disponibilidad-inmediata', { params }),
};

// ==================== PLANES ====================
export const planesApi = {
  /**
   * Listar planes disponibles
   * @returns {Promise<Object>}
   */
  listar: () => apiClient.get('/planes'),

  /**
   * Obtener plan por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/planes/${id}`),
};

// ==================== WHATSAPP ====================
export const whatsappApi = {
  /**
   * Obtener QR Code para vincular WhatsApp
   * @returns {Promise<Object>} { qr_code_base64, session_id, status }
   */
  obtenerQR: () => apiClient.get('/whatsapp/qr-code'),

  /**
   * Verificar estado de WhatsApp
   * @returns {Promise<Object>} { status, phone_number, profile_name }
   */
  verificarEstado: () => apiClient.get('/whatsapp/status'),

  /**
   * Desvincular WhatsApp
   * @returns {Promise<Object>}
   */
  desvincular: () => apiClient.post('/whatsapp/disconnect'),
};

// Exportar todo como default también
export default {
  auth: authApi,
  organizaciones: organizacionesApi,
  usuarios: usuariosApi,
  profesionales: profesionalesApi,
  servicios: serviciosApi,
  clientes: clientesApi,
  citas: citasApi,
  planes: planesApi,
  whatsapp: whatsappApi,
};
