import apiClient from '../client';

/**
 * API de Consigna
 */
export const consignaApi = {
  // --- ACUERDOS ---

  /** Crear acuerdo de consignación */
  crearAcuerdo: (data: Record<string, unknown>) => apiClient.post('/inventario/consigna/acuerdos', data),

  /** Listar acuerdos */
  listarAcuerdos: (params: Record<string, unknown> = {}) => apiClient.get('/inventario/consigna/acuerdos', { params }),

  /** Obtener acuerdo por ID */
  obtenerAcuerdo: (id: number) => apiClient.get(`/inventario/consigna/acuerdos/${id}`),

  /** Actualizar acuerdo */
  actualizarAcuerdo: (id: number, data: Record<string, unknown>) => apiClient.put(`/inventario/consigna/acuerdos/${id}`, data),

  /** Activar acuerdo */
  activarAcuerdo: (id: number) => apiClient.post(`/inventario/consigna/acuerdos/${id}/activar`),

  /** Pausar acuerdo */
  pausarAcuerdo: (id: number) => apiClient.post(`/inventario/consigna/acuerdos/${id}/pausar`),

  /** Terminar acuerdo */
  terminarAcuerdo: (id: number) => apiClient.post(`/inventario/consigna/acuerdos/${id}/terminar`),

  // --- PRODUCTOS DEL ACUERDO ---

  /** Agregar producto al acuerdo */
  agregarProducto: (acuerdoId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/productos`, data),

  /** Listar productos del acuerdo */
  listarProductos: (acuerdoId: number) =>
    apiClient.get(`/inventario/consigna/acuerdos/${acuerdoId}/productos`),

  /** Actualizar producto del acuerdo */
  actualizarProducto: (acuerdoId: number, productoId: number, data: Record<string, unknown>, varianteId: number | null = null) =>
    apiClient.put(
      `/inventario/consigna/acuerdos/${acuerdoId}/productos/${productoId}`,
      data,
      { params: varianteId ? { variante_id: varianteId } : {} }
    ),

  /** Remover producto del acuerdo */
  removerProducto: (acuerdoId: number, productoId: number, varianteId: number | null = null) =>
    apiClient.delete(
      `/inventario/consigna/acuerdos/${acuerdoId}/productos/${productoId}`,
      { params: varianteId ? { variante_id: varianteId } : {} }
    ),

  // --- STOCK CONSIGNA ---

  /** Recibir mercancía en consignación */
  recibirMercancia: (acuerdoId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/recibir`, data),

  /** Consultar stock en consignación */
  consultarStock: (params: Record<string, unknown> = {}) => apiClient.get('/inventario/consigna/stock', { params }),

  /** Ajustar stock consigna */
  ajustarStock: (stockId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/consigna/stock/${stockId}/ajuste`, data),

  /** Devolver mercancía al proveedor */
  devolverMercancia: (acuerdoId: number, data: Record<string, unknown>) =>
    apiClient.post(`/inventario/consigna/acuerdos/${acuerdoId}/devolver`, data),

  // --- LIQUIDACIONES ---

  /** Generar liquidación */
  generarLiquidacion: (data: Record<string, unknown>) => apiClient.post('/inventario/consigna/liquidaciones', data),

  /** Listar liquidaciones */
  listarLiquidaciones: (params: Record<string, unknown> = {}) =>
    apiClient.get('/inventario/consigna/liquidaciones', { params }),

  /** Obtener liquidación con detalle */
  obtenerLiquidacion: (id: number) => apiClient.get(`/inventario/consigna/liquidaciones/${id}`),

  /** Confirmar liquidación */
  confirmarLiquidacion: (id: number) => apiClient.post(`/inventario/consigna/liquidaciones/${id}/confirmar`),

  /** Pagar liquidación */
  pagarLiquidacion: (id: number, data: Record<string, unknown> = {}) =>
    apiClient.post(`/inventario/consigna/liquidaciones/${id}/pagar`, data),

  /** Cancelar liquidación */
  cancelarLiquidacion: (id: number) => apiClient.delete(`/inventario/consigna/liquidaciones/${id}`),

  // --- REPORTES ---

  /** Reporte de stock consigna */
  reporteStock: (params: Record<string, unknown> = {}) =>
    apiClient.get('/inventario/consigna/reportes/stock', { params }),

  /** Reporte de ventas consigna */
  reporteVentas: (params: Record<string, unknown>) =>
    apiClient.get('/inventario/consigna/reportes/ventas', { params }),

  /** Reporte pendiente de liquidar */
  reportePendiente: () => apiClient.get('/inventario/consigna/reportes/pendiente'),
};
