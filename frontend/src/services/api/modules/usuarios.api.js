import apiClient from '../client';
/**
 * API de Usuarios
 */
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

  // ========== Gestión de Usuarios Estilo Odoo - Dic 2025 ==========

  /**
   * Listar usuarios con filtros y paginación
   * @param {Object} params - { rol?, activo?, buscar?, page?, limit?, order_by?, order_direction? }
   * @returns {Promise<Object>}
   */
  listarConFiltros: (params = {}) => apiClient.get('/usuarios', { params }),

  /**
   * Crear usuario directamente (sin invitación)
   * @param {Object} data - { email, password, nombre, apellidos?, telefono?, rol?, profesional_id?, activo? }
   * @returns {Promise<Object>}
   */
  crearDirecto: (data) => apiClient.post('/usuarios/directo', data),

  /**
   * Cambiar estado activo de usuario
   * @param {number} id - ID del usuario
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<Object>}
   */
  cambiarEstado: (id, activo) => apiClient.patch(`/usuarios/${id}/estado`, { activo }),

  /**
   * Cambiar rol de usuario
   * @param {number} id - ID del usuario
   * @param {string} rol - Nuevo rol (admin, propietario, empleado)
   * @returns {Promise<Object>}
   */
  cambiarRol: (id, rol) => apiClient.patch(`/usuarios/${id}/rol`, { rol }),

  /**
   * Vincular o desvincular profesional a usuario
   * @param {number} id - ID del usuario
   * @param {number|null} profesionalId - ID del profesional o null para desvincular
   * @returns {Promise<Object>}
   */
  vincularProfesional: (id, profesionalId) =>
    apiClient.patch(`/usuarios/${id}/vincular-profesional`, { profesional_id: profesionalId }),

  /**
   * Obtener profesionales sin usuario vinculado (para selector)
   * @returns {Promise<Object>}
   */
  profesionalesDisponibles: () => apiClient.get('/usuarios/profesionales-disponibles'),

  /**
   * Obtener usuarios sin profesional vinculado (para vincular al crear profesional)
   * Dic 2025: Para flujo de crear profesional y vincular a usuario existente
   * @returns {Promise<Object>}
   */
  sinProfesional: () => apiClient.get('/usuarios/sin-profesional'),

  // ========== Gestión de Ubicaciones de Usuario - Ene 2026 ==========

  /**
   * Obtener ubicaciones asignadas a un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>}
   */
  obtenerUbicaciones: (usuarioId) => apiClient.get(`/usuarios/${usuarioId}/ubicaciones`),

  /**
   * Obtener ubicaciones disponibles para asignar a un usuario
   * @param {number} usuarioId - ID del usuario
   * @returns {Promise<Object>}
   */
  ubicacionesDisponibles: (usuarioId) => apiClient.get(`/usuarios/${usuarioId}/ubicaciones-disponibles`),

  /**
   * Asignar ubicación a usuario
   * @param {number} usuarioId - ID del usuario
   * @param {Object} data - { ubicacion_id, es_default?, puede_recibir?, puede_despachar? }
   * @returns {Promise<Object>}
   */
  asignarUbicacion: (usuarioId, data) => apiClient.post(`/usuarios/${usuarioId}/ubicaciones`, data),

  /**
   * Actualizar permisos de asignación de ubicación
   * @param {number} usuarioId - ID del usuario
   * @param {number} ubicacionId - ID de la ubicación
   * @param {Object} data - { es_default?, puede_recibir?, puede_despachar? }
   * @returns {Promise<Object>}
   */
  actualizarAsignacionUbicacion: (usuarioId, ubicacionId, data) =>
    apiClient.patch(`/usuarios/${usuarioId}/ubicaciones/${ubicacionId}`, data),

  /**
   * Desasignar ubicación de usuario
   * @param {number} usuarioId - ID del usuario
   * @param {number} ubicacionId - ID de la ubicación
   * @returns {Promise<Object>}
   */
  desasignarUbicacion: (usuarioId, ubicacionId) =>
    apiClient.delete(`/usuarios/${usuarioId}/ubicaciones/${ubicacionId}`),
};

// ==================== PROFESIONALES ====================
