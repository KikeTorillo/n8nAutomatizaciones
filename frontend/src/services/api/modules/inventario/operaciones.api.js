import apiClient from '../../client';
import { ubicacionesAlmacenApi } from '../ubicaciones-almacen.api';

/**
 * API de Operaciones de Inventario
 * Transferencias, rutas, reorden y WMS
 */
export const operacionesApi = {
  // ========== Ubicaciones de Almacén WMS (delegado a ubicacionesAlmacenApi) ==========
  // Re-exportación para compatibilidad retroactiva
  crearUbicacion: ubicacionesAlmacenApi.crear,
  obtenerUbicacion: ubicacionesAlmacenApi.obtener,
  listarUbicaciones: ubicacionesAlmacenApi.listar,
  obtenerArbolUbicaciones: ubicacionesAlmacenApi.obtenerArbol,
  actualizarUbicacion: ubicacionesAlmacenApi.actualizar,
  eliminarUbicacion: ubicacionesAlmacenApi.eliminar,
  toggleBloqueoUbicacion: ubicacionesAlmacenApi.toggleBloqueo,
  obtenerStockUbicacion: ubicacionesAlmacenApi.obtenerStock,
  agregarStockUbicacion: ubicacionesAlmacenApi.agregarStock,
  moverStockUbicacion: ubicacionesAlmacenApi.moverStock,
  obtenerUbicacionesDisponibles: ubicacionesAlmacenApi.obtenerDisponibles,
  obtenerEstadisticasUbicaciones: ubicacionesAlmacenApi.obtenerEstadisticas,
  obtenerUbicacionesProducto: ubicacionesAlmacenApi.obtenerPorProducto,

  // ========== Rutas de Operación ==========

  /**
   * Crear rutas por defecto para la organización
   * @returns {Promise<Object>} { rutas: [...] }
   */
  inicializarRutas: () => apiClient.post('/inventario/rutas-operacion/init'),

  /**
   * Listar rutas de operación
   * @param {Object} params - { tipo?, activo? }
   * @returns {Promise<Object>} { rutas: [...] }
   */
  listarRutas: (params = {}) => apiClient.get('/inventario/rutas-operacion', { params }),

  /**
   * Crear ruta de operación
   * @param {Object} data - { codigo, nombre, descripcion?, tipo, prioridad?, sucursal_origen_id?, proveedor_default_id?, lead_time_dias?, activo?, es_default? }
   * @returns {Promise<Object>}
   */
  crearRuta: (data) => apiClient.post('/inventario/rutas-operacion', data),

  /**
   * Obtener ruta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerRuta: (id) => apiClient.get(`/inventario/rutas-operacion/${id}`),

  /**
   * Actualizar ruta
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarRuta: (id, data) => apiClient.put(`/inventario/rutas-operacion/${id}`, data),

  /**
   * Eliminar ruta
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarRuta: (id) => apiClient.delete(`/inventario/rutas-operacion/${id}`),

  /**
   * Obtener rutas asignadas a un producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerRutasProducto: (productoId) => apiClient.get(`/inventario/productos/${productoId}/rutas`),

  /**
   * Asignar ruta a producto
   * @param {number} productoId
   * @param {Object} data - { ruta_id, prioridad?, sucursal_id? }
   * @returns {Promise<Object>}
   */
  asignarRutaProducto: (productoId, data) => apiClient.post(`/inventario/productos/${productoId}/rutas`, data),

  /**
   * Quitar ruta de producto
   * @param {number} productoId
   * @param {number} rutaId
   * @returns {Promise<Object>}
   */
  quitarRutaProducto: (productoId, rutaId) => apiClient.delete(`/inventario/productos/${productoId}/rutas/${rutaId}`),

  /**
   * Obtener mejor ruta para un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerMejorRuta: (productoId, params = {}) => apiClient.get(`/inventario/productos/${productoId}/mejor-ruta`, { params }),

  // ========== Reglas de Reabastecimiento ==========

  /**
   * Listar reglas de reabastecimiento
   * @param {Object} params - { activo?, tipo_trigger? }
   * @returns {Promise<Object>} { reglas: [...] }
   */
  listarReglasReabastecimiento: (params = {}) => apiClient.get('/inventario/reglas-reabastecimiento', { params }),

  /**
   * Crear regla de reabastecimiento
   * @param {Object} data - { nombre, descripcion?, tipo_trigger, condicion, acciones, activo? }
   * @returns {Promise<Object>}
   */
  crearReglaReabastecimiento: (data) => apiClient.post('/inventario/reglas-reabastecimiento', data),

  /**
   * Obtener regla por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerReglaReabastecimiento: (id) => apiClient.get(`/inventario/reglas-reabastecimiento/${id}`),

  /**
   * Actualizar regla
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarReglaReabastecimiento: (id, data) => apiClient.put(`/inventario/reglas-reabastecimiento/${id}`, data),

  /**
   * Eliminar regla
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarReglaReabastecimiento: (id) => apiClient.delete(`/inventario/reglas-reabastecimiento/${id}`),

  // ========== Transferencias entre Sucursales ==========

  /**
   * Listar solicitudes de transferencia
   * @param {Object} params - { estado?, sucursal_origen_id?, sucursal_destino_id? }
   * @returns {Promise<Object>} { transferencias: [...] }
   */
  listarTransferencias: (params = {}) => apiClient.get('/inventario/transferencias', { params }),

  /**
   * Crear solicitud de transferencia
   * @param {Object} data - { sucursal_origen_id, sucursal_destino_id, items: [{ producto_id, cantidad }], notas? }
   * @returns {Promise<Object>}
   */
  crearTransferencia: (data) => apiClient.post('/inventario/transferencias', data),

  /**
   * Obtener transferencia con items
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerTransferencia: (id) => apiClient.get(`/inventario/transferencias/${id}`),

  /**
   * Aprobar solicitud de transferencia
   * @param {number} id
   * @returns {Promise<Object>}
   */
  aprobarTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/aprobar`),

  /**
   * Rechazar solicitud de transferencia
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>}
   */
  rechazarTransferencia: (id, data = {}) => apiClient.post(`/inventario/transferencias/${id}/rechazar`, data),

  /**
   * Marcar transferencia como enviada
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviarTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/enviar`),

  /**
   * Marcar transferencia como recibida
   * @param {number} id
   * @returns {Promise<Object>}
   */
  recibirTransferencia: (id) => apiClient.post(`/inventario/transferencias/${id}/recibir`),
};
