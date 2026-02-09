import apiClient from '../client';

// ========== Tipos ==========

interface HorarioSemanalesEstandarData {
  profesional_id: number;
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
  tipo_horario?: string;
  nombre_horario?: string;
  fecha_inicio?: string;
}

interface HorarioCreateData {
  profesional_id: number;
  dia_semana?: number;
  hora_inicio: string;
  hora_fin: string;
  tipo_horario?: string;
  nombre_horario?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  sucursal_id?: number;
  activo?: boolean;
}

interface HorarioUpdateData extends Partial<Omit<HorarioCreateData, 'profesional_id'>> {}

interface HorarioListParams {
  profesional_id?: number;
  dia_semana?: number;
  tipo_horario?: string;
  sucursal_id?: number;
  activo?: boolean;
  limit?: number;
  offset?: number;
}

// ========== API ==========

export const horariosApi = {
  /** Crear horarios semanales estandar (batch para Lun-Vie) */
  crearSemanalesEstandar: (data: HorarioSemanalesEstandarData) =>
    apiClient.post('/horarios-profesionales/semanales-estandar', data),

  /** Crear horario individual */
  crear: (data: HorarioCreateData) =>
    apiClient.post('/horarios-profesionales', data),

  /** Listar horarios de un profesional */
  listar: (params: HorarioListParams) =>
    apiClient.get('/horarios-profesionales', { params }),

  /** Obtener horario por ID */
  obtener: (id: number) =>
    apiClient.get(`/horarios-profesionales/${id}`),

  /** Actualizar horario */
  actualizar: (id: number, data: HorarioUpdateData) =>
    apiClient.put(`/horarios-profesionales/${id}`, data),

  /** Eliminar horario */
  eliminar: (id: number) =>
    apiClient.delete(`/horarios-profesionales/${id}`),

  /** Validar configuracion de horarios de un profesional */
  validarConfiguracion: (profesionalId: number) =>
    apiClient.get(`/horarios-profesionales/validar/${profesionalId}`),
};
