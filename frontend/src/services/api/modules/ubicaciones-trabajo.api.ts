import client from '../client';
import type { ApiResponse } from '../client';

interface UbicacionTrabajo {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  es_remoto: boolean;
  es_oficina_principal: boolean;
  color?: string;
  icono?: string;
  activa: boolean;
  organizacion_id: number;
  sucursal_id?: number;
  created_at: string;
  updated_at: string;
}

interface UbicacionesTrabajoListParams {
  activas?: boolean;
  es_remoto?: boolean;
  es_oficina_principal?: boolean;
  sucursal_id?: number;
}

export const ubicacionesTrabajoApi = {
  listar: (params: UbicacionesTrabajoListParams = {}): Promise<ApiResponse<UbicacionTrabajo[]>> =>
    client.get('/ubicaciones-trabajo', { params }),
  estadisticas: (): Promise<ApiResponse<Record<string, unknown>>> =>
    client.get('/ubicaciones-trabajo/estadisticas'),
  obtener: (id: number): Promise<ApiResponse<UbicacionTrabajo>> =>
    client.get(`/ubicaciones-trabajo/${id}`),
  crear: (data: Partial<UbicacionTrabajo>): Promise<ApiResponse<UbicacionTrabajo>> =>
    client.post('/ubicaciones-trabajo', data),
  actualizar: (id: number, data: Partial<UbicacionTrabajo>): Promise<ApiResponse<UbicacionTrabajo>> =>
    client.put(`/ubicaciones-trabajo/${id}`, data),
  eliminar: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/ubicaciones-trabajo/${id}`),
};
