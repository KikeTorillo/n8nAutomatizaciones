import client from '../client';
import type { ApiResponse } from '../client';

interface AjusteMasivo {
  id: number;
  folio: string;
  archivo_nombre: string;
  estado: string;
  items: AjusteMasivoItem[];
  created_at: string;
  updated_at: string;
}

interface AjusteMasivoItem {
  fila_numero: number;
  sku?: string;
  codigo_barras?: string;
  cantidad_ajuste: number;
  motivo?: string;
  producto_id?: number;
  estado?: string;
}

interface AjustesMasivosListParams {
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  folio?: string;
  limit?: number;
  offset?: number;
}

export const ajustesMasivosApi = {
  listar: (params: AjustesMasivosListParams): Promise<ApiResponse<{ ajustes: AjusteMasivo[]; totales: Record<string, number> }>> =>
    client.get('/inventario/ajustes-masivos', { params }),
  obtenerPorId: (id: number): Promise<ApiResponse<AjusteMasivo>> =>
    client.get(`/inventario/ajustes-masivos/${id}`),
  crear: (data: { archivo_nombre: string; items: AjusteMasivoItem[] }): Promise<ApiResponse<AjusteMasivo>> =>
    client.post('/inventario/ajustes-masivos', data),
  validar: (id: number): Promise<ApiResponse<AjusteMasivo>> =>
    client.post(`/inventario/ajustes-masivos/${id}/validar`),
  aplicar: (id: number): Promise<ApiResponse<{ aplicados: unknown[]; errores: unknown[] }>> =>
    client.post(`/inventario/ajustes-masivos/${id}/aplicar`),
  cancelar: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/inventario/ajustes-masivos/${id}`),
  descargarPlantilla: (): Promise<Blob> =>
    client.get('/inventario/ajustes-masivos/plantilla', { responseType: 'blob' }) as unknown as Promise<Blob>,
};
