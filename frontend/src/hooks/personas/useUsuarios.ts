/**
 * ====================================================================
 * HOOK - useUsuarios
 * ====================================================================
 *
 * Hook para gestión de usuarios
 * Fase 5.2 - Diciembre 2025
 *
 * Modelo:
 * - Usuario = acceso al sistema
 * - Profesional = datos laborales
 * - Relación 1:1 opcional
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { usuariosApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { sanitizeParams } from '@/lib/params';
import { queryKeys } from '@/hooks/config';
import type {
  Usuario,
  RolUsuario,
  CrearUsuarioData,
  ActualizarUsuarioData,
  AsignacionUbicacion,
} from '@/types/entities';

// ====================================================================
// TYPES
// ====================================================================

interface ListarUsuariosParams {
  rol?: RolUsuario;
  activo?: boolean;
  buscar?: string;
  page?: number;
  limit?: number;
}

interface UsuarioListData {
  data: Usuario[];
  pagination: {
    total: number;
    pagina: number;
    limite: number;
    paginas: number;
  };
  resumen?: Record<string, unknown>;
}

interface CambiarEstadoParams {
  id: number;
  activo: boolean;
}

interface CambiarEstadoResult {
  usuario?: Usuario;
  profesional?: { id: number; [key: string]: unknown };
}

interface CambiarRolParams {
  id: number;
  rol: RolUsuario;
}

interface CambiarRolResult {
  usuario?: Usuario;
}

interface VincularProfesionalParams {
  id: number;
  profesionalId: number | null;
}

interface VincularProfesionalResult {
  usuario?: Usuario;
  profesional?: { id: number; [key: string]: unknown };
  profesional_anterior?: number;
}

interface ActualizarUsuarioParams {
  id: number;
  data: ActualizarUsuarioData;
}

interface AsignarUbicacionParams {
  usuarioId: number;
  data: {
    ubicacion_id: number;
    es_default?: boolean;
    puede_recibir?: boolean;
    puede_despachar?: boolean;
  };
}

interface ActualizarAsignacionParams {
  usuarioId: number;
  ubicacionId: number;
  data: {
    es_default?: boolean;
    puede_recibir?: boolean;
    puede_despachar?: boolean;
  };
}

interface DesasignarUbicacionParams {
  usuarioId: number;
  ubicacionId: number;
}

// ====================================================================
// QUERIES
// ====================================================================

export function useUsuarios(params: ListarUsuariosParams = {}) {
  return useQuery({
    queryKey: queryKeys.personas.usuarios.list(params),
    queryFn: async () => {
      const response = await usuariosApi.listarConFiltros(sanitizeParams(params));
      // Backend retorna: { success, data: { data: [...], pagination, resumen } }
      return (response as any).data.data as UsuarioListData;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

export function useUsuario(id: number | undefined | null): UseQueryResult<Usuario> {
  return useQuery({
    queryKey: queryKeys.personas.usuarios.detail(id),
    queryFn: async () => {
      const response = await usuariosApi.obtener(id!);
      return (response as any).data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useProfesionalesSinUsuario(): UseQueryResult<unknown[]> {
  return useQuery({
    queryKey: ['profesionales-sin-usuario'],
    queryFn: async () => {
      const response = await usuariosApi.profesionalesDisponibles();
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

export function useUsuariosSinProfesional(): UseQueryResult<unknown[]> {
  return useQuery({
    queryKey: ['usuarios-sin-profesional'],
    queryFn: async () => {
      const response = await usuariosApi.sinProfesional();
      return (response as any).data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

// ====================================================================
// MUTATIONS
// ====================================================================

export function useCrearUsuarioDirecto(): UseMutationResult<Usuario, Error, CrearUsuarioData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CrearUsuarioData) => {
      // Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        apellidos: data.apellidos?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        profesional_id: data.profesional_id || undefined,
      };
      const response = await usuariosApi.crearDirecto(sanitized);
      return (response as any).data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['profesionales-sin-usuario'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Usuario', {
      409: 'Ya existe un usuario con ese email',
    }),
  });
}

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: CambiarEstadoParams) => {
      const response = await usuariosApi.cambiarEstado(id, activo);
      return (response as any).data.data as CambiarEstadoResult;
    },
    onSuccess: (data: CambiarEstadoResult) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.detail(data.usuario?.id), refetchType: 'active' });
      // Si afectó un profesional, invalidar también
      if (data.profesional) {
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.all, refetchType: 'active' });
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.detail(data.profesional.id), refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('update', 'Usuario'),
  });
}

export function useCambiarRolUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rol }: CambiarRolParams) => {
      const response = await usuariosApi.cambiarRol(id, rol);
      return (response as any).data.data as CambiarRolResult;
    },
    onSuccess: (data: CambiarRolResult) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.detail(data.usuario?.id), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Usuario', {
      400: 'Rol no válido',
    }),
  });
}

export function useVincularProfesionalAUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profesionalId }: VincularProfesionalParams) => {
      const response = await usuariosApi.vincularProfesional(id, profesionalId);
      return (response as any).data.data as VincularProfesionalResult;
    },
    onSuccess: (data: VincularProfesionalResult) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.detail(data.usuario?.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['profesionales-sin-usuario'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.all, refetchType: 'active' });
      if (data.profesional) {
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.detail(data.profesional.id), refetchType: 'active' });
      }
      if (data.profesional_anterior) {
        queryClient.invalidateQueries({ queryKey: queryKeys.personas.profesionales.detail(data.profesional_anterior), refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('update', 'Usuario', {
      409: 'El profesional ya está vinculado a otro usuario',
    }),
  });
}

export function useActualizarUsuario(): UseMutationResult<Usuario, Error, ActualizarUsuarioParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: ActualizarUsuarioParams) => {
      const sanitized = {
        ...data,
        apellidos: data.apellidos?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
      };
      const response = await usuariosApi.actualizar(id, sanitized);
      return (response as any).data.data;
    },
    onSuccess: (data: Usuario) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.usuarios.detail(data.id), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Usuario'),
  });
}

// ====================================================================
// CONSTANTES
// ====================================================================

export const ROLES_USUARIO = {
  admin: {
    label: 'Administrador',
    description: 'Acceso total a la organización',
    color: 'purple',
  },
  empleado: {
    label: 'Empleado',
    description: 'Acceso limitado según permisos',
    color: 'green',
  },
} as const;

export const ESTADOS_USUARIO = {
  activo: { label: 'Activo', color: 'green' },
  inactivo: { label: 'Inactivo', color: 'gray' },
} as const;

// ====================================================================
// UBICACIONES DE USUARIO - Ene 2026
// ====================================================================

export function useUbicacionesUsuario(usuarioId: number | undefined | null): UseQueryResult<AsignacionUbicacion[]> {
  return useQuery({
    queryKey: ['usuario-ubicaciones', usuarioId],
    queryFn: async () => {
      const response = await usuariosApi.obtenerUbicaciones(usuarioId!);
      return (response as any).data.data || [];
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useUbicacionesDisponiblesUsuario(usuarioId: number | undefined | null): UseQueryResult<unknown[]> {
  return useQuery({
    queryKey: ['usuario-ubicaciones-disponibles', usuarioId],
    queryFn: async () => {
      const response = await usuariosApi.ubicacionesDisponibles(usuarioId!);
      return (response as any).data.data || [];
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useAsignarUbicacionUsuario(): UseMutationResult<AsignacionUbicacion, Error, AsignarUbicacionParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, data }: AsignarUbicacionParams) => {
      const response = await usuariosApi.asignarUbicacion(usuarioId, data);
      return (response as any).data.data;
    },
    onSuccess: (_data: AsignacionUbicacion, variables: AsignarUbicacionParams) => {
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones', variables.usuarioId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones-disponibles', variables.usuarioId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Asignación de ubicación', {
      400: 'El usuario no está asignado a la sucursal de esta ubicación',
    }),
  });
}

export function useActualizarAsignacionUbicacion(): UseMutationResult<AsignacionUbicacion, Error, ActualizarAsignacionParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, ubicacionId, data }: ActualizarAsignacionParams) => {
      const response = await usuariosApi.actualizarAsignacionUbicacion(usuarioId, ubicacionId, data);
      return (response as any).data.data;
    },
    onSuccess: (_data: AsignacionUbicacion, variables: ActualizarAsignacionParams) => {
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones', variables.usuarioId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Asignación de ubicación'),
  });
}

export function useDesasignarUbicacionUsuario(): UseMutationResult<unknown, Error, DesasignarUbicacionParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, ubicacionId }: DesasignarUbicacionParams) => {
      const response = await usuariosApi.desasignarUbicacion(usuarioId, ubicacionId);
      return (response as any).data.data;
    },
    onSuccess: (_data: unknown, variables: DesasignarUbicacionParams) => {
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones', variables.usuarioId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['usuario-ubicaciones-disponibles', variables.usuarioId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('delete', 'Asignación de ubicación'),
  });
}
