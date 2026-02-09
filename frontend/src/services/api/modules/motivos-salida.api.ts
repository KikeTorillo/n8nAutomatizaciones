import apiClient from '../client';

// ========== Tipos ==========

interface MotivoSalidaCreateData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiere_documentacion?: boolean;
  afecta_finiquito?: boolean;
  color?: string;
  icono?: string;
}

interface MotivoSalidaUpdateData extends Partial<MotivoSalidaCreateData> {}

interface MotivoSalidaListParams {
  solo_sistema?: boolean;
  solo_personalizados?: boolean;
  activos?: boolean;
  limit?: number;
  offset?: number;
}

// ========== API ==========

export const motivosSalidaApi = {
  /** Listar motivos de salida disponibles (sistema + personalizados) */
  listar: (params: MotivoSalidaListParams = {}) =>
    apiClient.get('/motivos-salida', { params }),

  /** Obtener estadisticas de uso de motivos */
  estadisticas: () =>
    apiClient.get('/motivos-salida/estadisticas'),

  /** Obtener motivo de salida por ID */
  obtener: (id: number) =>
    apiClient.get(`/motivos-salida/${id}`),

  /** Obtener motivo de salida por codigo */
  obtenerPorCodigo: (codigo: string) =>
    apiClient.get(`/motivos-salida/codigo/${codigo}`),

  /** Crear motivo de salida personalizado (solo admin/propietario) */
  crear: (data: MotivoSalidaCreateData) =>
    apiClient.post('/motivos-salida', data),

  /** Actualizar motivo de salida */
  actualizar: (id: number, data: MotivoSalidaUpdateData) =>
    apiClient.put(`/motivos-salida/${id}`, data),

  /** Eliminar motivo de salida (soft delete) */
  eliminar: (id: number) =>
    apiClient.delete(`/motivos-salida/${id}`),
};
