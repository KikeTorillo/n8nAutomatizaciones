/**
 * Hooks para gestión de Roles
 * Sistema de roles dinámicos por organización
 * Migrado parcialmente a createCRUDHooks - Ene 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
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

// ============================================================
// HOOKS CRUD BÁSICOS (via factory)
// ============================================================

const crudHooks = createCRUDHooks({
  name: 'rol',
  namePlural: 'roles',
  api: rolesApi,
  baseKey: 'roles',
  apiMethods: {
    list: 'listar',
    get: 'obtenerPorId',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

export const useRoles = crudHooks.useList;
export const useRol = crudHooks.useDetail;
export const useCrearRol = crudHooks.useCreate;
export const useActualizarRol = crudHooks.useUpdate;
export const useEliminarRol = crudHooks.useDelete;

// ============================================================
// HOOKS ESPECIALES (no migrables a factory)
// ============================================================

/**
 * Hook para obtener los permisos de un rol
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
 * Hook para actualizar un permiso de un rol
 */
export function useActualizarPermisoRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rolId, permisoId, valor }) => rolesApi.actualizarPermiso(rolId, permisoId, valor),
    onSuccess: (response, { rolId }) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolId), refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolId), refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolDestinoId), refetchType: 'active' });
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
