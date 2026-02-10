import client from '../client';
import type { ApiResponse } from '../client';

interface LandedCost {
  id: number;
  orden_compra_id: number;
  tipo_costo: string;
  monto_total: number;
  metodo_distribucion: string;
  descripcion?: string;
  created_at: string;
}

interface LandedCostResumen {
  por_tipo: Record<string, number>;
  totales: Record<string, number>;
}

interface LandedCostDistribucion {
  costo_id: number;
  items: unknown[];
}

export const landedCostsApi = {
  listar: (ordenCompraId: number): Promise<ApiResponse<LandedCost[]>> =>
    client.get(`/inventario/ordenes-compra/${ordenCompraId}/costos`),
  obtenerResumen: (ordenCompraId: number): Promise<ApiResponse<LandedCostResumen>> =>
    client.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/resumen`),
  obtener: (ordenCompraId: number, costoId: number): Promise<ApiResponse<LandedCost>> =>
    client.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`),
  crear: (ordenCompraId: number, data: Partial<LandedCost>): Promise<ApiResponse<LandedCost>> =>
    client.post(`/inventario/ordenes-compra/${ordenCompraId}/costos`, data),
  actualizar: (ordenCompraId: number, costoId: number, data: Partial<LandedCost>): Promise<ApiResponse<LandedCost>> =>
    client.put(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`, data),
  eliminar: (ordenCompraId: number, costoId: number): Promise<ApiResponse<void>> =>
    client.delete(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}`),
  distribuir: (ordenCompraId: number, costoId: number): Promise<ApiResponse<void>> =>
    client.post(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}/distribuir`),
  obtenerDistribucion: (ordenCompraId: number, costoId: number): Promise<ApiResponse<LandedCostDistribucion>> =>
    client.get(`/inventario/ordenes-compra/${ordenCompraId}/costos/${costoId}/distribucion`),
  distribuirTodos: (ordenCompraId: number): Promise<ApiResponse<void>> =>
    client.post(`/inventario/ordenes-compra/${ordenCompraId}/distribuir-costos`),
  obtenerCostosPorItems: (ordenCompraId: number): Promise<ApiResponse<unknown[]>> =>
    client.get(`/inventario/ordenes-compra/${ordenCompraId}/costos-por-items`),
};
