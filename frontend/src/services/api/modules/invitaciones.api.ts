import apiClient from '../client';

// ========== Tipos ==========

interface InvitacionAceptarData {
  nombre: string;
  apellidos?: string;
  password: string;
}

interface InvitacionCreateData {
  profesional_id: number;
  email: string;
  nombre_sugerido?: string;
}

interface InvitacionListParams {
  estado?: string;
}

// ========== API ==========

export const invitacionesApi = {
  /** Validar token de invitación (público) */
  validar: (token: string) =>
    apiClient.get(`/invitaciones/validar/${token}`),

  /** Aceptar invitación y crear usuario (público) */
  aceptar: (token: string, data: InvitacionAceptarData) =>
    apiClient.post(`/invitaciones/aceptar/${token}`, data),

  /** Crear y enviar invitación (requiere auth) */
  crear: (data: InvitacionCreateData) =>
    apiClient.post('/invitaciones', data),

  /** Listar invitaciones de la organización */
  listar: (params: InvitacionListParams = {}) =>
    apiClient.get('/invitaciones', { params }),

  /** Obtener invitación de un profesional */
  obtenerPorProfesional: (profesionalId: number) =>
    apiClient.get(`/invitaciones/profesional/${profesionalId}`),

  /** Reenviar invitación */
  reenviar: (id: number) =>
    apiClient.post(`/invitaciones/${id}/reenviar`),

  /** Cancelar invitación */
  cancelar: (id: number) =>
    apiClient.delete(`/invitaciones/${id}`),
};
