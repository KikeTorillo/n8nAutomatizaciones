/**
 * Queries - Asientos Contables
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
 * Hook para listar asientos contables
 * @param {Object} params - { estado?, tipo?, periodo_id?, fecha_desde?, fecha_hasta?, busqueda?, pagina?, limite? }
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useAsientosContables(params = {}) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.asientos.list(params),
    queryFn: async () => {
      const sanitizedParams = sanitizeParams(params);
      const response = await contabilidadApi.listarAsientos(sanitizedParams);
      return {
        asientos: response.data?.data?.asientos || [],
        paginacion: response.data?.data?.paginacion || {},
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener asiento por ID
 * @param {number} id
 * @param {string} fecha - YYYY-MM-DD (requerido para tabla particionada)
 * @returns {Object} { data, isLoading, error }
 */
export function useAsiento(id, fecha) {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.asientos.detail(id, fecha),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerAsiento(id, fecha);
      return response.data?.data;
    },
    enabled: !!id && !!fecha,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
