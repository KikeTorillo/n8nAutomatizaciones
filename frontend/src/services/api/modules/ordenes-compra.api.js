import apiClient from '../client';
import { ubicacionesAlmacenApi } from './ubicaciones-almacen.api';

/**
 * API de Órdenes de Compra
 */
export const ordenesCompraApi = {
  // ========== CRUD Básico ==========

  /**
   * Crear orden de compra
   * @param {Object} data - { proveedor_id, fecha_entrega_esperada?, descuento_porcentaje?, descuento_monto?, impuestos?, dias_credito?, notas?, referencia_proveedor?, items?[] }
   * @returns {Promise<Object>}
   */
  crear: (data) => apiClient.post('/inventario/ordenes-compra', data),

  /**
   * Listar ordenes de compra
   * @param {Object} params - { proveedor_id?, estado?, estado_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>}
   */
  listar: (params) => apiClient.get('/inventario/ordenes-compra', { params }),

  /**
   * Obtener orden por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/ordenes-compra/${id}`),

  /**
   * Actualizar orden (solo borradores)
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizar: (id, data) => apiClient.put(`/inventario/ordenes-compra/${id}`, data),

  /**
   * Eliminar orden (solo borradores)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminar: (id) => apiClient.delete(`/inventario/ordenes-compra/${id}`),

  // ========== Gestión de Items ==========

  /**
   * Agregar items a orden
   * @param {number} ordenId
   * @param {Object} data - { items: [{ producto_id, cantidad_ordenada, precio_unitario?, fecha_vencimiento?, notas? }] }
   * @returns {Promise<Object>}
   */
  agregarItems: (ordenId, data) => apiClient.post(`/inventario/ordenes-compra/${ordenId}/items`, data),

  /**
   * Actualizar item de orden
   * @param {number} ordenId
   * @param {number} itemId
   * @param {Object} data - { cantidad_ordenada?, precio_unitario?, fecha_vencimiento?, notas? }
   * @returns {Promise<Object>}
   */
  actualizarItem: (ordenId, itemId, data) => apiClient.put(`/inventario/ordenes-compra/${ordenId}/items/${itemId}`, data),

  /**
   * Eliminar item de orden
   * @param {number} ordenId
   * @param {number} itemId
   * @returns {Promise<Object>}
   */
  eliminarItem: (ordenId, itemId) => apiClient.delete(`/inventario/ordenes-compra/${ordenId}/items/${itemId}`),

  // ========== Cambios de Estado ==========

  /**
   * Enviar orden al proveedor (borrador -> enviada)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  enviar: (id) => apiClient.patch(`/inventario/ordenes-compra/${id}/enviar`),

  /**
   * Cancelar orden
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>}
   */
  cancelar: (id, data) => apiClient.patch(`/inventario/ordenes-compra/${id}/cancelar`, data),

  // ========== Recepción de Mercancía ==========

  /**
   * Recibir mercancía (parcial o total)
   * @param {number} ordenId
   * @param {Object} data - { recepciones: [{ item_id, cantidad, precio_unitario_real?, fecha_vencimiento?, lote?, notas? }] }
   * @returns {Promise<Object>}
   */
  recibirMercancia: (ordenId, data) => apiClient.post(`/inventario/ordenes-compra/${ordenId}/recibir`, data),

  // ========== Pagos ==========

  /**
   * Registrar pago de orden
   * @param {number} id
   * @param {Object} data - { monto }
   * @returns {Promise<Object>}
   */
  registrarPago: (id, data) => apiClient.post(`/inventario/ordenes-compra/${id}/pago`, data),

  // ========== Reportes ==========

  /**
   * Obtener ordenes pendientes de recibir
   * @returns {Promise<Object>}
   */
  obtenerPendientes: () => apiClient.get('/inventario/ordenes-compra/pendientes'),

  /**
   * Obtener ordenes pendientes de pago
   * @returns {Promise<Object>}
   */
  obtenerPendientesPago: () => apiClient.get('/inventario/ordenes-compra/pendientes-pago'),

  /**
   * Obtener estadísticas de compras por proveedor
   * @param {Object} params - { fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>}
   */
  estadisticasPorProveedor: (params) => apiClient.get('/inventario/ordenes-compra/reportes/por-proveedor', { params }),

  // ========== Auto-generación de OC (Dic 2025 - Fase 2 Gaps) ==========

  /**
   * Obtener sugerencias de OC (productos con stock bajo)
   * @returns {Promise<Object>} { productos: [...] }
   */
  obtenerSugerenciasOC: () => apiClient.get('/inventario/ordenes-compra/sugerencias'),

  /**
   * Generar OC desde un producto con stock bajo
   * @param {number} productoId
   * @returns {Promise<Object>} Orden de compra creada
   */
  generarOCDesdeProducto: (productoId) => apiClient.post(`/inventario/ordenes-compra/generar-desde-producto/${productoId}`),

  /**
   * Generar OCs automáticas para todos los productos con stock bajo
   * @returns {Promise<Object>} { ordenes_creadas, errores }
   */
  autoGenerarOCs: () => apiClient.post('/inventario/ordenes-compra/auto-generar'),

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
};

// ==================== PUNTO DE VENTA (POS) ====================
