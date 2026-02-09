import apiClient from '../client';

/**
 * API de Permisos
 */
export const permisosApi = {
  // ========== Catálogo ==========

  /** Listar catálogo de permisos */
  listarCatalogo: (params: Record<string, unknown> = {}) => apiClient.get('/permisos/catalogo', { params }),

  /** Listar módulos disponibles */
  listarModulos: () => apiClient.get('/permisos/modulos'),

  // ========== Mis Permisos ==========

  /** Obtener todos los permisos del usuario actual */
  obtenerMisPermisos: (sucursalId: number) => apiClient.get('/permisos/mis-permisos', { params: { sucursalId } }),

  /** Obtener resumen de permisos agrupados por módulo */
  obtenerResumen: (sucursalId: number) => apiClient.get('/permisos/resumen', { params: { sucursalId } }),

  /** Verificar si el usuario tiene un permiso específico */
  verificar: (codigo: string, sucursalId: number) => apiClient.get(`/permisos/verificar/${codigo}`, { params: { sucursalId } }),

  /** Obtener valor de un permiso específico */
  obtenerValor: (codigo: string, sucursalId: number) => apiClient.get(`/permisos/valor/${codigo}`, { params: { sucursalId } }),

  /** Obtener permisos de un módulo específico */
  obtenerPermisosModulo: (modulo: string, sucursalId: number) => apiClient.get(`/permisos/modulos/${modulo}`, { params: { sucursalId } }),

  // ========== Permisos por Rol ==========

  /** Listar permisos de un rol */
  listarPorRol: (rol: string) => apiClient.get(`/permisos/roles/${rol}`),

  /** Actualizar múltiples permisos de un rol */
  actualizarPermisosRol: (rol: string, permisos: Array<{ permisoId: number; valor: unknown }>) =>
    apiClient.put(`/permisos/roles/${rol}`, { permisos }),

  /** Asignar un permiso específico a un rol */
  asignarPermisoRol: (rol: string, permisoId: number, valor: unknown) =>
    apiClient.post(`/permisos/roles/${rol}/permisos`, { permisoId, valor }),

  /** Eliminar permiso de un rol (vuelve a default) */
  eliminarPermisoRol: (rol: string, permisoId: number) =>
    apiClient.delete(`/permisos/roles/${rol}/permisos/${permisoId}`),

  // ========== Overrides Usuario/Sucursal ==========

  /** Listar overrides de un usuario en una sucursal */
  listarPermisosUsuarioSucursal: (usuarioId: number, sucursalId: number) =>
    apiClient.get(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}`),

  /** Asignar override de permiso a usuario/sucursal */
  asignarPermisoUsuarioSucursal: (usuarioId: number, sucursalId: number, data: Record<string, unknown>) =>
    apiClient.post(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}`, data),

  /** Eliminar override de permiso usuario/sucursal */
  eliminarPermisoUsuarioSucursal: (usuarioId: number, sucursalId: number, permisoId: number) =>
    apiClient.delete(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}/permisos/${permisoId}`),
};
