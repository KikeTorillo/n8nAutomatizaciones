import apiClient from '../client';

// ========== Tipos ==========

interface CustomFieldDefinicionCreateData {
  nombre: string;
  entidad_tipo: string;
  tipo_dato: string;
  opciones?: string[];
  requerido?: boolean;
  visible_en_formulario?: boolean;
  visible_en_listado?: boolean;
  seccion?: string;
  [key: string]: unknown;
}

interface CustomFieldDefinicionUpdateData extends Partial<CustomFieldDefinicionCreateData> {}

interface CustomFieldDefinicionListParams {
  entidad_tipo?: string;
  activo?: boolean;
  seccion?: string;
  visible_en_formulario?: boolean;
  visible_en_listado?: boolean;
  limit?: number;
  offset?: number;
}

interface CustomFieldReorderData {
  entidad_tipo: string;
  orden: Array<{ id: number; orden: number }>;
}

// ========== API ==========

export const customFieldsApi = {
  // Definiciones
  /** Listar definiciones de campos */
  listarDefiniciones: (params: CustomFieldDefinicionListParams = {}) =>
    apiClient.get('/custom-fields/definiciones', { params }),

  /** Obtener definición por ID */
  obtenerDefinicion: (id: number) =>
    apiClient.get(`/custom-fields/definiciones/${id}`),

  /** Crear definición de campo */
  crearDefinicion: (data: CustomFieldDefinicionCreateData) =>
    apiClient.post('/custom-fields/definiciones', data),

  /** Actualizar definición de campo */
  actualizarDefinicion: (id: number, data: CustomFieldDefinicionUpdateData) =>
    apiClient.put(`/custom-fields/definiciones/${id}`, data),

  /** Eliminar definición de campo (soft delete) */
  eliminarDefinicion: (id: number) =>
    apiClient.delete(`/custom-fields/definiciones/${id}`),

  /** Reordenar definiciones */
  reordenarDefiniciones: (data: CustomFieldReorderData) =>
    apiClient.put('/custom-fields/definiciones/reorder', data),

  // Valores
  /** Obtener valores de campos personalizados de una entidad */
  obtenerValores: (entidadTipo: string, entidadId: number) =>
    apiClient.get(`/custom-fields/valores/${entidadTipo}/${entidadId}`),

  /** Guardar valores de campos personalizados */
  guardarValores: (entidadTipo: string, entidadId: number, valores: Record<string, unknown>) =>
    apiClient.post(`/custom-fields/valores/${entidadTipo}/${entidadId}`, valores),

  /** Validar valores de campos personalizados (sin guardar) */
  validarValores: (entidadTipo: string, valores: Record<string, unknown>) =>
    apiClient.post(`/custom-fields/validar/${entidadTipo}`, valores),

  // Utilidades
  /** Obtener secciones disponibles para un tipo de entidad */
  obtenerSecciones: (entidadTipo: string) =>
    apiClient.get(`/custom-fields/secciones/${entidadTipo}`),
};
