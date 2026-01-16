import apiClient from '../client';
/**
 * API de Configuración de Almacén
 */
export const configuracionAlmacenApi = {
  /**
   * Listar configuraciones de todas las sucursales
   * @returns {Promise<Array>} Configuraciones
   */
  listar: () => apiClient.get('/inventario/configuracion-almacen'),

  /**
   * Obtener configuracion por sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>} Configuracion con ubicaciones
   */
  obtenerPorSucursal: (sucursalId) => apiClient.get(`/inventario/configuracion-almacen/${sucursalId}`),

  /**
   * Actualizar configuracion de sucursal
   * @param {number} sucursalId
   * @param {Object} data - { pasos_recepcion, pasos_envio, ubicacion_*_id, etc. }
   * @returns {Promise<Object>} Configuracion actualizada
   */
  actualizar: (sucursalId, data) => apiClient.put(`/inventario/configuracion-almacen/${sucursalId}`, data),

  /**
   * Crear ubicaciones por defecto para rutas multietapa
   * @param {number} sucursalId
   * @returns {Promise<Object>} Resultado con ubicaciones creadas
   */
  crearUbicacionesDefault: (sucursalId) => apiClient.post(`/inventario/configuracion-almacen/${sucursalId}/crear-ubicaciones`),

  /**
   * Verificar si la sucursal usa rutas multietapa
   * @param {number} sucursalId
   * @param {Object} params - { tipo?: 'recepcion' | 'envio' }
   * @returns {Promise<Object>} { usa_multietapa: boolean | { recepcion, envio } }
   */
  verificarMultietapa: (sucursalId, params = {}) => apiClient.get(`/inventario/configuracion-almacen/${sucursalId}/usa-multietapa`, { params }),

  /**
   * Obtener descripciones de todos los pasos disponibles
   * @returns {Promise<Object>} { recepcion: {1, 2, 3}, envio: {1, 2, 3} }
   */
  obtenerDescripcionesPasos: () => apiClient.get('/inventario/configuracion-almacen/descripciones-pasos'),
};

// ========================================================================
// PAQUETES DE ENVIO (Dic 2025)
// ========================================================================

/**
 * Endpoints para Paquetes de Envio (empaque)
 * @module paquetesApi
 */
