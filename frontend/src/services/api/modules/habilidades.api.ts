import apiClient from '../client';

// ========== Tipos ==========

interface HabilidadCreateData {
  nombre: string;
  categoria?: string;
  descripcion?: string;
  icono?: string;
  color?: string;
}

interface HabilidadUpdateData extends Partial<HabilidadCreateData> {}

interface HabilidadListParams {
  categoria?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

interface HabilidadProfesionalesParams {
  nivel_minimo?: string;
  verificado?: boolean;
  limit?: number;
  offset?: number;
}

// ========== API ==========

export const habilidadesApi = {
  /** Listar catálogo de habilidades de la organización */
  listar: (params: HabilidadListParams = {}) =>
    apiClient.get('/habilidades', { params }),

  /** Crear habilidad en catálogo */
  crear: (data: HabilidadCreateData) =>
    apiClient.post('/habilidades', data),

  /** Obtener habilidad del catálogo por ID */
  obtener: (habilidadId: number) =>
    apiClient.get(`/habilidades/${habilidadId}`),

  /** Actualizar habilidad del catálogo */
  actualizar: (habilidadId: number, data: HabilidadUpdateData) =>
    apiClient.put(`/habilidades/${habilidadId}`, data),

  /** Eliminar habilidad del catálogo (soft delete) */
  eliminar: (habilidadId: number) =>
    apiClient.delete(`/habilidades/${habilidadId}`),

  /** Listar profesionales con una habilidad específica */
  listarProfesionales: (habilidadId: number, params: HabilidadProfesionalesParams = {}) =>
    apiClient.get(`/habilidades/${habilidadId}/profesionales`, { params }),
};
