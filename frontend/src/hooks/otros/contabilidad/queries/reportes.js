/**
 * Queries - Reportes Financieros
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { contabilidadApi } from '@/services/api/endpoints';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para obtener Balanza de Comprobación
 * @param {number} periodoId
 * @returns {Object} { data, isLoading, error }
 */
export function useBalanzaComprobacion(periodoId) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.reportes.balanza(periodoId),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerBalanza(periodoId);
      return response.data?.data;
    },
    enabled: !!periodoId,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener Libro Mayor de una cuenta
 * @param {number} cuentaId
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @returns {Object} { data, isLoading, error }
 */
export function useLibroMayor(cuentaId, fechaInicio, fechaFin) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.reportes.libroMayor(cuentaId, fechaInicio, fechaFin),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerLibroMayor(cuentaId, fechaInicio, fechaFin);
      return response.data?.data;
    },
    enabled: !!cuentaId && !!fechaInicio && !!fechaFin,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener Estado de Resultados
 * @param {string} fechaInicio - YYYY-MM-DD
 * @param {string} fechaFin - YYYY-MM-DD
 * @returns {Object} { data, isLoading, error }
 */
export function useEstadoResultados(fechaInicio, fechaFin) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.reportes.estadoResultados(fechaInicio, fechaFin),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerEstadoResultados(fechaInicio, fechaFin);
      return response.data?.data;
    },
    enabled: !!fechaInicio && !!fechaFin,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para obtener Balance General
 * @param {string} fecha - YYYY-MM-DD
 * @returns {Object} { data, isLoading, error }
 */
export function useBalanceGeneral(fecha) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.reportes.balanceGeneral(fecha),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerBalanceGeneral(fecha);
      return response.data?.data;
    },
    enabled: !!fecha,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
