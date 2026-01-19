/**
 * Queries - Dashboard Contabilidad
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { contabilidadApi } from '@/services/api/endpoints';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para obtener dashboard contable
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useDashboardContabilidad() {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.dashboard(),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerDashboard();
      return response.data?.data || {};
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  });
}
