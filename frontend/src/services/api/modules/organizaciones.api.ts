import { AxiosResponse } from 'axios';
import apiClient from '../client';
import type {
  Organizacion,
  OrganizacionRegisterData,
  SetupProgress,
  EstadoSuscripcionOrg,
  EstadisticasOrganizacion,
} from '@/types/entities/organizacion';
import type { ApiResponse } from '@/types/entities/common';

// ========== Response Types ==========

type OrganizacionResponse = AxiosResponse<ApiResponse<Organizacion>>;
type SetupProgressResponse = AxiosResponse<ApiResponse<SetupProgress>>;
type EstadoSuscripcionResponse = AxiosResponse<ApiResponse<EstadoSuscripcionOrg>>;
type EstadisticasResponse = AxiosResponse<ApiResponse<EstadisticasOrganizacion>>;

interface RegisterResponse {
  organizacion: Organizacion;
  admin: {
    id: number;
    nombre: string;
    apellidos?: string;
    email: string;
    rol: string;
    token: string;
  };
  servicios_creados?: number;
}

// ========== API ==========

export const organizacionesApi = {
  /** Registro de organizacion (Onboarding publico - Sin autenticacion) */
  register: (data: OrganizacionRegisterData): Promise<AxiosResponse<ApiResponse<RegisterResponse>>> =>
    apiClient.post('/organizaciones/register', data),

  /** Crear organizacion (solo super_admin - Requiere autenticacion) */
  crear: (data: Partial<Organizacion>): Promise<OrganizacionResponse> =>
    apiClient.post('/organizaciones', data),

  /** Obtener organizacion por ID */
  obtener: (id: number): Promise<OrganizacionResponse> =>
    apiClient.get(`/organizaciones/${id}`),

  /** Actualizar organizacion */
  actualizar: (id: number, data: Partial<Organizacion>): Promise<OrganizacionResponse> =>
    apiClient.put(`/organizaciones/${id}`, data),

  /** Obtener estadisticas de la organizacion */
  obtenerEstadisticas: (id: number): Promise<EstadisticasResponse> =>
    apiClient.get(`/organizaciones/${id}/estadisticas`),

  /** Obtener progreso del setup inicial */
  getSetupProgress: (id: number): Promise<SetupProgressResponse> =>
    apiClient.get(`/organizaciones/${id}/setup-progress`),

  /** Obtener estado de suscripcion de la organizacion */
  getEstadoSuscripcion: (id: number): Promise<EstadoSuscripcionResponse> =>
    apiClient.get(`/organizaciones/${id}/estado-suscripcion`),
};
