import client from '../client';
import type { ApiResponse } from '../client';
import type { Incapacidad } from '@/types/entities';

interface IncapacidadesListParams {
  profesional_id?: number;
  estado?: string;
  tipo_incapacidad?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  limite?: number;
}

interface IncapacidadesEstadisticas {
  total: number;
  por_tipo: Record<string, number>;
  por_estado: Record<string, number>;
  dias_perdidos: number;
}

export const incapacidadesApi = {
  crear: (data: Partial<Incapacidad>): Promise<ApiResponse<Incapacidad>> =>
    client.post('/incapacidades', data),
  listar: (params: IncapacidadesListParams = {}): Promise<ApiResponse<Incapacidad[]>> =>
    client.get('/incapacidades', { params }),
  listarMis: (params: { estado?: string; anio?: number; page?: number; limite?: number } = {}): Promise<ApiResponse<Incapacidad[]>> =>
    client.get('/incapacidades/mis-incapacidades', { params }),
  obtener: (id: number): Promise<ApiResponse<Incapacidad>> =>
    client.get(`/incapacidades/${id}`),
  actualizar: (id: number, data: Partial<Incapacidad>): Promise<ApiResponse<Incapacidad>> =>
    client.put(`/incapacidades/${id}`, data),
  finalizar: (id: number, data: { notas_internas?: string; fecha_fin_real?: string } = {}): Promise<ApiResponse<Incapacidad>> =>
    client.post(`/incapacidades/${id}/finalizar`, data),
  cancelar: (id: number, data: { motivo_cancelacion: string }): Promise<ApiResponse<void>> =>
    client.delete(`/incapacidades/${id}`, { data }),
  crearProrroga: (id: number, data: Partial<Incapacidad>): Promise<ApiResponse<Incapacidad>> =>
    client.post(`/incapacidades/${id}/prorroga`, data),
  obtenerEstadisticas: (params: { anio?: number; departamento_id?: number; tipo_incapacidad?: string } = {}): Promise<ApiResponse<IncapacidadesEstadisticas>> =>
    client.get('/incapacidades/estadisticas', { params }),
  obtenerActivasPorProfesional: (profesionalId: number): Promise<ApiResponse<Incapacidad[]>> =>
    client.get(`/incapacidades/profesional/${profesionalId}/activas`),
};
