/**
 * ====================================================================
 * QUERY HOOKS: SUSCRIPCIONES
 * ====================================================================
 * Hooks de lectura para gestión de suscripciones.
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { sanitizeParams } from '@/lib/params';
import { QUERY_KEYS } from './constants';

/**
 * Hook para listar suscripciones con paginación y filtros
 * @param {Object} params - { page, limit, estado, plan_id, cliente_id, fecha_desde, fecha_hasta }
 */
export function useSuscripciones(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCIONES, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.listarSuscripciones(sanitized);
      const data = response.data?.data;
      const pagination = data?.paginacion || response.data?.pagination || response.data?.meta;

      return {
        items: data?.items || data?.suscripciones || [],
        total: pagination?.total || data?.total || 0,
        paginacion: pagination,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook para obtener suscripción por ID
 * @param {number} id - ID de la suscripción
 */
export function useSuscripcion(id) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCION, id],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerSuscripcion(id);
      return response.data?.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener suscripciones de un cliente
 * @param {number} clienteId - ID del cliente
 */
export function useSuscripcionesCliente(clienteId) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCIONES, 'cliente', clienteId],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.buscarSuscripcionesPorCliente(clienteId);
      return response.data?.data?.suscripciones || [];
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener historial de cambios de una suscripción
 * @param {number} suscripcionId - ID de la suscripción
 */
export function useHistorialSuscripcion(suscripcionId) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUSCRIPCION_HISTORIAL, suscripcionId],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerHistorialSuscripcion(suscripcionId);
      return response.data?.data?.historial || [];
    },
    enabled: !!suscripcionId,
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener mi suscripción activa (página MiPlan)
 * Busca la suscripción activa vinculada a la organización del usuario
 *
 * @param {Object} options - Opciones adicionales para useQuery
 * @param {boolean} options.enabled - Si debe ejecutarse la query (default: true)
 */
export function useMiSuscripcion(options = {}) {
  const { enabled = true, ...restOptions } = options;

  return useQuery({
    queryKey: [QUERY_KEYS.MI_SUSCRIPCION],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerMiSuscripcion();
      return response.data?.data;
    },
    staleTime: STALE_TIMES.DYNAMIC,
    enabled,
    ...restOptions,
  });
}

/**
 * Hook para calcular prorrateo al cambiar de plan
 * Calcula el crédito/cargo que se aplicaría al cambiar de plan
 *
 * @param {number} nuevoPlanId - ID del plan destino
 * @param {Object} options - Opciones adicionales para useQuery
 * @param {boolean} options.enabled - Si debe ejecutarse la query (default: true cuando hay nuevoPlanId)
 */
export function useCalcularProrrateo(nuevoPlanId, options = {}) {
  const { enabled = true, ...restOptions } = options;

  return useQuery({
    queryKey: [QUERY_KEYS.MI_SUSCRIPCION, 'prorrateo', nuevoPlanId],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.calcularProrrateo(nuevoPlanId);
      return response.data?.data;
    },
    staleTime: STALE_TIMES.DYNAMIC,
    enabled: enabled && !!nuevoPlanId,
    ...restOptions,
  });
}
