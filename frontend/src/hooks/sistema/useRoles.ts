/**
 * ====================================================================
 * HOOKS ROLES
 * ====================================================================
 *
 * Sistema de roles dinamicos por organizacion.
 * Migrado parcialmente a createCRUDHooks - Ene 2026
 * Migrado a TypeScript - Feb 2026
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/services/api/endpoints';
import { createCRUDHooks } from '@/hooks/factories';
import { STALE_TIMES } from '@/app/queryClient';
import { toast } from 'sonner';
import { queryKeys } from '@/hooks/config';

// ==================== TIPOS ====================

interface Rol {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_jerarquia: number;
  bypass_permisos: boolean;
  color?: string;
  icono?: string;
  es_rol_sistema: boolean;
  activo: boolean;
}

interface RolSelectOption {
  value: number;
  label: string;
  codigo: string;
  color?: string;
  icono?: string;
  nivel_jerarquia: number;
  es_rol_sistema: boolean;
}

interface ActualizarPermisoParams {
  rolId: number;
  permisoId: number;
  valor: boolean | number | string;
}

interface ActualizarPermisosBatchParams {
  rolId: number;
  permisos: Array<{ permiso_id: number; valor: unknown }>;
}

interface CopiarPermisosParams {
  rolDestinoId: number;
  rolOrigenId: number;
}

/** Error de API con response HTTP */
interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ==================== QUERY KEYS ====================

/**
 * Keys de query para roles (derivadas de queryKeys centralizadas)
 */
const rolesKeys = {
  all: queryKeys.sistema.roles.all,
  list: (params: Record<string, unknown>) => queryKeys.sistema.roles.list(params),
  detail: (id: number) => queryKeys.sistema.roles.detail(id),
  permisos: (rolId: number) => queryKeys.sistema.roles.permisos(rolId),
} as const;

// ============================================================
// HOOKS CRUD BASICOS (via factory)
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
export function usePermisosRol(rolId: number | null | undefined, options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: rolesKeys.permisos(rolId as number),
    queryFn: async () => {
      const response = await rolesApi.obtenerPermisos(rolId!);
      return (response as any).data.data;
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
    mutationFn: ({ rolId, permisoId, valor }: ActualizarPermisoParams) =>
      rolesApi.actualizarPermiso(rolId, permisoId, valor),
    onSuccess: (_: unknown, { rolId }: ActualizarPermisoParams) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolId), refetchType: 'active' });
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      const message = apiError.response?.data?.message || 'Error al actualizar el permiso';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar multiples permisos de un rol (batch)
 */
export function useActualizarPermisosRolBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rolId, permisos }: ActualizarPermisosBatchParams) =>
      rolesApi.actualizarPermisosBatch(rolId, permisos),
    onSuccess: (_: unknown, { rolId }: ActualizarPermisosBatchParams) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolId), refetchType: 'active' });
      toast.success('Permisos actualizados exitosamente');
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      const message = apiError.response?.data?.message || 'Error al actualizar los permisos';
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
    mutationFn: ({ rolDestinoId, rolOrigenId }: CopiarPermisosParams) =>
      rolesApi.copiarPermisos(rolDestinoId, rolOrigenId),
    onSuccess: (_: unknown, { rolDestinoId }: CopiarPermisosParams) => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.permisos(rolDestinoId), refetchType: 'active' });
      toast.success('Permisos copiados exitosamente');
    },
    onError: (error: Error) => {
      const apiError = error as ApiError;
      const message = apiError.response?.data?.message || 'Error al copiar los permisos';
      toast.error(message);
    },
  });
}

/**
 * Hook para obtener roles para select (solo activos, sin paginacion)
 */
export function useRolesSelect(options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: rolesKeys.list({ activo: true, limit: 100 }),
    queryFn: async () => {
      const response = await rolesApi.listar({ activo: 'true', limit: 100 });
      const roles: Rol[] = (response as any).data.data || [];
      return roles.map((rol) => ({
        value: rol.id,
        label: rol.nombre,
        codigo: rol.codigo,
        color: rol.color,
        icono: rol.icono,
        nivel_jerarquia: rol.nivel_jerarquia,
        es_rol_sistema: rol.es_rol_sistema,
      }));
    },
    staleTime: STALE_TIMES.STATIC_DATA,
    ...options,
  });
}
