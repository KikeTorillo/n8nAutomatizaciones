import { useQuery } from '@tanstack/react-query';
import { eventosDigitalesApi } from '@/services/api/modules';
import { EVENTO_QUERY_KEYS } from './helpers';

/**
 * Hook para obtener stats de check-in de un evento
 * Reemplaza el fetch manual con useState+useEffect en EventoDetailPage
 */
export function useCheckinStats(eventoId) {
  return useQuery({
    queryKey: EVENTO_QUERY_KEYS.checkinStats(eventoId),
    queryFn: async () => {
      const response = await eventosDigitalesApi.obtenerCheckinStats(eventoId);
      return response.data?.data || null;
    },
    enabled: !!eventoId,
    staleTime: 60 * 1000,
  });
}
