import { AxiosResponse } from 'axios';
import apiClient from '../../client';

/**
 * API de Variantes de Inventario
 * Atributos, valores y variantes de productos
 */
export const variantesApi = {
  // ========== Atributos de Producto (Variantes) ==========

  /**
   * Listar atributos de producto
   * @param {Object} params - { incluir_inactivos? }
   * @returns {Promise<Object>}
   */
  listarAtributos: (params: Record<string, unknown> = {}): Promise<AxiosResponse> =>
    apiClient.get('/inventario/atributos', { params }),

  /**
   * Obtener atributo por ID con valores
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerAtributo: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/atributos/${id}`),

  /**
   * Crear atributo
   * @param {Object} data - { nombre, codigo, tipo_visualizacion?, orden? }
   * @returns {Promise<Object>}
   */
  crearAtributo: (data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post('/inventario/atributos', data),

  /**
   * Actualizar atributo
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarAtributo: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.put(`/inventario/atributos/${id}`, data),

  /**
   * Eliminar atributo
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarAtributo: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/atributos/${id}`),

  /**
   * Crear atributos por defecto (Color, Talla)
   * @returns {Promise<Object>}
   */
  crearAtributosDefecto: (): Promise<AxiosResponse> =>
    apiClient.post('/inventario/atributos/defecto'),

  /**
   * Agregar valor a atributo
   * @param {number} atributoId
   * @param {Object} data - { valor, codigo, color_hex?, orden? }
   * @returns {Promise<Object>}
   */
  agregarValorAtributo: (atributoId: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/atributos/${atributoId}/valores`, data),

  /**
   * Actualizar valor de atributo
   * @param {number} valorId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarValor: (valorId: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.put(`/inventario/valores/${valorId}`, data),

  /**
   * Eliminar valor de atributo
   * @param {number} valorId
   * @returns {Promise<Object>}
   */
  eliminarValor: (valorId: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/valores/${valorId}`),

  // ========== Variantes de Producto ==========

  /**
   * Listar variantes de un producto
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  listarVariantes: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/productos/${productoId}/variantes`),

  /**
   * Obtener variante por ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  obtenerVariante: (id: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/variantes/${id}`),

  /**
   * Buscar variante por SKU o codigo de barras
   * @param {string} termino
   * @returns {Promise<Object>}
   */
  buscarVariante: (termino: string): Promise<AxiosResponse> =>
    apiClient.get('/inventario/variantes/buscar', { params: { termino } }),

  /**
   * Obtener resumen de stock por variantes
   * @param {number} productoId
   * @returns {Promise<Object>}
   */
  obtenerResumenVariantes: (productoId: number): Promise<AxiosResponse> =>
    apiClient.get(`/inventario/productos/${productoId}/variantes/resumen`),

  /**
   * Crear variante individual
   * @param {number} productoId
   * @param {Object} data - { nombre_variante, sku?, codigo_barras?, precio_compra?, precio_venta?, stock_actual?, atributos? }
   * @returns {Promise<Object>}
   */
  crearVariante: (productoId: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/productos/${productoId}/variantes`, data),

  /**
   * Generar variantes automaticamente
   * @param {number} productoId
   * @param {Object} data - { atributos: [{ atributo_id, valores: [] }], opciones?: { sku_base?, precio_venta?, precio_compra? } }
   * @returns {Promise<Object>}
   */
  generarVariantes: (productoId: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.post(`/inventario/productos/${productoId}/variantes/generar`, data),

  /**
   * Actualizar variante
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  actualizarVariante: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.put(`/inventario/variantes/${id}`, data),

  /**
   * Ajustar stock de variante
   * @param {number} id
   * @param {Object} data - { cantidad, tipo, motivo? }
   * @returns {Promise<Object>}
   */
  ajustarStockVariante: (id: number, data: Record<string, unknown>): Promise<AxiosResponse> =>
    apiClient.patch(`/inventario/variantes/${id}/stock`, data),

  /**
   * Eliminar variante
   * @param {number} id
   * @returns {Promise<Object>}
   */
  eliminarVariante: (id: number): Promise<AxiosResponse> =>
    apiClient.delete(`/inventario/variantes/${id}`),
};
