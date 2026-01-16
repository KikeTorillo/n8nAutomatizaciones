import apiClient from '../client';
/**
 * API de Monedas
 */
export const monedasApi = {
  /**
   * Listar monedas disponibles
   * @param {boolean} activas - Filtrar solo activas (default: true)
   * @returns {Promise<Object[]>} Lista de monedas
   */
  listar: (activas = true) => apiClient.get('/monedas', { params: { activas } }),

  /**
   * Obtener moneda por código
   * @param {string} codigo - Código ISO (MXN, USD, etc.)
   * @returns {Promise<Object>} Datos de la moneda
   */
  obtenerPorCodigo: (codigo) => apiClient.get(`/monedas/${codigo}`),

  /**
   * Obtener tasa de cambio actual
   * @param {string} origen - Moneda origen
   * @param {string} destino - Moneda destino
   * @param {string} fecha - Fecha opcional (YYYY-MM-DD)
   * @returns {Promise<Object>} Tasa de cambio
   */
  obtenerTasa: (origen, destino, fecha) =>
    apiClient.get('/monedas/tasas/actual', { params: { origen, destino, fecha } }),

  /**
   * Obtener historial de tasas
   * @param {string} origen - Moneda origen
   * @param {string} destino - Moneda destino
   * @param {number} dias - Días de historial (default: 30)
   * @returns {Promise<Object[]>} Historial de tasas
   */
  obtenerHistorialTasas: (origen, destino, dias = 30) =>
    apiClient.get('/monedas/tasas/historial', { params: { origen, destino, dias } }),

  /**
   * Guardar nueva tasa de cambio (admin)
   * @param {Object} data - { moneda_origen, moneda_destino, tasa, fuente }
   * @returns {Promise<Object>} Tasa guardada
   */
  guardarTasa: (data) => apiClient.post('/monedas/tasas', data),

  /**
   * Convertir monto entre monedas
   * @param {Object} data - { monto, origen, destino, fecha? }
   * @returns {Promise<Object>} Resultado de conversión
   */
  convertir: (data) => apiClient.post('/monedas/convertir', data),

  /**
   * Convertir múltiples montos
   * @param {Object} data - { items: [{ monto, moneda }], destino }
   * @returns {Promise<Object[]>} Conversiones
   */
  convertirMultiple: (data) => apiClient.post('/monedas/convertir/multiple', data),
};

// ==================== LISTAS DE PRECIOS (Fase 5) ====================
