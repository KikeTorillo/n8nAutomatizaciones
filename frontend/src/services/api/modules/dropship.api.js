import apiClient from '../client';
/**
 * API de Dropship
 */
export const dropshipApi = {
  /**
   * Obtener estadisticas de dropship
   * @returns {Promise<Object>} { borradores, enviadas, entregadas, canceladas, ... }
   */
  obtenerEstadisticas: () => apiClient.get('/inventario/dropship/estadisticas'),

  /**
   * Obtener configuracion dropship de la organizacion
   * @returns {Promise<Object>} { dropship_auto_generar_oc }
   */
  obtenerConfiguracion: () => apiClient.get('/inventario/dropship/configuracion'),

  /**
   * Actualizar configuracion dropship
   * @param {Object} data - { dropship_auto_generar_oc: boolean }
   */
  actualizarConfiguracion: (data) => apiClient.patch('/inventario/dropship/configuracion', data),

  /**
   * Obtener ventas pendientes de generar OC dropship
   * @returns {Promise<Array>} Lista de ventas pendientes
   */
  obtenerVentasPendientes: () => apiClient.get('/inventario/dropship/pendientes'),

  /**
   * Crear OC dropship desde una venta
   * @param {number} ventaId - ID de la venta
   * @returns {Promise<Object>} Resultado con OCs creadas
   */
  crearDesdeVenta: (ventaId) => apiClient.post(`/inventario/dropship/desde-venta/${ventaId}`),

  /**
   * Listar OC dropship
   * @param {Object} params - { estado?, proveedor_id?, fecha_desde?, fecha_hasta? }
   * @returns {Promise<Array>} Lista de OC dropship
   */
  listarOrdenes: (params = {}) => apiClient.get('/inventario/dropship/ordenes', { params }),

  /**
   * Obtener detalle de OC dropship
   * @param {number} id - ID de la OC
   * @returns {Promise<Object>} Detalle de la OC con items
   */
  obtenerOrden: (id) => apiClient.get(`/inventario/dropship/ordenes/${id}`),

  /**
   * Confirmar entrega de OC dropship
   * @param {number} id - ID de la OC
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>} Resultado
   */
  confirmarEntrega: (id, data = {}) => apiClient.patch(`/inventario/dropship/ordenes/${id}/confirmar-entrega`, data),

  /**
   * Cancelar OC dropship
   * @param {number} id - ID de la OC
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Resultado
   */
  cancelar: (id, data = {}) => apiClient.patch(`/inventario/dropship/ordenes/${id}/cancelar`, data),
};

// ==================== REORDEN AUTOMATICO (Dic 2025) ====================
