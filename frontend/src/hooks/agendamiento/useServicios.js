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
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { serviciosApi } from '@/services/api/endpoints';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

// ==================== CRUD BÁSICO (via factory) ====================

const sanitizeServicio = createSanitizer([
  'nombre',
  'descripcion',
  'categoria',
  { name: 'duracion_minutos', type: 'number' },
  { name: 'precio', type: 'number' },
  { name: 'comision_profesional', type: 'number' },
]);

const hooks = createCRUDHooks({
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
    create: { 409: 'Ya existe un servicio con ese nombre', 422: 'Uno o más profesionales no existen' },
    update: { 409: 'Ya existe un servicio con ese nombre' },
    delete: { 400: 'No se puede eliminar el servicio (puede tener citas asociadas)' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true, // Evita flash de loading durante paginación
  responseKey: 'servicios',
});

export const useServicios = hooks.useList;
export const useServicio = hooks.useDetail;
export const useCrearServicio = hooks.useCreate;
export const useActualizarServicio = hooks.useUpdate;
export const useEliminarServicio = hooks.useDelete;

// ==================== BÚSQUEDA RÁPIDA ====================

/**
 * Hook para buscar servicios (búsqueda rápida)
 * Similar a useBuscarClientes
 */
export function useBuscarServicios(termino, options = {}) {
  return useQuery({
    queryKey: ['buscar-servicios', termino],
    queryFn: async () => {
      const response = await serviciosApi.buscar({ termino, ...options });
      return response.data.data;
    },
    enabled: termino.length >= 2,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== PROFESIONALES DEL SERVICIO ====================

/**
 * Hook para obtener profesionales del servicio
 */
export function useProfesionalesServicio(servicioId) {
  return useQuery({
    queryKey: ['servicio-profesionales', servicioId],
    queryFn: async () => {
      const response = await serviciosApi.obtenerProfesionales(servicioId);
      return response.data.data;
    },
    enabled: !!servicioId,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para asignar profesional al servicio
 */
export function useAsignarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ servicioId, profesionalId, configuracion = {} }) => {
      const response = await serviciosApi.asignarProfesional(servicioId, {
        profesional_id: profesionalId,
        configuracion,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidar cache del lado de servicios
      queryClient.invalidateQueries({
        queryKey: ['servicio-profesionales', variables.servicioId],
        exact: true
      });
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-dashboard'], exact: true });

      // Resetear cache del lado de profesionales (bidireccional)
      queryClient.resetQueries({
        queryKey: ['profesional-servicios', variables.profesionalId],
        exact: true
      });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-asignaciones'], exact: true });
    },
    onError: createCRUDErrorHandler('create', 'Asignacion de profesional'),
  });
}

/**
 * Hook para desasignar profesional del servicio
 */
export function useDesasignarProfesional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ servicioId, profesionalId }) => {
      await serviciosApi.desasignarProfesional(servicioId, profesionalId);
      return { servicioId, profesionalId };
    },
    onSuccess: (data) => {
      // Invalidar cache del lado de servicios
      queryClient.invalidateQueries({
        queryKey: ['servicio-profesionales', data.servicioId],
        exact: true
      });
      queryClient.invalidateQueries({ queryKey: ['servicios'] });
      queryClient.invalidateQueries({ queryKey: ['servicios-dashboard'], exact: true });

      // Resetear cache del lado de profesionales (bidireccional)
      queryClient.resetQueries({
        queryKey: ['profesional-servicios', data.profesionalId],
        exact: true
      });
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      queryClient.invalidateQueries({ queryKey: ['estadisticas-asignaciones'], exact: true });
    },
    onError: createCRUDErrorHandler('delete', 'Asignacion de profesional'),
  });
}
