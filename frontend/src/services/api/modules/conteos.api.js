import apiClient from '../client';
/**
 * API de Conteos de Inventario
 */
export const conteosApi = {
  /**
   * Listar conteos con filtros
   * @param {Object} params - { sucursal_id?, estado?, tipo_conteo?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
   * @returns {Promise<Object>} { conteos, totales }
   */
  listar: (params) => apiClient.get('/inventario/conteos', { params }),

  /**
   * Obtener conteo por ID con items
   * @param {number} id
   * @returns {Promise<Object>} Conteo con items y resumen
   */
  obtenerPorId: (id) => apiClient.get(`/inventario/conteos/${id}`),

  /**
   * Crear nuevo conteo de inventario
   * @param {Object} data - { tipo_conteo, sucursal_id?, filtros?, fecha_programada?, usuario_contador_id?, usuario_supervisor_id?, notas? }
   * @returns {Promise<Object>} Conteo creado (estado: borrador)
   */
  crear: (data) => apiClient.post('/inventario/conteos', data),

  /**
   * Iniciar conteo (genera items según filtros)
   * Cambia estado: borrador → en_proceso
   * @param {number} id
   * @returns {Promise<Object>} Conteo con items generados
   */
  iniciar: (id) => apiClient.post(`/inventario/conteos/${id}/iniciar`),

  /**
   * Registrar cantidad contada para un item
   * @param {number} itemId - ID del item del conteo
   * @param {Object} data - { cantidad_contada, notas? }
   * @returns {Promise<Object>} Item actualizado
   */
  registrarConteo: (itemId, data) => apiClient.put(`/inventario/conteos/items/${itemId}`, data),

  /**
   * Completar conteo (todos los items deben estar contados)
   * Cambia estado: en_proceso → completado
   * @param {number} id
   * @returns {Promise<Object>} Conteo completado
   */
  completar: (id) => apiClient.post(`/inventario/conteos/${id}/completar`),

  /**
   * Aplicar ajustes de inventario basados en el conteo
   * Cambia estado: completado → ajustado
   * Crea movimientos de inventario para cada diferencia
   * @param {number} id
   * @returns {Promise<Object>} { conteo, ajustes_realizados }
   */
  aplicarAjustes: (id) => apiClient.post(`/inventario/conteos/${id}/aplicar-ajustes`),

  /**
   * Cancelar conteo
   * Cambia estado: (cualquiera excepto ajustado) → cancelado
   * @param {number} id
   * @param {Object} data - { motivo? }
   * @returns {Promise<Object>} Conteo cancelado
   */
  cancelar: (id, data) => apiClient.post(`/inventario/conteos/${id}/cancelar`, data),

  /**
   * Buscar item por código de barras o SKU
   * @param {number} conteoId
   * @param {string} codigo - Código de barras o SKU
   * @returns {Promise<Object>} Item encontrado
   */
  buscarItem: (conteoId, codigo) => apiClient.get(`/inventario/conteos/${conteoId}/buscar-item`, { params: { codigo } }),

  /**
   * Obtener estadísticas de conteos por período
   * @param {Object} params - { fecha_desde?, fecha_hasta? }
   * @returns {Promise<Object>} Estadísticas
   */
  obtenerEstadisticas: (params) => apiClient.get('/inventario/conteos/estadisticas', { params }),
};

// ==================== AJUSTES MASIVOS DE INVENTARIO (Dic 2025) ====================
