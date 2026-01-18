import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { citasApi } from '@/services/api/endpoints';
import { aFormatoISO } from '@/utils/dateHelpers';
import { sanitizeParams } from '@/lib/params';

/**
 * Hook para listar citas con filtros y paginación
 * @param {Object} params - Filtros: { fecha_desde, fecha_hasta, profesional_id, estado, cliente_id, servicio_id, page, limit }
 * @returns {Object} { data: { citas, meta }, isLoading, error, refetch }
 */
export function useCitas(params = {}) {
  return useQuery({
    queryKey: ['citas', params],
    queryFn: async () => {
      const response = await citasApi.listar(sanitizeParams(params));
      const data = response.data?.data || {};
      return {
        citas: data.citas || [],
        meta: data.meta || {
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        },
      };
    },
    staleTime: STALE_TIMES.DYNAMIC,
    enabled: true,
  });
}

/**
 * Hook para obtener una cita específica por ID
 * @param {number} id - ID de la cita
 */
export function useCita(id) {
  return useQuery({
    queryKey: ['citas', id],
    queryFn: async () => {
      const response = await citasApi.obtener(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener citas del día actual
 */
export function useCitasDelDia() {
  const hoy = aFormatoISO(new Date());

  return useQuery({
    queryKey: ['citas', 'hoy', hoy],
    queryFn: async () => {
      const response = await citasApi.listar({
        fecha_desde: hoy,
        fecha_hasta: hoy,
      });
      return response.data?.data?.citas || [];
    },
    staleTime: STALE_TIMES.FREQUENT,
    refetchInterval: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener citas pendientes
 */
export function useCitasPendientes() {
  return useQuery({
    queryKey: ['citas', 'pendientes'],
    queryFn: async () => {
      const response = await citasApi.listar({ estado: 'pendiente' });
      return response.data?.data?.citas || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}
