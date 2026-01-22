/**
 * ====================================================================
 * HOOKS: PLANES DE SUSCRIPCIÓN
 * ====================================================================
 * Hooks CRUD para gestión de planes usando factory.
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories/createCRUDHooks';
import { QUERY_KEYS } from './constants';

// Sanitizador para planes
const sanitizePlan = createSanitizer([
  'nombre',
  'descripcion',
  { name: 'precio', type: 'number' },
  { name: 'dias_prueba', type: 'number' },
  { name: 'activo', type: 'boolean' },
]);

// Hooks CRUD base
const planesHooks = createCRUDHooks({
  name: 'plan',
  namePlural: 'planes',
  api: suscripcionesNegocioApi,
  baseKey: QUERY_KEYS.PLANES,
  apiMethods: {
    list: 'listarPlanes',
    get: 'obtenerPlan',
    create: 'crearPlan',
    update: 'actualizarPlan',
    delete: 'eliminarPlan',
  },
  sanitize: sanitizePlan,
  staleTime: STALE_TIMES.SEMI_STATIC,
  usePreviousData: true,
  transformList: (data, pagination) => ({
    items: data?.items || data?.planes || data || [],
    total: pagination?.total || data?.total || 0,
    paginacion: pagination,
  }),
  errorMessages: {
    create: { 409: 'Ya existe un plan con ese nombre' },
    delete: { 409: 'No se puede eliminar: tiene suscripciones activas' },
  },
});

// Re-exportar hooks base
export const usePlanes = planesHooks.useList;
export const usePlan = planesHooks.useDetail;
export const useCrearPlan = planesHooks.useCreate;
export const useActualizarPlan = planesHooks.useUpdate;
export const useEliminarPlan = planesHooks.useDelete;

/**
 * Hook para listar planes activos (sin paginación)
 */
export function usePlanesActivos() {
  return useQuery({
    queryKey: [QUERY_KEYS.PLANES, 'activos'],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.listarPlanesActivos();
      return response.data?.data?.planes || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para contar suscripciones activas de un plan
 * @param {number} planId - ID del plan
 */
export function useSuscripcionesActivasPlan(planId) {
  return useQuery({
    queryKey: [QUERY_KEYS.PLAN, planId, 'suscripciones-activas'],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.contarSuscripcionesPlan(planId);
      return response.data?.data?.total_suscripciones_activas || 0;
    },
    enabled: !!planId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export default {
  usePlanes,
  usePlan,
  useCrearPlan,
  useActualizarPlan,
  useEliminarPlan,
  usePlanesActivos,
  useSuscripcionesActivasPlan,
};
