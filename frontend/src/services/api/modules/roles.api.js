/**
 * API de Roles
 * Sistema de roles dinámicos por organización
 * @version 1.0.0
 * @date Enero 2026
 */
import apiClient from '../client';

export const rolesApi = {
  // ========== CRUD Básico ==========

  /**
   * Listar roles de la organización
   * @param {Object} params - { incluir_sistema?, activo?, page?, limit?, order_by?, order_direction? }
   */
  listar: (params = {}) => apiClient.get('/roles', { params }),

  /**
   * Obtener un rol por ID
   * @param {number} id - ID del rol
   */
  obtenerPorId: (id) => apiClient.get(`/roles/${id}`),

  /**
   * Crear un nuevo rol
   * @param {Object} data - { codigo, nombre, descripcion?, nivel_jerarquia?, bypass_permisos?, color?, icono? }
   */
  crear: (data) => apiClient.post('/roles', data),

  /**
   * Actualizar un rol
   * @param {number} id - ID del rol
   * @param {Object} data - Datos a actualizar
   */
  actualizar: (id, data) => apiClient.put(`/roles/${id}`, data),

  /**
   * Eliminar un rol
   * @param {number} id - ID del rol (no debe tener usuarios asignados)
   */
  eliminar: (id) => apiClient.delete(`/roles/${id}`),

  // ========== Permisos del Rol ==========

  /**
   * Obtener permisos de un rol
   * @param {number} rolId - ID del rol
   */
  obtenerPermisos: (rolId) => apiClient.get(`/roles/${rolId}/permisos`),

  /**
   * Actualizar un permiso de un rol
   * @param {number} rolId - ID del rol
   * @param {number} permisoId - ID del permiso
   * @param {boolean|number|string} valor - Nuevo valor
   */
  actualizarPermiso: (rolId, permisoId, valor) =>
    apiClient.put(`/roles/${rolId}/permisos/${permisoId}`, { valor }),

  /**
   * Actualizar múltiples permisos de un rol (batch)
   * @param {number} rolId - ID del rol
   * @param {Array<{permiso_id: number, valor: any}>} permisos - Permisos a actualizar
   */
  actualizarPermisosBatch: (rolId, permisos) =>
    apiClient.put(`/roles/${rolId}/permisos`, { permisos }),

  /**
   * Copiar permisos de otro rol
   * @param {number} rolDestinoId - ID del rol que recibirá los permisos
   * @param {number} rolOrigenId - ID del rol del que se copiarán los permisos
   */
  copiarPermisos: (rolDestinoId, rolOrigenId) =>
    apiClient.post(`/roles/${rolDestinoId}/copiar-permisos`, { rol_origen_id: rolOrigenId }),
};
