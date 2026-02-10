import client from '../client';
import type { ApiResponse } from '../client';
import type { CategoriaProfesional, Profesional } from '@/types/entities';

interface CategoriasProfesionalListParams {
  activo?: boolean;
  tipo_categoria?: string;
  agrupado?: string;
  limit?: number;
  offset?: number;
}

export const categoriasProfesionalApi = {
  crear: (data: Partial<CategoriaProfesional>): Promise<ApiResponse<CategoriaProfesional>> =>
    client.post('/categorias-profesional', data),
  listar: (params: CategoriasProfesionalListParams = {}): Promise<ApiResponse<CategoriaProfesional[]>> =>
    client.get('/categorias-profesional', { params }),
  listarAgrupadas: (): Promise<ApiResponse<Record<string, CategoriaProfesional[]>>> =>
    client.get('/categorias-profesional', { params: { agrupado: 'true' } }),
  obtener: (id: number): Promise<ApiResponse<CategoriaProfesional>> =>
    client.get(`/categorias-profesional/${id}`),
  obtenerProfesionales: (id: number): Promise<ApiResponse<Profesional[]>> =>
    client.get(`/categorias-profesional/${id}/profesionales`),
  actualizar: (id: number, data: Partial<CategoriaProfesional>): Promise<ApiResponse<CategoriaProfesional>> =>
    client.put(`/categorias-profesional/${id}`, data),
  eliminar: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/categorias-profesional/${id}`),
};
