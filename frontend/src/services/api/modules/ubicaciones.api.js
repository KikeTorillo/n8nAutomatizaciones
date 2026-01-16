import apiClient from '../client';
/**
 * API de Ubicaciones
 */
export const ubicacionesApi = {
  // ========== Países ==========

  /**
   * Listar todos los países activos
   * @returns {Promise<Object>} { paises: [...], total }
   */
  listarPaises: () => apiClient.get('/ubicaciones/paises'),

  /**
   * Obtener país por defecto (México)
   * @returns {Promise<Object>} País con datos completos
   */
  obtenerPaisDefault: () => apiClient.get('/ubicaciones/paises/default'),

  // ========== Estados ==========

  /**
   * Listar estados de México (shortcut)
   * @returns {Promise<Object>} { estados: [...], total, pais: 'México' }
   */
  listarEstadosMexico: () => apiClient.get('/ubicaciones/estados'),

  /**
   * Listar estados de un país específico
   * @param {number} paisId - ID del país
   * @returns {Promise<Object>} { estados: [...], total, pais_id }
   */
  listarEstadosPorPais: (paisId) => apiClient.get(`/ubicaciones/paises/${paisId}/estados`),

  /**
   * Buscar estados por nombre (autocomplete)
   * @param {string} q - Texto de búsqueda (min 2 chars)
   * @param {Object} options - { pais_id?, limite? }
   * @returns {Promise<Object>} { estados: [...], total, busqueda }
   */
  buscarEstados: (q, options = {}) =>
    apiClient.get('/ubicaciones/estados/buscar', { params: { q, ...options } }),

  /**
   * Obtener un estado por ID
   * @param {number} id - ID del estado
   * @returns {Promise<Object>} Estado con datos del país
   */
  obtenerEstado: (id) => apiClient.get(`/ubicaciones/estados/${id}`),

  // ========== Ciudades ==========

  /**
   * Listar ciudades de un estado
   * @param {number} estadoId - ID del estado
   * @param {boolean} principales - Solo ciudades principales
   * @returns {Promise<Object>} { ciudades: [...], total, estado_id }
   */
  listarCiudadesPorEstado: (estadoId, principales = false) =>
    apiClient.get(`/ubicaciones/estados/${estadoId}/ciudades`, {
      params: principales ? { principales: 'true' } : {}
    }),

  /**
   * Listar ciudades principales de México
   * @param {number} limite - Límite de resultados (default 50)
   * @returns {Promise<Object>} { ciudades: [...], total }
   */
  listarCiudadesPrincipales: (limite = 50) =>
    apiClient.get('/ubicaciones/ciudades/principales', { params: { limite } }),

  /**
   * Buscar ciudades por nombre (autocomplete)
   * @param {string} q - Texto de búsqueda (min 2 chars)
   * @param {Object} options - { estado_id?, limite? }
   * @returns {Promise<Object>} { ciudades: [...], total, busqueda }
   */
  buscarCiudades: (q, options = {}) =>
    apiClient.get('/ubicaciones/ciudades/buscar', { params: { q, ...options } }),

  /**
   * Obtener una ciudad por ID
   * @param {number} id - ID de la ciudad
   * @returns {Promise<Object>} Ciudad con estado y país
   */
  obtenerCiudad: (id) => apiClient.get(`/ubicaciones/ciudades/${id}`),

  /**
   * Obtener ubicación completa (ciudad + estado + país)
   * @param {number} ciudadId - ID de la ciudad
   * @returns {Promise<Object>} { ciudad, estado, pais, ids }
   */
  obtenerUbicacionCompleta: (ciudadId) =>
    apiClient.get(`/ubicaciones/ciudades/${ciudadId}/completa`),

  // ========== Códigos Postales ==========

  /**
   * Buscar códigos postales
   * @param {string} q - Código postal (min 3 chars)
   * @param {Object} options - { estado_id?, limite? }
   * @returns {Promise<Object>} { codigos_postales: [...], total }
   */
  buscarCodigosPostales: (q, options = {}) =>
    apiClient.get('/ubicaciones/codigos-postales/buscar', { params: { q, ...options } }),

  // ========== Utilidades ==========

  /**
   * Validar combinación de ubicación
   * @param {Object} data - { ciudad_id, estado_id, pais_id }
   * @returns {Promise<Object>} { valida: boolean }
   */
  validarUbicacion: (data) => apiClient.post('/ubicaciones/validar', data),
};

// ==================== RECORDATORIOS (Nov 2025) ====================
