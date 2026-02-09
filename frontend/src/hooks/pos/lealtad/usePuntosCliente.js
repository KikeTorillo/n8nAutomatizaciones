/**
 * Hooks para puntos del cliente (uso en POS)
 * Extraído de useLealtad.js — Feb 2026
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { queryKeys } from '@/hooks/config';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para obtener puntos de un cliente
 * GET /pos/lealtad/clientes/:clienteId/puntos
 * @param {number} clienteId
 */
export function usePuntosCliente(clienteId) {
  return useQuery({
    queryKey: queryKeys.pos.lealtad.puntos(clienteId),
    queryFn: async () => {
      const response = await posApi.obtenerPuntosCliente(clienteId);
      return response.data.data;
    },
    enabled: !!clienteId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para calcular puntos que ganaría una venta (preview)
 * POST /pos/lealtad/calcular
 * @returns mutation con { mutateAsync, isLoading, ... }
 */
export function useCalcularPuntos() {
  return useMutation({
    mutationFn: async ({ clienteId, monto, tieneCupon }) => {
      const response = await posApi.calcularPuntosVenta({
        cliente_id: clienteId,
        monto,
        tiene_cupon: tieneCupon,
      });
      return response.data.data;
    },
    onError: createCRUDErrorHandler('fetch', 'Puntos'),
  });
}

/**
 * Hook para validar canje de puntos (preview)
 * POST /pos/lealtad/validar-canje
 * @returns mutation con { mutateAsync, isLoading, ... }
 */
export function useValidarCanje() {
  return useMutation({
    mutationFn: async ({ clienteId, puntos, totalVenta }) => {
      const response = await posApi.validarCanjePuntos({
        cliente_id: clienteId,
        puntos,
        total_venta: totalVenta,
      });
      return response.data.data;
    },
    onError: createCRUDErrorHandler('fetch', 'Validación de canje'),
  });
}

/**
 * Hook para canjear puntos por descuento
 * POST /pos/lealtad/canjear
 */
export function useCanjearPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, ventaId, puntos, descuento, descripcion }) => {
      const response = await posApi.canjearPuntos({
        cliente_id: clienteId,
        venta_id: ventaId,
        puntos,
        descuento,
        descripcion,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.puntos(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.pos.lealtad.historialBase, variables.clienteId], refetchType: 'active' });
      if (variables.ventaId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.ventaId), refetchType: 'active' });
      }
    },
    onError: createCRUDErrorHandler('create', 'Canje de puntos', { 400: 'Puntos insuficientes o canje no válido' }),
  });
}

/**
 * Hook para acumular puntos por una venta
 * POST /pos/lealtad/acumular
 */
export function useAcumularPuntos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clienteId, ventaId, monto, descripcion }) => {
      const response = await posApi.acumularPuntos({
        cliente_id: clienteId,
        venta_id: ventaId,
        monto,
        descripcion,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.lealtad.puntos(variables.clienteId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.pos.lealtad.historialBase, variables.clienteId], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Acumulación de puntos'),
  });
}
