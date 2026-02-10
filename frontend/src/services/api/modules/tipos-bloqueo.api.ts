import client from '../client';
import type { ApiResponse } from '../client';
import type { TipoBloqueoConfig } from '@/types/entities';

interface TiposBloqueoListParams {
  solo_sistema?: boolean;
  solo_personalizados?: boolean;
}

export const tiposBloqueoApi = {
  listar: (params: TiposBloqueoListParams = {}): Promise<ApiResponse<TipoBloqueoConfig[]>> =>
    client.get('/tipos-bloqueo', { params }),
  obtener: (id: number): Promise<ApiResponse<TipoBloqueoConfig>> =>
    client.get(`/tipos-bloqueo/${id}`),
  crear: (data: Partial<TipoBloqueoConfig>): Promise<ApiResponse<TipoBloqueoConfig>> =>
    client.post('/tipos-bloqueo', data),
  actualizar: (id: number, data: Partial<TipoBloqueoConfig>): Promise<ApiResponse<TipoBloqueoConfig>> =>
    client.put(`/tipos-bloqueo/${id}`, data),
  eliminar: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/tipos-bloqueo/${id}`),
};
