import apiClient from '../../client';

/**
 * API de Reservas de Inventario
 * Gestión de reservas de stock
 */
export const reservasApi = {
  // ========== Reservas de Stock ==========

  /**
   * Crear reserva de stock
   * @param {Object} data - { producto_id, cantidad, tipo_origen, origen_id?, sucursal_id?, minutos_expiracion? }
   * @returns {Promise<Object>} Reserva creada
   */
  crearReserva: (data) => apiClient.post('/inventario/reservas', data),

  /**
   * Crear múltiples reservas
   * @param {Object} data - { items: [{ producto_id, cantidad }], tipo_origen, origen_id?, sucursal_id? }
   * @returns {Promise<Object>} { reservas: [...] }
   */
  crearReservasMultiple: (data) => apiClient.post('/inventario/reservas/multiple', data),

  /**
   * Listar reservas con filtros
   * @param {Object} params - { estado?, producto_id?, sucursal_id?, tipo_origen?, origen_id?, limit?, offset? }
   * @returns {Promise<Object>} { reservas: [...] }
   */
  listarReservas: (params = {}) => apiClient.get('/inventario/reservas', { params }),

  /**
   * Obtener reserva por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerReserva: (id) => apiClient.get(`/inventario/reservas/${id}`),

  /**
   * Confirmar reserva (descuenta stock real)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  confirmarReserva: (id) => apiClient.patch(`/inventario/reservas/${id}/confirmar`),

  /**
   * Confirmar múltiples reservas
   * @param {Object} data - { reserva_ids: [...] }
   * @returns {Promise<Object>} { confirmadas: [...], total }
   */
  confirmarReservasMultiple: (data) => apiClient.post('/inventario/reservas/confirmar-multiple', data),

  /**
   * Extender tiempo de expiración de una reserva
   * @param {number} id
   * @param {Object} data - { minutos_adicionales? }
   * @returns {Promise<Object>}
   */
  extenderReserva: (id, data = {}) => apiClient.patch(`/inventario/reservas/${id}/extender`, data),

  /**
   * Cancelar reserva individual
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelarReserva: (id) => apiClient.delete(`/inventario/reservas/${id}`),

  /**
   * Cancelar reservas por origen
   * @param {string} tipoOrigen - 'venta_pos' | 'orden_venta' | 'cita_servicio' | 'transferencia'
   * @param {number} origenId
   * @returns {Promise<Object>} { canceladas: [...], total }
   */
  cancelarReservasPorOrigen: (tipoOrigen, origenId) =>
    apiClient.delete(`/inventario/reservas/origen/${tipoOrigen}/${origenId}`),
};
