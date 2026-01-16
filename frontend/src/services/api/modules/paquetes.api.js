import apiClient from '../client';
/**
 * API de Paquetes
 */
export const paquetesApi = {
  // ==================== PAQUETES POR OPERACION ====================

  /**
   * Crear paquete para operacion de empaque
   * @param {number} operacionId
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>} Paquete creado
   */
  crear: (operacionId, data = {}) => apiClient.post(`/inventario/operaciones/${operacionId}/paquetes`, data),

  /**
   * Listar paquetes de una operacion
   * @param {number} operacionId
   * @returns {Promise<Array>} Lista de paquetes
   */
  listarPorOperacion: (operacionId) => apiClient.get(`/inventario/operaciones/${operacionId}/paquetes`),

  /**
   * Obtener items disponibles para empacar
   * @param {number} operacionId
   * @returns {Promise<Array>} Items pendientes de empacar
   */
  obtenerItemsDisponibles: (operacionId) => apiClient.get(`/inventario/operaciones/${operacionId}/items-disponibles`),

  /**
   * Obtener resumen de empaque de la operacion
   * @param {number} operacionId
   * @returns {Promise<Object>} Resumen con totales y paquetes
   */
  obtenerResumen: (operacionId) => apiClient.get(`/inventario/operaciones/${operacionId}/resumen-empaque`),

  // ==================== PAQUETE INDIVIDUAL ====================

  /**
   * Obtener paquete por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Paquete con items
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/paquetes/${id}`),

  /**
   * Actualizar dimensiones/peso del paquete
   * @param {number} id
   * @param {Object} data - { peso_kg?, largo_cm?, ancho_cm?, alto_cm?, notas?, carrier?, tracking_carrier? }
   * @returns {Promise<Object>} Paquete actualizado
   */
  actualizar: (id, data) => apiClient.put(`/inventario/paquetes/${id}`, data),

  // ==================== ITEMS DE PAQUETE ====================

  /**
   * Agregar item al paquete
   * @param {number} paqueteId
   * @param {Object} data - { operacion_item_id, cantidad, numero_serie_id? }
   * @returns {Promise<Object>} Resultado
   */
  agregarItem: (paqueteId, data) => apiClient.post(`/inventario/paquetes/${paqueteId}/items`, data),

  /**
   * Remover item del paquete
   * @param {number} paqueteId
   * @param {number} itemId
   * @returns {Promise<Object>} Resultado
   */
  removerItem: (paqueteId, itemId) => apiClient.delete(`/inventario/paquetes/${paqueteId}/items/${itemId}`),

  // ==================== ACCIONES DE PAQUETE ====================

  /**
   * Cerrar paquete (no mas modificaciones)
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  cerrar: (id) => apiClient.post(`/inventario/paquetes/${id}/cerrar`),

  /**
   * Cancelar paquete
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Resultado
   */
  cancelar: (id, data = {}) => apiClient.post(`/inventario/paquetes/${id}/cancelar`, data),

  /**
   * Marcar paquete como etiquetado
   * @param {number} id
   * @param {Object} data - { tracking_carrier?, carrier? }
   * @returns {Promise<Object>} Paquete actualizado
   */
  etiquetar: (id, data = {}) => apiClient.post(`/inventario/paquetes/${id}/etiquetar`, data),

  /**
   * Marcar paquete como enviado
   * @param {number} id
   * @returns {Promise<Object>} Paquete actualizado
   */
  enviar: (id) => apiClient.post(`/inventario/paquetes/${id}/enviar`),

  /**
   * Generar datos de etiqueta del paquete
   * @param {number} id
   * @returns {Promise<Object>} Datos para impresion de etiqueta
   */
  generarEtiqueta: (id) => apiClient.get(`/inventario/paquetes/${id}/etiqueta`),
};

// ================================================================================
// CONSIGNA - Inventario en Consignacion (Dic 2025)
// ================================================================================

/**
 * API para gestion de inventario en consignacion
 * Stock de proveedores en tu almacen, pago solo al vender
 */
