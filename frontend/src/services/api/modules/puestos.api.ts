import apiClient from '../client';

// ========== Tipos ==========

interface PuestoCreateData {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  departamento_id?: number;
  salario_minimo?: number;
  salario_maximo?: number;
  activo?: boolean;
}

interface PuestoUpdateData extends Partial<PuestoCreateData> {}

interface PuestoListParams {
  activo?: boolean;
  departamento_id?: number;
  limit?: number;
  offset?: number;
}

// ========== API ==========

export const puestosApi = {
  /** Crear puesto */
  crear: (data: PuestoCreateData) =>
    apiClient.post('/puestos', data),

  /** Listar puestos */
  listar: (params: PuestoListParams = {}) =>
    apiClient.get('/puestos', { params }),

  /** Obtener puesto por ID */
  obtener: (id: number) =>
    apiClient.get(`/puestos/${id}`),

  /** Actualizar puesto */
  actualizar: (id: number, data: PuestoUpdateData) =>
    apiClient.put(`/puestos/${id}`, data),

  /** Eliminar puesto (soft delete) */
  eliminar: (id: number) =>
    apiClient.delete(`/puestos/${id}`),
};
