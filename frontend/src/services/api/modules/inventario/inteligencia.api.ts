import { AxiosResponse } from 'axios';
import apiClient from '../../client';

/**
 * API de Inteligencia de Inventario
 * Reportes, alertas, analytics y snapshots
 */
export const inteligenciaApi = {
  // ========== Alertas de Inventario ==========

  /**
   * Listar alertas con filtros
   * @param {Object} params - { tipo_alerta?, nivel?, leida?, producto_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
   * @returns {Promise<Object>} { alertas, total }
   */
  listarAlertas: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/alertas', { params }),

  /**
   * Obtener dashboard de alertas
   * @returns {Promise<Object>} { resumen, alertas_recientes }
   */
  obtenerDashboardAlertas: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/alertas/dashboard'),

  /**
   * Obtener alerta por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerAlerta: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/alertas/${id}`),

  /**
   * Marcar alerta como leída
   * @param {number} id
   * @returns {Promise<Object>}
   */
  marcarAlertaLeida: (id: number): Promise<AxiosResponse> =>
    apiClient.patch(`/inventario/alertas/${id}/marcar-leida`),

  /**
   * Marcar múltiples alertas como leídas
   * @param {Object} data - { alerta_ids: [...] }
   * @returns {Promise<Object>}
   */
  marcarVariasAlertasLeidas: (data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.patch('/inventario/alertas/marcar-varias-leidas', data),

  // ========== Reportes de Inventario ==========

  /**
   * Obtener valor total del inventario
   * @returns {Promise<Object>} { total_productos, total_unidades, valor_compra, valor_venta, margen_potencial }
   */
  obtenerValorInventario: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/reportes/valor-inventario'),

  /**
   * Obtener análisis ABC de productos (clasificación Pareto)
   * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id? }
   * @returns {Promise<Object>} { productos_abc }
   */
  obtenerAnalisisABC: (params: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.get('/inventario/reportes/analisis-abc', { params }),

  /**
   * Obtener reporte de rotación de inventario
   * @param {Object} params - { fecha_desde, fecha_hasta, categoria_id?, top? }
   * @returns {Promise<Object>} { productos_rotacion }
   */
  obtenerRotacionInventario: (params: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.get('/inventario/reportes/rotacion', { params }),

  /**
   * Obtener resumen de alertas agrupadas
   * @returns {Promise<Object>} { resumen_alertas }
   */
  obtenerResumenAlertas: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/reportes/alertas'),

  // ========== Inventory at Date - Snapshots ==========

  /**
   * Listar snapshots disponibles
   * @param {Object} params - { limit?, offset? }
   * @returns {Promise<Object>} { snapshots[] }
   */
  listarSnapshots: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/snapshots', { params }),

  /**
   * Obtener fechas disponibles para selector
   * @returns {Promise<Object>} { fechas[] }
   */
  obtenerFechasDisponibles: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/snapshots/fechas'),

  /**
   * Generar snapshot manualmente
   * @param {Object} data - { fecha?, descripcion? }
   * @returns {Promise<Object>}
   */
  generarSnapshot: (data: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.post('/inventario/snapshots', data),

  /**
   * Obtener historico de stock de un producto para grafico de pronostico
   * @param {number} productoId - ID del producto
   * @param {Object} params - { dias? } (default: 30)
   * @returns {Promise<Object>} { snapshots[], producto, oc_pendientes[], proyeccion[], metricas }
   */
  obtenerHistoricoProducto: (productoId: number, params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/snapshots/historico/${productoId}`, { params }),

  /**
   * Consultar stock en fecha especifica
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {Object} params - { producto_id?, categoria_id?, solo_con_stock?, limit?, offset? }
   * @returns {Promise<Object>} { fecha, productos[], totales }
   */
  obtenerStockEnFecha: (fecha: string, params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/at-date', { params: { fecha, ...params } }),

  /**
   * Comparar inventario entre dos fechas
   * @param {string} fechaDesde - Fecha inicial YYYY-MM-DD
   * @param {string} fechaHasta - Fecha final YYYY-MM-DD
   * @param {boolean} soloCambios - Solo productos con cambios (default: true)
   * @returns {Promise<Object>} { fecha_desde, fecha_hasta, productos[], resumen }
   */
  compararInventario: (fechaDesde: string, fechaHasta: string, soloCambios: boolean = true): Promise<AxiosResponse> =>
    apiClient.get('/inventario/comparar', { params: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta, solo_cambios: soloCambios } }),
};
