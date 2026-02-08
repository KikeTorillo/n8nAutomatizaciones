import { AxiosResponse } from 'axios';
import apiClient from '../../client';

/**
 * API de Trazabilidad de Inventario
 * Números de serie, lotes y garantías
 */
export const trazabilidadApi = {
  // ========== Números de Serie / Lotes ==========

  /**
   * Listar numeros de serie con filtros
   * @param {Object} params - { producto_id?, sucursal_id?, ubicacion_id?, estado?, lote?, fecha_vencimiento_desde?, fecha_vencimiento_hasta?, busqueda?, page?, limit? }
   * @returns {Promise<Object>}
   */
  listarNumerosSerie: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/numeros-serie', { params }),

  /**
   * Buscar numeros de serie
   * @param {string} termino
   * @returns {Promise<Array>}
   */
  buscarNumeroSerie: (termino: string): Promise<AxiosResponse> =>
    apiClient.get('/inventario/numeros-serie/buscar', { params: { q: termino } }),

  /**
   * Obtener numero de serie por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerNumeroSerie: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/numeros-serie/${id}`),

  /**
   * Obtener historial de movimientos de un numero de serie
   * @param {number} id
   * @returns {Promise<Array>}
   */
  obtenerHistorialNumeroSerie: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/numeros-serie/${id}/historial`),

  /**
   * Crear numero de serie individual
   * @param {Object} data - { producto_id, numero_serie, lote?, fecha_vencimiento?, sucursal_id?, ubicacion_id?, costo_unitario?, proveedor_id?, orden_compra_id?, notas? }
   * @returns {Promise<Object>}
   */
  crearNumeroSerie: (data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post('/inventario/numeros-serie', data),

  /**
   * Crear multiples numeros de serie (recepcion masiva)
   * @param {Object} data - { items: [...] }
   * @returns {Promise<Object>}
   */
  crearNumerosSerieMultiple: (data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post('/inventario/numeros-serie/bulk', data),

  /**
   * Obtener numeros de serie disponibles de un producto
   * @param {number} productoId
   * @param {Object} params - { sucursal_id? }
   * @returns {Promise<Array>}
   */
  obtenerNumerosSerieDisponibles: (productoId: number, params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/numeros-serie/producto/${productoId}/disponibles`, { params }),

  /**
   * Obtener resumen de numeros de serie por producto
   * @param {number} productoId
   * @returns {Promise<Array>}
   */
  obtenerResumenNumeroSerieProducto: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/numeros-serie/producto/${productoId}/resumen`),

  /**
   * Obtener productos que requieren numero de serie
   * @returns {Promise<Array>}
   */
  obtenerProductosConSerie: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/numeros-serie/productos-con-serie'),

  /**
   * Obtener estadisticas generales de numeros de serie
   * @returns {Promise<Object>}
   */
  obtenerEstadisticasNumerosSerie: (): Promise<AxiosResponse> =>
    apiClient.get('/inventario/numeros-serie/estadisticas'),

  /**
   * Obtener numeros de serie proximos a vencer
   * @param {number} dias
   * @returns {Promise<Array>}
   */
  obtenerProximosVencer: (dias: number = 30): Promise<AxiosResponse> =>
    apiClient.get('/inventario/numeros-serie/proximos-vencer', { params: { dias } }),

  /**
   * Verificar si existe un numero de serie
   * @param {number} productoId
   * @param {string} numeroSerie
   * @returns {Promise<Object>}
   */
  verificarExistenciaNumeroSerie: (productoId: number, numeroSerie: string): Promise<AxiosResponse> =>
    apiClient.get('/inventario/numeros-serie/existe', { params: { producto_id: productoId, numero_serie: numeroSerie } }),

  // ========== Operaciones con Números de Serie ==========

  /**
   * Vender numero de serie
   * @param {number} id
   * @param {Object} data - { venta_id, cliente_id? }
   * @returns {Promise<Object>}
   */
  venderNumeroSerie: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/numeros-serie/${id}/vender`, data),

  /**
   * Transferir numero de serie
   * @param {number} id
   * @param {Object} data - { sucursal_destino_id, ubicacion_destino_id?, notas? }
   * @returns {Promise<Object>}
   */
  transferirNumeroSerie: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/numeros-serie/${id}/transferir`, data),

  /**
   * Devolver numero de serie
   * @param {number} id
   * @param {Object} data - { sucursal_id, ubicacion_id?, motivo }
   * @returns {Promise<Object>}
   */
  devolverNumeroSerie: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/numeros-serie/${id}/devolver`, data),

  /**
   * Marcar numero de serie como defectuoso
   * @param {number} id
   * @param {Object} data - { motivo }
   * @returns {Promise<Object>}
   */
  marcarNumeroSerieDefectuoso: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/numeros-serie/${id}/defectuoso`, data),

  /**
   * Reservar numero de serie
   * @param {number} id
   * @param {Object} data - { notas? }
   * @returns {Promise<Object>}
   */
  reservarNumeroSerie: (id: number, data: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/numeros-serie/${id}/reservar`, data),

  /**
   * Liberar reserva de numero de serie
   * @param {number} id
   * @returns {Promise<Object>}
   */
  liberarReservaNumeroSerie: (id: number): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/numeros-serie/${id}/liberar`),

  // ========== Garantías ==========

  /**
   * Actualizar garantia de numero de serie
   * @param {number} id
   * @param {Object} data - { tiene_garantia, fecha_inicio_garantia?, fecha_fin_garantia? }
   * @returns {Promise<Object>}
   */
  actualizarGarantiaNumeroSerie: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.put(`/inventario/numeros-serie/${id}/garantia`, data),
};
