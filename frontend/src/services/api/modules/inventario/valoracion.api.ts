import { AxiosResponse } from 'axios';
import apiClient from '../../client';

/**
 * API de Valoración de Inventario
 * FIFO, AVCO, reportes de valoración
 */
export const valoracionApi = {
  // ========== Configuración de Valoración ==========

  /**
   * Obtener configuracion de valoracion de la organizacion
   * @returns {Promise<Object>} { metodo_valoracion, incluir_gastos_envio, redondeo_decimales }
   */
  obtenerConfiguracionValoracion: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/valoracion/configuracion'),

  /**
   * Actualizar configuracion de valoracion
   * @param {Object} data - { metodo_valoracion?, incluir_gastos_envio?, redondeo_decimales? }
   * @returns {Promise<Object>}
   */
  actualizarConfiguracionValoracion: (data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.put('/inventario/valoracion/configuracion', data),

  // ========== Resumen y Totales ==========

  /**
   * Obtener resumen comparativo de todos los metodos para dashboard
   * @returns {Promise<Object>} { metodo_configurado, promedio, fifo, avco, comparativa }
   */
  obtenerResumenValoracion: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/valoracion/resumen'),

  /**
   * Obtener valor total del inventario segun metodo
   * @param {Object} params - { metodo?: 'fifo'|'avco'|'promedio', categoria_id?, sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValorTotal: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/valoracion/total', { params }),

  // ========== Comparativas y Reportes ==========

  /**
   * Comparar valoracion de productos por los 3 metodos
   * @param {Object} params - { producto_id? } - Opcional, para un producto especifico
   * @returns {Promise<Array>}
   */
  obtenerComparativaValoracion: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/valoracion/comparativa', { params }),

  /**
   * Reporte de valoracion agrupado por categorias
   * @param {Object} params - { metodo? }
   * @returns {Promise<Array>}
   */
  obtenerReporteValoracionCategorias: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/valoracion/reporte/categorias', { params }),

  /**
   * Productos con mayor diferencia entre metodos
   * @param {Object} params - { limite?: number }
   * @returns {Promise<Array>}
   */
  obtenerReporteDiferenciasValoracion: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/valoracion/reporte/diferencias', { params }),

  // ========== Valoración por Producto ==========

  /**
   * Valoracion detallada de un producto con todos los metodos
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  obtenerValoracionProducto: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/valoracion/producto/${productoId}`),

  /**
   * Valoracion FIFO de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValoracionFIFO: (productoId: number, params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/valoracion/producto/${productoId}/fifo`, { params }),

  /**
   * Valoracion AVCO de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Object>}
   */
  obtenerValoracionAVCO: (productoId: number, params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/valoracion/producto/${productoId}/avco`, { params }),

  /**
   * Capas de inventario FIFO detalladas con trazabilidad
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerCapasFIFO: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/valoracion/producto/${productoId}/capas`),
};
