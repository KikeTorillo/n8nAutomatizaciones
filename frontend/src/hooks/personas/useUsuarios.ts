/**
 * ====================================================================
 * HOOK - useUsuarios
 * ====================================================================
 *
 * Hook para gestión de usuarios
 * Fase 5.2 - Diciembre 2025
 * Feb 2026 - Migración a createCRUDHooks factory
 *
 * Modelo:
 * - Usuario = acceso al sistema
 * - Profesional = datos laborales
 * - Relación 1:1 opcional
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { usuariosApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
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

/** Respuesta API genérica de AxiosResponse wrapping ApiResponse */
interface AxiosApiResponse<T> {
  data: { data: T };
}

/** Profesional sin usuario vinculado (datos parciales del selector) */
interface ProfesionalSinUsuario {
  id: number;
  nombre: string;
  apellidos?: string;
  email?: string;
  puesto?: string;
  departamento?: string;
  [key: string]: unknown;
}

/** Usuario sin profesional vinculado (datos parciales) */
interface UsuarioSinProfesional {
  id: number;
  nombre: string;
  apellidos?: string;
  email: string;
  rol: RolUsuario;
  [key: string]: unknown;
}

/** Ubicación disponible para asignar */
interface UbicacionDisponible {
  id: number;
  nombre: string;
  codigo?: string;
  sucursal_id?: number;
  sucursal_nombre?: string;
  [key: string]: unknown;
}

export interface ListarUsuariosParams {
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
// FACTORY CRUD - Feb 2026
// ====================================================================

// Sanitizador para datos de usuario
const sanitizeUsuario = createSanitizer([
  'nombre',
  'apellidos',
  'email',
  'telefono',
  { name: 'profesional_id', type: 'id' },
]);

const usuariosCRUD = createCRUDHooks<
  UsuarioListData, // TEntity (list retorna UsuarioListData)
  CrearUsuarioData, // TCreate
  ActualizarUsuarioData // TUpdate
>({
  name: 'usuario',
  namePlural: 'usuarios',
  api: usuariosApi,
  baseKey: 'usuarios',
  apiMethods: {
    list: 'listarConFiltros',
    get: 'obtener',
    create: 'crearDirecto',
    update: 'actualizar',
    delete: 'actualizar', // dummy, no se usa
  },
  invalidateOnCreate: ['usuarios', 'profesionales-sin-usuario'],
  invalidateOnUpdate: ['usuarios'],
  sanitize: sanitizeUsuario as (data: unknown) => unknown,
  errorMessages: {
    create: { 409: 'Ya existe un usuario con ese email' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

// ====================================================================
// QUERIES CRUD - Re-exports desde factory
// ====================================================================

export const useUsuarios = usuariosCRUD.useList;
export const useUsuario = usuariosCRUD.useDetail;

// ====================================================================
// QUERIES ESPECIALIZADAS
// ====================================================================

export function useProfesionalesSinUsuario(): UseQueryResult<
  ProfesionalSinUsuario[]
> {
  return useQuery({
    queryKey: queryKeys.personas.usuarios.profesionalesSinUsuario,
    queryFn: async () => {
      const response = await usuariosApi.profesionalesDisponibles();
      return (
        (response as AxiosApiResponse<ProfesionalSinUsuario[]>).data.data || []
      );
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

export function useUsuariosSinProfesional(): UseQueryResult<
  UsuarioSinProfesional[]
> {
  return useQuery({
    queryKey: queryKeys.personas.usuarios.usuariosSinProfesional,
    queryFn: async () => {
      const response = await usuariosApi.sinProfesional();
      return (
        (response as AxiosApiResponse<UsuarioSinProfesional[]>).data.data || []
      );
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

// ====================================================================
// MUTATIONS CRUD - Re-exports desde factory
// ====================================================================

export const useCrearUsuarioDirecto = usuariosCRUD.useCreate;
export const useActualizarUsuario = usuariosCRUD.useUpdate;

// ====================================================================
// MUTATIONS ESPECIALIZADAS
// ====================================================================

export function useCambiarEstadoUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }: CambiarEstadoParams) => {
      const response = await usuariosApi.cambiarEstado(id, activo);
      return (response as AxiosApiResponse<CambiarEstadoResult>).data.data;
    },
    onSuccess: (data: CambiarEstadoResult) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.detail(data.usuario?.id),
        refetchType: 'active',
      });
      // Si afectó un profesional, invalidar también
      if (data.profesional) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.personas.profesionales.all,
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.personas.profesionales.detail(
            data.profesional.id
          ),
          refetchType: 'active',
        });
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
      return (response as AxiosApiResponse<CambiarRolResult>).data.data;
    },
    onSuccess: (data: CambiarRolResult) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.detail(data.usuario?.id),
        refetchType: 'active',
      });
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
      return (response as AxiosApiResponse<VincularProfesionalResult>).data
        .data;
    },
    onSuccess: (data: VincularProfesionalResult) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.detail(data.usuario?.id),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.profesionalesSinUsuario,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.all,
        refetchType: 'active',
      });
      if (data.profesional) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.personas.profesionales.detail(
            data.profesional.id
          ),
          refetchType: 'active',
        });
      }
      if (data.profesional_anterior) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.personas.profesionales.detail(
            data.profesional_anterior
          ),
          refetchType: 'active',
        });
      }
    },
    onError: createCRUDErrorHandler('update', 'Usuario', {
      409: 'El profesional ya está vinculado a otro usuario',
    }),
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

