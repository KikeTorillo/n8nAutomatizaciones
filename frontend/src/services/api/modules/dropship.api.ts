import client from '../client';
import type { ApiResponse } from '../client';

interface DropshipEstadisticas {
  borradores: number;
  enviadas: number;
  entregadas: number;
  canceladas: number;
}

interface DropshipConfiguracion {
  dropship_auto_generar_oc: boolean;
}

interface DropshipOrden {
  id: number;
  estado: string;
  proveedor_id: number;
  venta_id: number;
  items: unknown[];
  created_at: string;
}

interface DropshipOrdenesListParams {
  estado?: string;
  proveedor_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export const dropshipApi = {
  obtenerEstadisticas: (): Promise<ApiResponse<DropshipEstadisticas>> =>
    client.get('/inventario/dropship/estadisticas'),
  obtenerConfiguracion: (): Promise<ApiResponse<DropshipConfiguracion>> =>
    client.get('/inventario/dropship/configuracion'),
  actualizarConfiguracion: (data: DropshipConfiguracion): Promise<ApiResponse<void>> =>
    client.patch('/inventario/dropship/configuracion', data),
  obtenerVentasPendientes: (): Promise<ApiResponse<unknown[]>> =>
    client.get('/inventario/dropship/pendientes'),
  crearDesdeVenta: (ventaId: number): Promise<ApiResponse<unknown>> =>
    client.post(`/inventario/dropship/desde-venta/${ventaId}`),
  listarOrdenes: (params: DropshipOrdenesListParams = {}): Promise<ApiResponse<DropshipOrden[]>> =>
    client.get('/inventario/dropship/ordenes', { params }),
  obtenerOrden: (id: number): Promise<ApiResponse<DropshipOrden>> =>
    client.get(`/inventario/dropship/ordenes/${id}`),
  confirmarEntrega: (id: number, data: { notas?: string } = {}): Promise<ApiResponse<void>> =>
    client.patch(`/inventario/dropship/ordenes/${id}/confirmar-entrega`, data),
  cancelar: (id: number, data: { motivo?: string } = {}): Promise<ApiResponse<void>> =>
    client.patch(`/inventario/dropship/ordenes/${id}/cancelar`, data),
};
