import client from '../client';
import type { ApiResponse } from '../client';

interface ReordenDashboard {
  metricas: Record<string, number>;
  reglas: unknown[];
  job: unknown;
}

interface ProductoBajoMinimo {
  producto_id: number;
  nombre: string;
  sku: string;
  stock_actual: number;
  punto_reorden: number;
  cantidad_sugerida: number;
}

interface ReordenRegla {
  id: number;
  producto_id?: number;
  activo: boolean;
  punto_reorden: number;
  cantidad_reorden: number;
}

interface ReordenLog {
  id: number;
  tipo: string;
  reglas_evaluadas: number;
  ordenes_generadas: number;
  errores: number;
  created_at: string;
}

interface ReordenListParams {
  solo_sin_oc?: boolean;
  categoria_id?: number;
  proveedor_id?: number;
  limit?: number;
}

export const reordenApi = {
  obtenerDashboard: (): Promise<ApiResponse<ReordenDashboard>> =>
    client.get('/inventario/reorden/dashboard'),
  productosBajoMinimo: (params: ReordenListParams = {}): Promise<ApiResponse<ProductoBajoMinimo[]>> =>
    client.get('/inventario/reorden/productos-bajo-minimo', { params }),
  listarRutas: (params: { tipo?: string; activo?: boolean } = {}): Promise<ApiResponse<unknown[]>> =>
    client.get('/inventario/reorden/rutas', { params }),
  listarReglas: (params: { activo?: boolean; producto_id?: number } = {}): Promise<ApiResponse<ReordenRegla[]>> =>
    client.get('/inventario/reorden/reglas', { params }),
  obtenerRegla: (id: number): Promise<ApiResponse<ReordenRegla>> =>
    client.get(`/inventario/reorden/reglas/${id}`),
  crearRegla: (data: Partial<ReordenRegla>): Promise<ApiResponse<ReordenRegla>> =>
    client.post('/inventario/reorden/reglas', data),
  actualizarRegla: (id: number, data: Partial<ReordenRegla>): Promise<ApiResponse<ReordenRegla>> =>
    client.put(`/inventario/reorden/reglas/${id}`, data),
  eliminarRegla: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/inventario/reorden/reglas/${id}`),
  ejecutarManual: (): Promise<ApiResponse<{ reglas_evaluadas: number; ordenes_generadas: number; errores: number; detalles: unknown[] }>> =>
    client.post('/inventario/reorden/ejecutar'),
  listarLogs: (params: { tipo?: string; fecha_desde?: string; fecha_hasta?: string; limit?: number; offset?: number } = {}): Promise<ApiResponse<ReordenLog[]>> =>
    client.get('/inventario/reorden/logs', { params }),
  obtenerLog: (id: number): Promise<ApiResponse<ReordenLog>> =>
    client.get(`/inventario/reorden/logs/${id}`),
};
