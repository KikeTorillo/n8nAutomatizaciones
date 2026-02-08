/**
 * ====================================================================
 * HOOKS: Liquidaciones de Consigna
 * ====================================================================
 * Queries y mutations para liquidaciones de consignacion
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { consignaApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONSIGNA_KEYS } from './consignaKeys';

// ==================== QUERIES ====================

/**
 * Hook para listar liquidaciones
 * @param {Object} filtros - { acuerdo_id?, proveedor_id?, estado?, limit?, offset? }
 */
export function useLiquidacionesConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.liquidacionesList(filtros),
    queryFn: async () => {
      const response = await consignaApi.listarLiquidaciones(filtros);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener liquidacion con detalle
 * @param {number} id - ID de la liquidacion
 */
export function useLiquidacionConsigna(id) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.liquidacionDetail(id),
    queryFn: async () => {
      const response = await consignaApi.obtenerLiquidacion(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para generar liquidacion
 */
export function useGenerarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => consignaApi.generarLiquidacion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportePendiente(), refetchType: 'active' });
      toast.success('Liquidacion generada');
    },
    onError: createCRUDErrorHandler('create', 'Liquidación'),
  });
}

/**
 * Hook para confirmar liquidacion
 */
export function useConfirmarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.confirmarLiquidacion(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidacionDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportePendiente(), refetchType: 'active' });
      toast.success('Liquidacion confirmada');
    },
    onError: createCRUDErrorHandler('update', 'Liquidación'),
  });
}

/**
 * Hook para pagar liquidacion
 */
export function usePagarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => consignaApi.pagarLiquidacion(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidacionDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones(), refetchType: 'active' });
      toast.success('Pago registrado');
    },
    onError: createCRUDErrorHandler('create', 'Pago'),
  });
}

/**
 * Hook para cancelar liquidacion
 */
export function useCancelarLiquidacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => consignaApi.cancelarLiquidacion(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidacionDetail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.liquidaciones(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportePendiente(), refetchType: 'active' });
      toast.success('Liquidacion cancelada');
    },
    onError: createCRUDErrorHandler('delete', 'Liquidación'),
  });
}
