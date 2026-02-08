import apiClient from '../client';
import { ubicacionesAlmacenApi } from './ubicaciones-almacen.api';
import type { OrdenCompra } from '@/types/entities';

// ========== Tipos de parámetros ==========

interface OrdenCompraCreateData {
  proveedor_id: number;
  fecha_entrega_esperada?: string;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  impuestos?: number;
  dias_credito?: number;
  notas?: string;
  referencia_proveedor?: string;
  items?: OrdenCompraItemInput[];
}

interface OrdenCompraItemInput {
  producto_id: number;
  cantidad_ordenada: number;
  precio_unitario?: number;
  fecha_vencimiento?: string;
  notas?: string;
}

interface OrdenCompraListParams {
  proveedor_id?: number;
  estado?: string;
  estado_pago?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  folio?: string;
  limit?: number;
  offset?: number;
}

interface RecepcionItem {
  item_id: number;
  cantidad: number;
  precio_unitario_real?: number;
  fecha_vencimiento?: string;
  lote?: string;
  notas?: string;
}

// ========== API ==========

export const ordenesCompraApi = {
  // ========== CRUD Basico ==========

  crear: (data: OrdenCompraCreateData) =>
    apiClient.post<OrdenCompra>('/inventario/ordenes-compra', data),

  listar: (params?: OrdenCompraListParams) =>
    apiClient.get<{ ordenes: OrdenCompra[]; total: number }>('/inventario/ordenes-compra', { params }),

  obtenerPorId: (id: number) =>
    apiClient.get<OrdenCompra>(`/inventario/ordenes-compra/${id}`),

  actualizar: (id: number, data: Partial<OrdenCompraCreateData>) =>
    apiClient.put<OrdenCompra>(`/inventario/ordenes-compra/${id}`, data),

  eliminar: (id: number) =>
    apiClient.delete(`/inventario/ordenes-compra/${id}`),

  // ========== Gestion de Items ==========

  agregarItems: (ordenId: number, data: { items: OrdenCompraItemInput[] }) =>
    apiClient.post(`/inventario/ordenes-compra/${ordenId}/items`, data),

  actualizarItem: (ordenId: number, itemId: number, data: Partial<OrdenCompraItemInput>) =>
    apiClient.put(`/inventario/ordenes-compra/${ordenId}/items/${itemId}`, data),

  eliminarItem: (ordenId: number, itemId: number) =>
    apiClient.delete(`/inventario/ordenes-compra/${ordenId}/items/${itemId}`),

  // ========== Cambios de Estado ==========

  enviar: (id: number) =>
    apiClient.patch(`/inventario/ordenes-compra/${id}/enviar`),

  cancelar: (id: number, data?: { motivo?: string }) =>
    apiClient.patch(`/inventario/ordenes-compra/${id}/cancelar`, data),

  // ========== Recepcion de Mercancia ==========

  recibirMercancia: (ordenId: number, data: { recepciones: RecepcionItem[] }) =>
    apiClient.post(`/inventario/ordenes-compra/${ordenId}/recibir`, data),

  // ========== Pagos ==========

  registrarPago: (id: number, data: { monto: number }) =>
    apiClient.post(`/inventario/ordenes-compra/${id}/pago`, data),

  // ========== Reportes ==========

  obtenerPendientes: () =>
    apiClient.get<{ ordenes: OrdenCompra[] }>('/inventario/ordenes-compra/pendientes'),

  obtenerPendientesPago: () =>
    apiClient.get<{ ordenes: OrdenCompra[] }>('/inventario/ordenes-compra/pendientes-pago'),

  estadisticasPorProveedor: (params?: { fecha_desde?: string; fecha_hasta?: string }) =>
    apiClient.get('/inventario/ordenes-compra/reportes/por-proveedor', { params }),

  // ========== Auto-generacion de OC ==========

  obtenerSugerenciasOC: () =>
    apiClient.get('/inventario/ordenes-compra/sugerencias'),

  generarOCDesdeProducto: (productoId: number) =>
    apiClient.post<OrdenCompra>(`/inventario/ordenes-compra/generar-desde-producto/${productoId}`),

  autoGenerarOCs: () =>
    apiClient.post<{ ordenes_creadas: OrdenCompra[]; errores: Array<{ producto_id: number; error: string }> }>(
      '/inventario/ordenes-compra/auto-generar',
    ),

  // ========== Ubicaciones de Almacen WMS (delegado a ubicacionesAlmacenApi) ==========
  crearUbicacion: ubicacionesAlmacenApi.crear,
  obtenerUbicacion: ubicacionesAlmacenApi.obtener,
  listarUbicaciones: ubicacionesAlmacenApi.listar,
  obtenerArbolUbicaciones: ubicacionesAlmacenApi.obtenerArbol,
  actualizarUbicacion: ubicacionesAlmacenApi.actualizar,
  eliminarUbicacion: ubicacionesAlmacenApi.eliminar,
  toggleBloqueoUbicacion: ubicacionesAlmacenApi.toggleBloqueo,
  obtenerStockUbicacion: ubicacionesAlmacenApi.obtenerStock,
  agregarStockUbicacion: ubicacionesAlmacenApi.agregarStock,
  moverStockUbicacion: ubicacionesAlmacenApi.moverStock,
  obtenerUbicacionesDisponibles: ubicacionesAlmacenApi.obtenerDisponibles,
  obtenerEstadisticasUbicaciones: ubicacionesAlmacenApi.obtenerEstadisticas,
  obtenerUbicacionesProducto: ubicacionesAlmacenApi.obtenerPorProducto,
};
