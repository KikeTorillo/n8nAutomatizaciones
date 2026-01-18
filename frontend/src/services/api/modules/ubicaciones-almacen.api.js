import apiClient from '../client';

/**
 * API de Ubicaciones de Almacén (WMS)
 * Gestión centralizada de ubicaciones, stock por ubicación y movimientos
 *
 * NOTA: Este archivo centraliza las funciones de ubicaciones que antes estaban
 * duplicadas en inventario.api.js y ordenes-compra.api.js
 */
export const ubicacionesAlmacenApi = {
  /**
   * Crear nueva ubicación de almacén
   * @param {Object} data - { sucursal_id, codigo, nombre?, tipo, parent_id?, capacidad_maxima?, es_picking?, es_recepcion?, ... }
   * @returns {Promise<Object>} Ubicación creada
   */
  crear: (data) => apiClient.post('/inventario/ubicaciones', data),

  /**
   * Obtener ubicación por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtener: (id) => apiClient.get(`/inventario/ubicaciones/${id}`),

  /**
   * Listar ubicaciones con filtros
   * @param {Object} params - { sucursal_id?, tipo?, parent_id?, es_picking?, es_recepcion?, activo?, bloqueada?, busqueda?, limit?, offset? }
   * @returns {Promise<Object>} { ubicaciones, total }
   */
  listar: (params = {}) => apiClient.get('/inventario/ubicaciones', { params }),

  /**
   * Obtener árbol jerárquico de ubicaciones de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Array>} Árbol de ubicaciones
   */
  obtenerArbol: (sucursalId) => apiClient.get(`/inventario/ubicaciones/arbol/${sucursalId}`),

  /**
   * Actualizar ubicación
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/inventario/ubicaciones/${id}`, data),

  /**
   * Eliminar ubicación (solo si no tiene stock ni sub-ubicaciones)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/inventario/ubicaciones/${id}`),

  /**
   * Bloquear/Desbloquear ubicación
   * @param {number} id
   * @param {Object} data - { bloqueada: boolean, motivo_bloqueo?: string }
   * @returns {Promise<Object>}
   */
  toggleBloqueo: (id, data) => apiClient.patch(`/inventario/ubicaciones/${id}/bloquear`, data),

  /**
   * Obtener stock de una ubicación
   * @param {number} id
   * @returns {Promise<Array>} Productos en la ubicación
   */
  obtenerStock: (id) => apiClient.get(`/inventario/ubicaciones/${id}/stock`),

  /**
   * Agregar stock a una ubicación
   * @param {number} ubicacionId
   * @param {Object} data - { producto_id, cantidad, lote?, fecha_vencimiento? }
   * @returns {Promise<Object>}
   */
  agregarStock: (ubicacionId, data) => apiClient.post(`/inventario/ubicaciones/${ubicacionId}/stock`, data),

  /**
   * Mover stock entre ubicaciones
   * @param {Object} data - { producto_id, ubicacion_origen_id, ubicacion_destino_id, cantidad, lote? }
   * @returns {Promise<Object>}
   */
  moverStock: (data) => apiClient.post('/inventario/ubicaciones/mover-stock', data),

  /**
   * Obtener ubicaciones disponibles para almacenar
   * @param {number} sucursalId
   * @param {Object} params - { cantidad? }
   * @returns {Promise<Array>}
   */
  obtenerDisponibles: (sucursalId, params = {}) => apiClient.get(`/inventario/ubicaciones/disponibles/${sucursalId}`, { params }),

  /**
   * Obtener estadísticas de ubicaciones de una sucursal
   * @param {number} sucursalId
   * @returns {Promise<Object>}
   */
  obtenerEstadisticas: (sucursalId) => apiClient.get(`/inventario/ubicaciones/estadisticas/${sucursalId}`),

  /**
   * Obtener ubicaciones donde está un producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerPorProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/ubicaciones`),
};