export function useUbicacionesUsuario(
  usuarioId: number | undefined | null
): UseQueryResult<AsignacionUbicacion[]> {
  return useQuery({
    queryKey: queryKeys.personas.usuarios.ubicaciones(usuarioId),
    queryFn: async () => {
      const response = await usuariosApi.obtenerUbicaciones(usuarioId!);
      return (
        (response as AxiosApiResponse<AsignacionUbicacion[]>).data.data || []
      );
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

export function useUbicacionesDisponiblesUsuario(
  usuarioId: number | undefined | null
): UseQueryResult<UbicacionDisponible[]> {
  return useQuery({
    queryKey: queryKeys.personas.usuarios.ubicacionesDisponibles(usuarioId),
    queryFn: async () => {
      const response = await usuariosApi.ubicacionesDisponibles(usuarioId!);
      return (
        (response as AxiosApiResponse<UbicacionDisponible[]>).data.data || []
      );
    },
    enabled: !!usuarioId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useAsignarUbicacionUsuario(): UseMutationResult<
  AsignacionUbicacion,
  Error,
  AsignarUbicacionParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ usuarioId, data }: AsignarUbicacionParams) => {
      const response = await usuariosApi.asignarUbicacion(usuarioId, data);
      return (response as AxiosApiResponse<AsignacionUbicacion>).data.data;
    },
    onSuccess: (
      _data: AsignacionUbicacion,
      variables: AsignarUbicacionParams
    ) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.ubicaciones(variables.usuarioId),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.ubicacionesDisponibles(
          variables.usuarioId
        ),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Asignación de ubicación', {
      400: 'El usuario no está asignado a la sucursal de esta ubicación',
    }),
  });
}

export function useActualizarAsignacionUbicacion(): UseMutationResult<
  AsignacionUbicacion,
  Error,
  ActualizarAsignacionParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      usuarioId,
      ubicacionId,
      data,
    }: ActualizarAsignacionParams) => {
      const response = await usuariosApi.actualizarAsignacionUbicacion(
        usuarioId,
        ubicacionId,
        data
      );
      return (response as AxiosApiResponse<AsignacionUbicacion>).data.data;
    },
    onSuccess: (
      _data: AsignacionUbicacion,
      variables: ActualizarAsignacionParams
    ) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.ubicaciones(variables.usuarioId),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('update', 'Asignación de ubicación'),
  });
}

export function useDesasignarUbicacionUsuario(): UseMutationResult<
  unknown,
  Error,
  DesasignarUbicacionParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      usuarioId,
      ubicacionId,
    }: DesasignarUbicacionParams) => {
      const response = await usuariosApi.desasignarUbicacion(
        usuarioId,
        ubicacionId
      );
      return (response as AxiosApiResponse<unknown>).data.data;
    },
    onSuccess: (_data: unknown, variables: DesasignarUbicacionParams) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.ubicaciones(variables.usuarioId),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.usuarios.ubicacionesDisponibles(
          variables.usuarioId
        ),
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('delete', 'Asignación de ubicación'),
  });
}
