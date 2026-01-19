/**
 * Queries - Períodos Contables
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { contabilidadApi } from '@/services/api/endpoints';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Helper para sanitizar parámetros
 */
const sanitizeParams = (params) =>
  Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

/**
 * Hook para listar períodos contables
 * @param {Object} params - { anio? }
 * @returns {Object} { data, isLoading, error }
 */
export function usePeriodosContables(params = {}) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.periodos.list(params),
    queryFn: async () => {
      const sanitizedParams = sanitizeParams(params);
      const response = await contabilidadApi.listarPeriodos(sanitizedParams);
      return response.data?.data || [];
    },
    staleTime: STALE_TIMES.STATIC_DATA,
  });
}
