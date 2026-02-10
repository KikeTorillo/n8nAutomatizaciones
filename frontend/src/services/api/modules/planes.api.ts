import client from '../client';
import type { ApiResponse } from '../client';
import type { PlanSuscripcion } from '@/types/entities';

export const planesApi = {
  listar: (): Promise<ApiResponse<PlanSuscripcion[]>> => client.get('/planes'),
  obtener: (id: number): Promise<ApiResponse<PlanSuscripcion>> => client.get(`/planes/${id}`),
};
