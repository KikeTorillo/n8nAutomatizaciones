import apiClient from '../client';
/**
 * API de Permisos
 */
export const permisosApi = {
  // ========== Catálogo ==========

  /**
   * Listar catálogo de permisos
   * @param {Object} params - { modulo?, categoria? }
   */
  listarCatalogo: (params = {}) => apiClient.get('/permisos/catalogo', { params }),

  /**
   * Listar módulos disponibles
   */
  listarModulos: () => apiClient.get('/permisos/modulos'),

  // ========== Mis Permisos ==========

  /**
   * Obtener todos los permisos del usuario actual
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerMisPermisos: (sucursalId) => apiClient.get('/permisos/mis-permisos', { params: { sucursalId } }),

  /**
   * Obtener resumen de permisos agrupados por módulo
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerResumen: (sucursalId) => apiClient.get('/permisos/resumen', { params: { sucursalId } }),

  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string} codigo - Código del permiso (ej: 'pos.acceso')
   * @param {number} sucursalId - ID de la sucursal
   */
  verificar: (codigo, sucursalId) => apiClient.get(`/permisos/verificar/${codigo}`, { params: { sucursalId } }),

  /**
   * Obtener valor de un permiso específico
   * @param {string} codigo - Código del permiso
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerValor: (codigo, sucursalId) => apiClient.get(`/permisos/valor/${codigo}`, { params: { sucursalId } }),

  /**
   * Obtener permisos de un módulo específico
   * @param {string} modulo - Nombre del módulo
   * @param {number} sucursalId - ID de la sucursal
   */
  obtenerPermisosModulo: (modulo, sucursalId) => apiClient.get(`/permisos/modulos/${modulo}`, { params: { sucursalId } }),

  // ========== Permisos por Rol ==========

  /**
   * Listar permisos de un rol
   * @param {string} rol - 'admin' | 'propietario' | 'empleado' | 'bot'
   */
  listarPorRol: (rol) => apiClient.get(`/permisos/roles/${rol}`),

  /**
   * Actualizar múltiples permisos de un rol
   * @param {string} rol
   * @param {Array} permisos - [{ permisoId, valor }]
   */
  actualizarPermisosRol: (rol, permisos) => apiClient.put(`/permisos/roles/${rol}`, { permisos }),

  /**
   * Asignar un permiso específico a un rol
   * @param {string} rol
   * @param {number} permisoId
   * @param {any} valor
   */
  asignarPermisoRol: (rol, permisoId, valor) => apiClient.post(`/permisos/roles/${rol}/permisos`, { permisoId, valor }),

  /**
   * Eliminar permiso de un rol (vuelve a default)
   * @param {string} rol
   * @param {number} permisoId
   */
  eliminarPermisoRol: (rol, permisoId) => apiClient.delete(`/permisos/roles/${rol}/permisos/${permisoId}`),

  // ========== Overrides Usuario/Sucursal ==========

  /**
   * Listar overrides de un usuario en una sucursal
   * @param {number} usuarioId
   * @param {number} sucursalId
   */
  listarPermisosUsuarioSucursal: (usuarioId, sucursalId) =>
    apiClient.get(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}`),

  /**
   * Asignar override de permiso a usuario/sucursal
   * @param {number} usuarioId
   * @param {number} sucursalId
   * @param {Object} data - { permisoId, valor, motivo?, fechaInicio?, fechaFin? }
   */
  asignarPermisoUsuarioSucursal: (usuarioId, sucursalId, data) =>
    apiClient.post(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}`, data),

  /**
   * Eliminar override de permiso usuario/sucursal
   * @param {number} usuarioId
   * @param {number} sucursalId
   * @param {number} permisoId
   */
  eliminarPermisoUsuarioSucursal: (usuarioId, sucursalId, permisoId) =>
    apiClient.delete(`/permisos/usuarios/${usuarioId}/sucursales/${sucursalId}/permisos/${permisoId}`),
};

// ==================== CUSTOM FIELDS ====================
