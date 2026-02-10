import client from '../client';
import type { ApiResponse } from '../client';
import type { Workflow } from '@/types/entities';

interface WorkflowDesignerEntity {
  tipo: string;
  campos: Record<string, unknown>[];
}

export const workflowDesignerApi = {
  listarEntidades: (): Promise<ApiResponse<WorkflowDesignerEntity[]>> =>
    client.get('/workflows/designer/entidades'),
  listarRoles: (): Promise<ApiResponse<unknown[]>> =>
    client.get('/workflows/designer/roles'),
  listarPermisos: (): Promise<ApiResponse<unknown[]>> =>
    client.get('/workflows/designer/permisos'),
  crear: (data: Record<string, unknown>): Promise<ApiResponse<Workflow>> =>
    client.post('/workflows/designer/definiciones', data),
  actualizar: (id: number, data: Record<string, unknown>): Promise<ApiResponse<Workflow>> =>
    client.put(`/workflows/designer/definiciones/${id}`, data),
  eliminar: (id: number): Promise<ApiResponse<void>> =>
    client.delete(`/workflows/designer/definiciones/${id}`),
  duplicar: (id: number, data?: { nuevo_codigo?: string; nuevo_nombre?: string }): Promise<ApiResponse<Workflow>> =>
    client.post(`/workflows/designer/definiciones/${id}/duplicar`, data),
  cambiarEstadoPublicacion: (id: number, activo: boolean): Promise<ApiResponse<Workflow>> =>
    client.patch(`/workflows/designer/definiciones/${id}/publicar`, { activo }),
  validar: (id: number): Promise<ApiResponse<{ valido: boolean; errores: string[]; estadisticas: Record<string, number> }>> =>
    client.get(`/workflows/designer/definiciones/${id}/validar`),
};
