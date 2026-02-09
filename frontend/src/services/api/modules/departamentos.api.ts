import apiClient from '../client';

// ========== Tipos ==========

interface DepartamentoCreateData {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  parent_id?: number;
  gerente_id?: number;
  activo?: boolean;
}

interface DepartamentoUpdateData extends Partial<DepartamentoCreateData> {}

interface DepartamentoListParams {
  activo?: boolean;
  parent_id?: number;
  limit?: number;
  offset?: number;
}

// ========== API ==========

export const departamentosApi = {
  /** Crear departamento */
  crear: (data: DepartamentoCreateData) =>
    apiClient.post('/departamentos', data),

  /** Listar departamentos con filtros */
  listar: (params: DepartamentoListParams = {}) =>
    apiClient.get('/departamentos', { params }),

  /** Obtener arbol jerarquico de departamentos */
  obtenerArbol: () =>
    apiClient.get('/departamentos/arbol'),

  /** Obtener departamento por ID */
  obtener: (id: number) =>
    apiClient.get(`/departamentos/${id}`),

  /** Actualizar departamento */
  actualizar: (id: number, data: DepartamentoUpdateData) =>
    apiClient.put(`/departamentos/${id}`, data),

  /** Eliminar departamento (soft delete) */
  eliminar: (id: number) =>
    apiClient.delete(`/departamentos/${id}`),
};
