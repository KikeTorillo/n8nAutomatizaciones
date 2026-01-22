/**
 * ====================================================================
 * HOOKS: MÉTRICAS SAAS
 * ====================================================================
 * Hooks para obtener métricas de suscripciones (MRR, Churn, LTV, etc.)
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { suscripcionesNegocioApi } from '@/services/api/modules';
import { sanitizeParams } from '@/lib/params';
import { QUERY_KEYS } from './constants';

/**
 * Hook para obtener dashboard completo de métricas
 * @param {Object} params - { anio, mes }
 */
export function useMetricasDashboard(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_DASHBOARD, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerDashboardMetricas(sanitized);
      return response.data?.data || {};
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto - dashboard debe estar actualizado
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
}

/**
 * Hook para calcular MRR (Monthly Recurring Revenue)
 * @param {Object} params - { fecha }
 */
export function useMRR(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_MRR, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.calcularMRR(sanitized);
      return response.data?.data || { mrr: 0 };
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para calcular ARR (Annual Recurring Revenue)
 * @param {Object} params - { fecha }
 */
export function useARR(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_ARR, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.calcularARR(sanitized);
      return response.data?.data || { arr: 0 };
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para calcular Churn Rate
 * @param {Object} params - { anio, mes }
 */
export function useChurnRate(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_CHURN, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.calcularChurnRate(sanitized);
      return response.data?.data || { churn_rate: 0 };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para calcular LTV (Lifetime Value)
 */
export function useLTV() {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_LTV],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.calcularLTV();
      return response.data?.data || { ltv: 0 };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener suscriptores activos
 * @param {Object} params - { fecha }
 */
export function useSuscriptoresActivos(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_SUSCRIPTORES, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerSuscriptoresActivos(sanitized);
      return response.data?.data || { suscriptores_activos: 0 };
    },
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para obtener crecimiento mensual de MRR
 * @param {Object} params - { anio, mes }
 */
export function useCrecimientoMensual(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_CRECIMIENTO, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerCrecimientoMensual(sanitized);
      return response.data?.data || { crecimiento: 0 };
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener distribución de suscriptores por estado
 */
export function useDistribucionEstado() {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_DISTRIBUCION],
    queryFn: async () => {
      const response = await suscripcionesNegocioApi.obtenerDistribucionEstado();
      return response.data?.data?.distribucion || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener top planes más populares
 * @param {Object} params - { limite }
 */
export function useTopPlanes(params = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_TOP_PLANES, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerTopPlanes(sanitized);
      return response.data?.data?.planes || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener evolución de MRR (últimos N meses)
 * @param {Object} params - { meses }
 */
export function useEvolucionMRR(params = { meses: 12 }) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_EVOLUCION_MRR, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerEvolucionMRR(sanitized);
      return response.data?.data?.evolucion || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos - histórico
  });
}

/**
 * Hook para obtener evolución de Churn Rate
 * @param {Object} params - { meses }
 */
export function useEvolucionChurn(params = { meses: 12 }) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_EVOLUCION_CHURN, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerEvolucionChurn(sanitized);
      return response.data?.data?.evolucion || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

/**
 * Hook para obtener evolución de suscriptores
 * @param {Object} params - { meses }
 */
export function useEvolucionSuscriptores(params = { meses: 12 }) {
  return useQuery({
    queryKey: [QUERY_KEYS.METRICAS_EVOLUCION_SUSCRIPTORES, params],
    queryFn: async () => {
      const sanitized = sanitizeParams(params);
      const response = await suscripcionesNegocioApi.obtenerEvolucionSuscriptores(sanitized);
      return response.data?.data?.evolucion || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}

export default {
  useMetricasDashboard,
  useMRR,
  useARR,
  useChurnRate,
  useLTV,
  useSuscriptoresActivos,
  useCrecimientoMensual,
  useDistribucionEstado,
  useTopPlanes,
  useEvolucionMRR,
  useEvolucionChurn,
  useEvolucionSuscriptores,
};
