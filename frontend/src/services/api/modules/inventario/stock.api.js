import apiClient from '../../client';

/**
 * API de Stock de Inventario
 * Movimientos, ajustes, kardex y estadísticas
 */
export const stockApi = {
  // ========== Ajuste de Stock ==========

  /**
   * Ajustar stock manualmente (conteo físico, correcciones)
   * @param {number} id
   * @param {Object} data - { cantidad_ajuste, motivo, tipo_movimiento: 'entrada_ajuste' | 'salida_ajuste' }
   * @returns {Promise<Object>}
   */
  ajustarStock: (id, data) => apiClient.patch(`/inventario/productos/${id}/stock`, data),

  // ========== Movimientos de Inventario ==========

  /**
   * Registrar movimiento de inventario
   * @param {Object} data - { producto_id, tipo_movimiento, cantidad, costo_unitario?, proveedor_id?, venta_pos_id?, cita_id?, usuario_id?, referencia?, motivo?, fecha_vencimiento?, lote? }
   * @returns {Promise<Object>}
   */
  registrarMovimiento: (data) => apiClient.post('/inventario/movimientos', data),

  /**
   * Listar movimientos con filtros
   * @param {Object} params - { tipo_movimiento?, categoria?, producto_id?, proveedor_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { movimientos, total }
   */
  listarMovimientos: (params = {}) => apiClient.get('/inventario/movimientos', { params }),

  /**
   * Obtener kardex de un producto
   * @param {number} productoId
   * @param {Object} params - { tipo_movimiento?, fecha_desde?, fecha_hasta?, proveedor_id?, limit?, offset? }
   * @returns {Promise<Object>} { kardex, producto }
   */
  obtenerKardex: (productoId, params = {}) => apiClient.get(`/inventario/movimientos/kardex/${productoId}`, { params }),

  /**
   * Obtener estadísticas de movimientos
   * @param {Object} params - { fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} { estadisticas }
   */
  obtenerEstadisticasMovimientos: (params) => apiClient.get('/inventario/movimientos/estadisticas', { params }),

  // ========== Stock Disponible ==========

  /**
   * Obtener stock disponible de un producto (stock_actual - reservas_activas)
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>} { producto_id, stock_disponible }
   */
  obtenerStockDisponible: (productoId, params = {}) =>
    apiClient.get(`/inventario/productos/${productoId}/stock-disponible`, { params }),

  /**
   * Obtener stock disponible de múltiples productos
   * @param {Object} data - { producto_ids: [...], sucursal_id? }
   * @returns {Promise<Object>} { [producto_id]: { nombre, stock_actual, stock_disponible } }
   */
  obtenerStockDisponibleMultiple: (data) =>
    apiClient.post('/inventario/productos/stock-disponible', data),

  /**
   * Verificar si hay stock suficiente para una cantidad
   * @param {number} productoId
   * @param {Object} params - { cantidad, sucursal_id? }
   * @returns {Promise<Object>} { disponible, suficiente, faltante }
   */
  verificarDisponibilidad: (productoId, params) =>
    apiClient.get(`/inventario/productos/${productoId}/verificar-disponibilidad`, { params }),
};
