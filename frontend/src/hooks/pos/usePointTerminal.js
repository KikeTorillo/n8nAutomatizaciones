/**
 * usePointTerminal.js - Hooks para integración con MercadoPago Point Terminal
 *
 * Feb 2026: Soporte para pagos via terminal Point (Orders API).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';

const POINT_QUERY_KEYS = {
  TERMINALES: 'pos-point-terminales',
  ORDEN: 'pos-point-orden',
};

const ESTADOS_FINALES = ['processed', 'canceled', 'failed', 'expired'];

/**
 * Listar terminales Point disponibles
 */
export function useListarTerminales(options = {}) {
  return useQuery({
    queryKey: [POINT_QUERY_KEYS.TERMINALES],
    queryFn: async () => {
      const res = await posApi.listarTerminales();
      return res.data?.data || res.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 min
    ...options,
  });
}

/**
 * Crear orden de pago en terminal Point
 */
export function useCrearOrdenPoint() {
  return useMutation({
    mutationFn: async (data) => {
      const res = await posApi.crearOrdenPoint(data);
      return res.data?.data || res.data;
    },
  });
}

/**
 * Cancelar orden Point
 */
export function useCancelarOrdenPoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      const res = await posApi.cancelarOrdenPoint(orderId);
      return res.data?.data || res.data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: [POINT_QUERY_KEYS.ORDEN, orderId] });
    },
  });
}

/**
 * Polling del estado de una orden Point
 * Auto-stop en estados finales: processed, canceled, failed, expired
 */
export function usePollingOrdenPoint(orderId, enabled = false) {
  const query = useQuery({
    queryKey: [POINT_QUERY_KEYS.ORDEN, orderId],
    queryFn: async () => {
      const res = await posApi.obtenerOrdenPoint(orderId);
      return res.data?.data || res.data;
    },
    enabled: !!orderId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && ESTADOS_FINALES.includes(data.status)) {
        return false; // Stop polling
      }
      return 3000; // Poll every 3 seconds
    },
    refetchIntervalInBackground: true,
  });

  const status = query.data?.status;
  const isCompleted = status === 'processed';
  const isFailed = ['failed', 'canceled', 'expired'].includes(status);
  const isPolling = enabled && !!orderId && !isCompleted && !isFailed;

  return {
    orden: query.data,
    status,
    isPolling,
    isCompleted,
    isFailed,
    isLoading: query.isLoading,
    error: query.error,
  };
}
