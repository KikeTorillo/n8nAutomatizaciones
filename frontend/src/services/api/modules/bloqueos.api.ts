import apiClient from '../client';

// ========== Tipos ==========

interface BloqueoCreateData {
  profesional_id?: number | null;
  tipo_bloqueo: string;
  titulo?: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio?: string;
  hora_fin?: string;
  todo_el_dia?: boolean;
  recurrente?: boolean;
  [key: string]: unknown;
}

interface BloqueoUpdateData extends Partial<BloqueoCreateData> {}

interface BloqueoListParams {
  profesional_id?: number;
  tipo_bloqueo?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  solo_organizacionales?: boolean;
  limite?: number;
  offset?: number;
}

// ========== API ==========

export const bloqueosApi = {
  /** Crear bloqueo de horario */
  crear: (data: BloqueoCreateData) =>
    apiClient.post('/bloqueos-horarios', data),

  /** Listar bloqueos con filtros */
  listar: (params: BloqueoListParams = {}) =>
    apiClient.get('/bloqueos-horarios', { params }),

  /** Obtener bloqueo por ID */
  obtener: (id: number) =>
    apiClient.get(`/bloqueos-horarios/${id}`),

  /** Actualizar bloqueo */
  actualizar: (id: number, data: BloqueoUpdateData) =>
    apiClient.put(`/bloqueos-horarios/${id}`, data),

  /** Eliminar bloqueo */
  eliminar: (id: number) =>
    apiClient.delete(`/bloqueos-horarios/${id}`),

  /** Obtener bloqueos de un profesional específico */
  obtenerPorProfesional: (profesionalId: number, params: Pick<BloqueoListParams, 'fecha_inicio' | 'fecha_fin'> = {}) =>
    apiClient.get('/bloqueos-horarios', { params: { ...params, profesional_id: profesionalId } }),

  /** Obtener bloqueos organizacionales (sin profesional específico) */
  obtenerOrganizacionales: (params: Omit<BloqueoListParams, 'profesional_id' | 'solo_organizacionales'> = {}) =>
    apiClient.get('/bloqueos-horarios', { params: { ...params, solo_organizacionales: true } }),

  /** Obtener bloqueos por rango de fechas */
  obtenerPorRangoFechas: (fechaInicio: string, fechaFin: string, params: Omit<BloqueoListParams, 'fecha_inicio' | 'fecha_fin'> = {}) =>
    apiClient.get('/bloqueos-horarios', {
      params: { ...params, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    }),
};
