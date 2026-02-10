import apiClient from '../client';

// ========== Tipos ==========

interface RolCreateData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_jerarquia?: number;
  bypass_permisos?: boolean;
  color?: string;
  icono?: string;
}

interface RolUpdateData extends Partial<RolCreateData> {}

interface RolListParams {
  incluir_sistema?: boolean;
  activo?: boolean | string;
  page?: number;
  limit?: number;
  order_by?: string;
  order_direction?: string;
}

interface PermisoUpdate {
  permiso_id: number;
  valor: boolean | number | string;
}

// ========== API ==========

export const rolesApi = {
  /** Listar roles de la organización */
  listar: (params: RolListParams = {}) =>
    apiClient.get('/roles', { params }),

  /** Obtener un rol por ID */
  obtenerPorId: (id: number) =>
    apiClient.get(`/roles/${id}`),

  /** Crear un nuevo rol */
  crear: (data: RolCreateData) =>
    apiClient.post('/roles', data),

  /** Actualizar un rol */
  actualizar: (id: number, data: RolUpdateData) =>
    apiClient.put(`/roles/${id}`, data),

  /** Eliminar un rol */
  eliminar: (id: number) =>
    apiClient.delete(`/roles/${id}`),

  /** Obtener permisos de un rol */
  obtenerPermisos: (rolId: number) =>
    apiClient.get(`/roles/${rolId}/permisos`),

  /** Actualizar un permiso de un rol */
  actualizarPermiso: (rolId: number, permisoId: number, valor: boolean | number | string) =>
    apiClient.put(`/roles/${rolId}/permisos/${permisoId}`, { valor }),

  /** Actualizar múltiples permisos de un rol (batch) */
  actualizarPermisosBatch: (rolId: number, permisos: PermisoUpdate[]) =>
    apiClient.put(`/roles/${rolId}/permisos`, { permisos }),

  /** Copiar permisos de otro rol */
  copiarPermisos: (rolDestinoId: number, rolOrigenId: number) =>
    apiClient.post(`/roles/${rolDestinoId}/copiar-permisos`, { rol_origen_id: rolOrigenId }),
};
