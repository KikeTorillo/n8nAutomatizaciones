import apiClient from '../client';
/**
 * API de Consigna
 */
export const consignaApi = {
  // --- ACUERDOS ---

  /**
   * Crear acuerdo de consignacion
   * @param {Object} data - { proveedor_id, porcentaje_comision, dias_liquidacion, ... }
   * @returns {Promise<Object>} Acuerdo creado
   */
  crearAcuerdo: (data) => apiClient.post('/inventario/consigna/acuerdos', data),

  /**
   * Listar acuerdos
   * @param {Object} params - { proveedor_id?, estado?, busqueda?, limit?, offset? }
   * @returns {Promise<Object>} { data, total, limit, offset }
   */
  listarAcuerdos: (params = {}) => apiClient.get('/inventario/consigna/acuerdos', { params }),

  /**
   * Obtener acuerdo por ID
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo con detalles
   */
  obtenerAcuerdo: (id) => apiClient.get(`/inventario/consigna/acuerdos/${id}`),

  /**
   * Actualizar acuerdo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>} Acuerdo actualizado
   */
  actualizarAcuerdo: (id, data) => apiClient.put(`/inventario/consigna/acuerdos/${id}`, data),

  /**
   * Activar acuerdo
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo activado
   */
  activarAcuerdo: (id) => apiClient.post(`/inventario/consigna/acuerdos/${id}/activar`),

  /**
   * Pausar acuerdo
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo pausado
   */
  pausarAcuerdo: (id) => apiClient.post(`/inventario/consigna/acuerdos/${id}/pausar`),

  /**
   * Terminar acuerdo
   * @param {number} id
   * @returns {Promise<Object>} Acuerdo terminado
   */
  terminarAcuerdo: (id) => apiClient.post(`/inventario/consigna/acuerdos/${id}/terminar`),

  // --- PRODUCTOS DEL ACUERDO ---

  /**
   * Agregar producto al acuerdo
   * @param {number} acuerdoId
   * @param {Object} data - { producto_id, precio_consigna, ... }
   * @returns {Promise<Object>} Producto agregado
   */
  agregarProducto: (acuerdoId, data) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/productos`, data),

  /**
   * Listar productos del acuerdo
   * @param {number} acuerdoId
   * @returns {Promise<Array>} Productos del acuerdo
   */
  listarProductos: (acuerdoId) =>
    apiClient.get(`/inventario/consigna/acuerdos/${acuerdoId}/productos`),

  /**
   * Actualizar producto del acuerdo
   * @param {number} acuerdoId
   * @param {number} productoId
   * @param {Object} data
   * @param {number} varianteId - Opcional
   * @returns {Promise<Object>} Producto actualizado
   */
  actualizarProducto: (acuerdoId, productoId, data, varianteId = null) =>
    apiClient.put(
      `/inventario/consigna/acuerdos/${acuerdoId}/productos/${productoId}`,
      data,
      { params: varianteId ? { variante_id: varianteId } : {} }
    ),

  /**
   * Remover producto del acuerdo
   * @param {number} acuerdoId
   * @param {number} productoId
   * @param {number} varianteId - Opcional
   * @returns {Promise<Object>} Resultado
   */
  removerProducto: (acuerdoId, productoId, varianteId = null) =>
    apiClient.delete(
      `/inventario/consigna/acuerdos/${acuerdoId}/productos/${productoId}`,
      { params: varianteId ? { variante_id: varianteId } : {} }
    ),

  // --- STOCK CONSIGNA ---

  /**
   * Recibir mercancia en consignacion
   * @param {number} acuerdoId
   * @param {Object} data - { items: [{ producto_id, cantidad, ... }] }
   * @returns {Promise<Object>} Movimientos creados
   */
  recibirMercancia: (acuerdoId, data) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/recibir`, data),

  /**
   * Consultar stock en consignacion
   * @param {Object} params - { acuerdo_id?, proveedor_id?, producto_id?, almacen_id?, solo_disponible? }
   * @returns {Promise<Array>} Stock consigna
   */
  consultarStock: (params = {}) => apiClient.get('/inventario/consigna/stock', { params }),

  /**
   * Ajustar stock consigna
   * @param {number} stockId
   * @param {Object} data - { cantidad, motivo }
   * @returns {Promise<Object>} Resultado del ajuste
   */
  ajustarStock: (stockId, data) =>
    apiClient.post(`/inventario/consigna/stock/${stockId}/ajuste`, data),

  /**
   * Devolver mercancia al proveedor
   * @param {number} acuerdoId
   * @param {Object} data - { items: [{ producto_id, cantidad, ... }] }
   * @returns {Promise<Object>} Movimientos de devolucion
   */
  devolverMercancia: (acuerdoId, data) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/devolver`, data),

  // --- LIQUIDACIONES ---

  /**
   * Generar liquidacion
   * @param {Object} data - { acuerdo_id, fecha_desde, fecha_hasta }
   * @returns {Promise<Object>} Liquidacion generada
   */
  generarLiquidacion: (data) => apiClient.post('/inventario/consigna/liquidaciones', data),

  /**
   * Listar liquidaciones
   * @param {Object} params - { acuerdo_id?, proveedor_id?, estado?, limit?, offset? }
   * @returns {Promise<Array>} Liquidaciones
   */
  listarLiquidaciones: (params = {}) =>
    apiClient.get('/inventario/consigna/liquidaciones', { params }),

  /**
   * Obtener liquidacion con detalle
   * @param {number} id
   * @returns {Promise<Object>} Liquidacion con items
   */
  obtenerLiquidacion: (id) => apiClient.get(`/inventario/consigna/liquidaciones/${id}`),

  /**
   * Confirmar liquidacion
   * @param {number} id
   * @returns {Promise<Object>} Liquidacion confirmada
   */
  confirmarLiquidacion: (id) => apiClient.post(`/inventario/consigna/liquidaciones/${id}/confirmar`),

  /**
   * Pagar liquidacion
   * @param {number} id
   * @param {Object} data - { fecha_pago?, metodo_pago?, referencia_pago? }
   * @returns {Promise<Object>} Liquidacion pagada
   */
  pagarLiquidacion: (id, data = {}) =>
    apiClient.post(`/inventario/consigna/liquidaciones/${id}/pagar`, data),

  /**
   * Cancelar liquidacion
   * @param {number} id
   * @returns {Promise<Object>} Resultado
   */
  cancelarLiquidacion: (id) => apiClient.delete(`/inventario/consigna/liquidaciones/${id}`),

  // --- REPORTES ---

  /**
   * Reporte de stock consigna
   * @param {Object} params - { proveedor_id? }
   * @returns {Promise<Array>} Resumen de stock
   */
  reporteStock: (params = {}) =>
    apiClient.get('/inventario/consigna/reportes/stock', { params }),

  /**
   * Reporte de ventas consigna
   * @param {Object} params - { fecha_desde, fecha_hasta }
   * @returns {Promise<Array>} Ventas por producto
   */
  reporteVentas: (params) =>
    apiClient.get('/inventario/consigna/reportes/ventas', { params }),

  /**
   * Reporte pendiente de liquidar
   * @returns {Promise<Array>} Pendiente por acuerdo
   */
  reportePendiente: () => apiClient.get('/inventario/consigna/reportes/pendiente'),
};

// ==================== VACACIONES (Fase 3 - Enero 2026) ====================

