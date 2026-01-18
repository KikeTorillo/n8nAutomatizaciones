import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';

/**
 * Hook para buscar citas por código o cliente
 * @param {string} termino - Término de búsqueda
 */
export function useBuscarCitas(termino) {
  return useQuery({
    queryKey: ['citas', 'buscar', termino],
    queryFn: async () => {
      const response = await citasApi.listar({ busqueda: termino });
      return response.data?.data?.citas || [];
    },
    enabled: termino && termino.length >= 2,
    staleTime: STALE_TIMES.FREQUENT,
  });
}

/**
 * Hook para obtener citas de un profesional en un rango de fechas
 * @param {Object} params - { profesional_id, fecha_desde, fecha_hasta }
 */
export function useCitasPorProfesional(params) {
  return useQuery({
    queryKey: ['citas', 'profesional', params],
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
    queryKey: ['citas', 'cliente', clienteId],
    queryFn: async () => {
      const response = await citasApi.listar({ cliente_id: clienteId });
      return response.data?.data?.citas || [];
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}
