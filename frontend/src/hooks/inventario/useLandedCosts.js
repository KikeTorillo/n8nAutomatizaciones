/**
 * Hook para Landed Costs (Costos en Destino)
 * CRUD de costos adicionales y distribucion
 * Fecha: 30 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landedCostsApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

// ==================== QUERIES ====================

/**
 * Hook para listar costos adicionales de una OC
 * @param {number} ordenCompraId
 */
export function useCostosAdicionales(ordenCompraId) {
  return useQuery({
    queryKey: ['landed-costs', ordenCompraId],
    queryFn: async () => {
      const response = await landedCostsApi.listar(ordenCompraId);
      return response.data.data;
    },
    enabled: !!ordenCompraId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para obtener resumen de costos de una OC
 * @param {number} ordenCompraId
 */
export function useResumenCostos(ordenCompraId) {
  return useQuery({
    queryKey: ['landed-costs', ordenCompraId, 'resumen'],
    queryFn: async () => {
      const response = await landedCostsApi.obtenerResumen(ordenCompraId);
      return response.data.data;
    },
    enabled: !!ordenCompraId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para obtener detalle de distribucion
 * @param {number} ordenCompraId
 * @param {number} costoId
 */
export function useDistribucionCosto(ordenCompraId, costoId) {
  return useQuery({
    queryKey: ['landed-costs', ordenCompraId, 'distribucion', costoId],
    queryFn: async () => {
      const response = await landedCostsApi.obtenerDistribucion(ordenCompraId, costoId);
      return response.data.data;
    },
    enabled: !!ordenCompraId && !!costoId,
  });
}

/**
 * Hook para obtener costos por items
 * @param {number} ordenCompraId
 */
export function useCostosPorItems(ordenCompraId) {
  return useQuery({
    queryKey: ['landed-costs', ordenCompraId, 'por-items'],
    queryFn: async () => {
      const response = await landedCostsApi.obtenerCostosPorItems(ordenCompraId);
      return response.data.data;
    },
    enabled: !!ordenCompraId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear costo adicional
 */
export function useCrearCostoAdicional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordenCompraId, data }) => landedCostsApi.crear(ordenCompraId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landed-costs', variables.ordenCompraId] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra', variables.ordenCompraId] });
    },
  });
}

/**
 * Hook para actualizar costo adicional
 */
export function useActualizarCostoAdicional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordenCompraId, costoId, data }) =>
      landedCostsApi.actualizar(ordenCompraId, costoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landed-costs', variables.ordenCompraId] });
    },
  });
}

/**
 * Hook para eliminar costo adicional
 */
export function useEliminarCostoAdicional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordenCompraId, costoId }) => landedCostsApi.eliminar(ordenCompraId, costoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landed-costs', variables.ordenCompraId] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra', variables.ordenCompraId] });
    },
  });
}

/**
 * Hook para distribuir un costo adicional
 */
export function useDistribuirCosto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ordenCompraId, costoId }) => landedCostsApi.distribuir(ordenCompraId, costoId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['landed-costs', variables.ordenCompraId] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra', variables.ordenCompraId] });
    },
  });
}

/**
 * Hook para distribuir todos los costos pendientes
 */
export function useDistribuirTodosCostos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ordenCompraId) => landedCostsApi.distribuirTodos(ordenCompraId),
    onSuccess: (_, ordenCompraId) => {
      queryClient.invalidateQueries({ queryKey: ['landed-costs', ordenCompraId] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra', ordenCompraId] });
    },
  });
}
