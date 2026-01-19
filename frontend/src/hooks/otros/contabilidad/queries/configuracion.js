/**
 * Queries - Configuración Contable
 */

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { contabilidadApi } from '@/services/api/endpoints';
import { CONTABILIDAD_KEYS } from '../constants';

/**
 * Hook para obtener configuración contable
 * @returns {Object} { data, isLoading, error, refetch }
 */
export function useConfiguracionContable() {
  return useQuery({
    queryKey: CONTABILIDAD_KEYS.configuracion(),
    queryFn: async () => {
      const response = await contabilidadApi.obtenerConfiguracion();
      return response.data?.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
