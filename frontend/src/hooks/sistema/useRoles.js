/**
 * Hooks para gestión de Roles
 * Sistema de roles dinámicos por organización
 * @version 1.0.0
 * @date Enero 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { toast } from 'sonner';

/**
 * Keys de query para roles
 */
export const rolesKeys = {
  all: ['roles'],
  list: (params) => ['roles', 'list', params],
  detail: (id) => ['roles', 'detail', id],
  permisos: (rolId) => ['roles', 'permisos', rolId],
};

/**
 * Hook para listar roles de la organización
 * @param {Object} params - Parámetros de filtrado
 * @param {Object} options - Opciones de useQuery
 */
export function useRoles(params = {}, options = {}) {
  return useQuery({
    queryKey: rolesKeys.list(params),
    queryFn: async () => {
      const response = await rolesApi.listar(params);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    ...options,
  });
}

/**
 * Hook para obtener un rol por ID
 * @param {number} id - ID del rol
 * @param {Object} options - Opciones de useQuery
 */
export function useRol(id, options = {}) {
  return useQuery({
    queryKey: rolesKeys.detail(id),
    queryFn: async () => {
      const response = await rolesApi.obtenerPorId(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
    ...options,
  });
}

/**
 * Hook para obtener los permisos de un rol
 * @param {number} rolId - ID del rol
 * @param {Object} options - Opciones de useQuery
 */
export function usePermisosRol(rolId, options = {}) {
  return useQuery({
    queryKey: rolesKeys.permisos(rolId),
    queryFn: async () => {
      const response = await rolesApi.obtenerPermisos(rolId);
      return response.data.data;
    },
    enabled: !!rolId,
    staleTime: STALE_TIMES.SEMI_STATIC,
    ...options,
  });
}

/**
 * Hook para crear un nuevo rol
 */
export function useCrearRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => rolesApi.crear(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success('Rol creado exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al crear el rol';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar un rol
 */
export function useActualizarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => rolesApi.actualizar(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      queryClient.invalidateQueries({ queryKey: rolesKeys.detail(id) });
      toast.success('Rol actualizado exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar el rol';
      toast.error(message);
    },
  });
}

/**
 * Hook para eliminar un rol
 */
export function useEliminarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => rolesApi.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      toast.success('Rol eliminado exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al eliminar el rol';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar un permiso de un rol
 */
export function useActualizarPermisoRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rolId, permisoId, valor }) => rolesApi.actualizarPermiso(rolId, permisoId, valor),
    onSuccess: (response, { rolId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolId) });
      // No mostrar toast para cada permiso (puede ser muy frecuente)
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar el permiso';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar múltiples permisos de un rol (batch)
 */
export function useActualizarPermisosRolBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rolId, permisos }) => rolesApi.actualizarPermisosBatch(rolId, permisos),
    onSuccess: (response, { rolId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolId) });
      toast.success('Permisos actualizados exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al actualizar los permisos';
      toast.error(message);
    },
  });
}

/**
 * Hook para copiar permisos de otro rol
 */
export function useCopiarPermisosRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rolDestinoId, rolOrigenId }) => rolesApi.copiarPermisos(rolDestinoId, rolOrigenId),
    onSuccess: (response, { rolDestinoId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolDestinoId) });
      toast.success('Permisos copiados exitosamente');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Error al copiar los permisos';
      toast.error(message);
    },
  });
}

/**
 * Hook para obtener roles para select (solo activos, sin paginación)
 */
export function useRolesSelect(options = {}) {
  return useQuery({
    queryKey: rolesKeys.list({ activo: true, limit: 100 }),
    queryFn: async () => {
      const response = await rolesApi.listar({ activo: 'true', limit: 100 });
      const roles = response.data.data || [];
      // Transformar para usar en selects
      return roles.map(rol => ({
        value: rol.id,
        label: rol.nombre,
        codigo: rol.codigo,
        color: rol.color,
        icono: rol.icono,
        nivel_jerarquia: rol.nivel_jerarquia,
        es_rol_sistema: rol.es_rol_sistema,
      }));
    },
    staleTime: STALE_TIMES.STATIC,
    ...options,
  });
}
