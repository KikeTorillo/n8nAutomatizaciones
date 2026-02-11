/**
 * ====================================================================
 * HOOKS CRUD SERVICIOS
 * ====================================================================
 *
 * Migrado parcialmente a factory - Ene 2026
 * - CRUD básico: via createCRUDHooks
 * - Hooks relacionales (profesionales): manuales
 *
 * Reducción: 262 → ~130 LOC
 * Feb 2026 - Migración TypeScript
 * ====================================================================
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { serviciosApi } from '@/services/api/endpoints';
import {
  createCRUDHooks,
  createSanitizer,
  createSearchHook,
} from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { Servicio } from '@/types/entities';
import type { Profesional } from '@/types/entities';

// ==================== Tipos ====================

interface CrearServicioData {
  nombre: string;
  descripcion?: string;
  precio?: number;
  duracion_minutos?: number;
  categoria?: string;
  comision_profesional?: number;
}

type ActualizarServicioData = Partial<CrearServicioData>;

interface AsignarProfesionalVariables {
  servicioId: number;
  profesionalId: number;
  configuracion?: Record<string, unknown>;
}

interface DesasignarProfesionalVariables {
  servicioId: number;
  profesionalId: number;
}

// ==================== CRUD BÁSICO (via factory) ====================

const sanitizeServicio = createSanitizer([
  'nombre',
  'descripcion',
  'categoria',
  { name: 'duracion_minutos', type: 'number' },
  { name: 'precio', type: 'number' },
  { name: 'comision_profesional', type: 'number' },
]);

const hooks = createCRUDHooks<
  Servicio,
  CrearServicioData,
  ActualizarServicioData
>({
  name: 'servicio',
  namePlural: 'servicios',
  api: serviciosApi,
  baseKey: 'servicios',
  apiMethods: {
    list: 'listar',
    get: 'obtener',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: sanitizeServicio,
  invalidateOnCreate: ['servicios', 'servicios-dashboard', 'estadisticas'],
  invalidateOnUpdate: ['servicios', 'servicios-dashboard'],
  invalidateOnDelete: ['servicios', 'servicios-dashboard', 'estadisticas'],
  errorMessages: {
    create: {
      409: 'Ya existe un servicio con ese nombre',
      422: 'Uno o más profesionales no existen',
    },
    update: { 409: 'Ya existe un servicio con ese nombre' },
    delete: {
      400: 'No se puede eliminar el servicio (puede tener citas asociadas)',
    },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true,
  responseKey: 'servicios',
});

export const useServicios = hooks.useList;
export const useServicio = hooks.useDetail;
export const useCrearServicio = hooks.useCreate;
export const useActualizarServicio = hooks.useUpdate;
export const useEliminarServicio = hooks.useDelete;

// ==================== BÚSQUEDA RÁPIDA ====================

export const useBuscarServicios = createSearchHook<Servicio>({
  key: 'servicios',
  searchFn: serviciosApi.buscar,
  searchParam: 'termino',
  staleTime: STALE_TIMES.REAL_TIME,
});

// ==================== PROFESIONALES DEL SERVICIO ====================

export function useProfesionalesServicio(
  servicioId: number | null | undefined
): UseQueryResult<Profesional[]> {
  return useQuery({
    queryKey: [
      ...queryKeys.agendamiento.servicios.all,
      'profesionales',
      servicioId,
    ],
    queryFn: async () => {
      const response = await serviciosApi.obtenerProfesionales(servicioId!);
      return (response as any).data.data;
    },
    enabled: !!servicioId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

export function useAsignarProfesional(): UseMutationResult<
  Profesional,
  Error,
  AsignarProfesionalVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servicioId,
      profesionalId,
      configuracion = {},
    }: AsignarProfesionalVariables) => {
      const response = await serviciosApi.asignarProfesional(servicioId, {
        profesional_id: profesionalId,
        configuracion,
      });
      return (response as any).data.data;
    },
    onSuccess: (_: Profesional, variables: AsignarProfesionalVariables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.agendamiento.servicios.all,
          'profesionales',
          variables.servicioId,
        ],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.servicios.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.estadisticas.serviciosDashboard,
        exact: true,
        refetchType: 'active',
      });

      queryClient.resetQueries({
        queryKey: queryKeys.agendamiento.servicios.porProfesional(
          variables.profesionalId
        ),
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.estadisticas.asignaciones,
        exact: true,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('create', 'Asignacion de profesional'),
  });
}

export function useDesasignarProfesional(): UseMutationResult<
  DesasignarProfesionalVariables,
  Error,
  DesasignarProfesionalVariables
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servicioId,
      profesionalId,
    }: DesasignarProfesionalVariables) => {
      await serviciosApi.desasignarProfesional(servicioId, profesionalId);
      return { servicioId, profesionalId };
    },
    onSuccess: (data: DesasignarProfesionalVariables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.agendamiento.servicios.all,
          'profesionales',
          data.servicioId,
        ],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.agendamiento.servicios.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.estadisticas.serviciosDashboard,
        exact: true,
        refetchType: 'active',
      });

      queryClient.resetQueries({
        queryKey: queryKeys.agendamiento.servicios.porProfesional(
          data.profesionalId
        ),
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.personas.profesionales.all,
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.estadisticas.asignaciones,
        exact: true,
        refetchType: 'active',
      });
    },
    onError: createCRUDErrorHandler('delete', 'Asignacion de profesional'),
  });
}
