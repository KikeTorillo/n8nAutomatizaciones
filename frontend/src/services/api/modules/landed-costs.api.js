import apiClient from '../client';
/**
 * API de Landed Costs
 */
export const landedCostsApi = {
  /**
   * Listar costos adicionales de una OC
   * @param {number} ordenCompraId
   * @returns {Promise<Array>} Lista de costos adicionales
   */
  listar: (ordenCompraId) => apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos`),

  /**
   * Obtener resumen de costos de una OC
   * @param {number} ordenCompraId
   * @returns {Promise<Object>} { por_tipo, totales }
   */
  obtenerResumen: (ordenCompraId) => apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/resumen`),

  /**
   * Obtener un costo adicional por ID
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  obtener: (ordenCompraId, costoId) => apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`),

  /**
   * Crear costo adicional
   * @param {number} ordenCompraId
   * @param {Object} data - { tipo_costo, monto_total, metodo_distribucion, ... }
   */
  crear: (ordenCompraId, data) => apiClient.post(`/inventario/ordenes-compra/${ordenCompraId}/costos`, data),

  /**
   * Actualizar costo adicional
   * @param {number} ordenCompraId
   * @param {number} costoId
   * @param {Object} data
   */
  actualizar: (ordenCompraId, costoId, data) =>
    apiClient.put(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`, data),

  /**
   * Eliminar costo adicional
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  eliminar: (ordenCompraId, costoId) =>
    apiClient.delete(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`),

  /**
   * Distribuir un costo adicional a los items
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  distribuir: (ordenCompraId, costoId) =>
    apiClient.post(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}/distribuir`),

  /**
   * Obtener detalle de distribucion de un costo
   * @param {number} ordenCompraId
   * @param {number} costoId
   */
  obtenerDistribucion: (ordenCompraId, costoId) =>
    apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}/distribucion`),

  /**
   * Distribuir todos los costos pendientes de una OC
   * @param {number} ordenCompraId
   */
  distribuirTodos: (ordenCompraId) =>
    apiClient.post(`/inventario/ordenes-compra/${ordenCompraId}/distribuir-costos`),

  /**
   * Obtener costos totales desglosados por item
   * @param {number} ordenCompraId
   */
  obtenerCostosPorItems: (ordenCompraId) =>
    apiClient.get(`/inventario/ordenes-compra/${ordenCompraId}/costos-por-items`),
};

// ==================== DROPSHIPPING (Dic 2025) ====================
