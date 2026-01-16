import apiClient from '../client';
/**
 * API de Ajustes Masivos
 */
export const ajustesMasivosApi = {
  /**
   * Listar ajustes masivos con filtros
   * @param {Object} params - { estado?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>} { ajustes, totales }
   */
  listar: (params) => apiClient.get('/inventario/ajustes-masivos', { params }),

  /**
   * Obtener ajuste masivo por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Ajuste con items
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/ajustes-masivos/${id}`),

  /**
   * Crear ajuste masivo desde items parseados del CSV
   * @param {Object} data - { archivo_nombre, items: [{ fila_numero, sku?, codigo_barras?, cantidad_ajuste, motivo? }] }
   * @returns {Promise<Object>} Ajuste creado (estado: pendiente)
   */
  crear: (data) => apiClient.post('/inventario/ajustes-masivos', data),

  /**
   * Validar items del ajuste masivo
   * Resuelve SKU/código de barras a producto_id, verifica existencia
   * Cambia estado: pendiente → validado
   * @param {number} id
   * @returns {Promise<Object>} Ajuste con items validados
   */
  validar: (id) => apiClient.post(`/inventario/ajustes-masivos/${id}/validar`),

  /**
   * Aplicar ajustes de inventario
   * Crea movimientos de inventario para cada item válido
   * Cambia estado: validado → aplicado | con_errores
   * @param {number} id
   * @returns {Promise<Object>} { aplicados: [], errores: [] }
   */
  aplicar: (id) => apiClient.post(`/inventario/ajustes-masivos/${id}/aplicar`),

  /**
   * Cancelar ajuste masivo
   * Solo si estado = pendiente
   * @param {number} id
   * @returns {Promise<Object>}
   */
  cancelar: (id) => apiClient.delete(`/inventario/ajustes-masivos/${id}`),

  /**
   * Descargar plantilla CSV
   * @returns {Promise<Blob>} Archivo CSV
   */
  descargarPlantilla: () => apiClient.get('/inventario/ajustes-masivos/plantilla', { responseType: 'blob' }),
};

// ==================== LANDED COSTS - Costos en Destino (Dic 2025) ====================
