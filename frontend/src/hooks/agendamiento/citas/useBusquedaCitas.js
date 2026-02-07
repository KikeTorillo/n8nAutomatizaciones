import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';
import { createSearchHook } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para buscar citas por código o cliente
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarCitas = createSearchHook({
  key: 'citas',
  searchFn: citasApi.listar,
  searchParam: 'busqueda',
  transformResponse: (data) => data?.citas || [],
  staleTime: STALE_TIMES.FREQUENT,
});

/**
 * Hook para obtener citas de un profesional en un rango de fechas
 * @param {Object} params - { profesional_id, fecha_desde, fecha_hasta }
 */
export function useCitasPorProfesional(params) {
  return useQuery({
    queryKey: [...queryKeys.agendamiento.citas.all, 'profesional', params],
    queryFn: async () => {
      const response = await citasApi.listar(params);
      return response.data?.data?.citas || [];
    },
    enabled: !!params?.profesional_id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener citas de un cliente
 * @param {number} clienteId - ID del cliente
 */
export function useCitasPorCliente(clienteId) {
  return useQuery({
    queryKey: queryKeys.agendamiento.citasCliente(clienteId),
    queryFn: async () => {
      const response = await citasApi.listar({ cliente_id: clienteId });
      return response.data?.data?.citas || [];
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}
