/**
 * ====================================================================
 * HOOKS: Stock de Consigna
 * ====================================================================
 * Queries y mutations para gestion de stock en consignacion
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { consignaApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { CONSIGNA_KEYS } from './consignaKeys';

// ==================== QUERIES ====================

/**
 * Hook para consultar stock en consignacion
 * @param {Object} filtros - { acuerdo_id?, proveedor_id?, producto_id?, almacen_id?, solo_disponible? }
 */
export function useStockConsigna(filtros = {}) {
  return useQuery({
    queryKey: CONSIGNA_KEYS.stockList(filtros),
    queryFn: async () => {
      const response = await consignaApi.consultarStock(filtros);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para recibir mercancia en consignacion
 */
export function useRecibirMercanciaConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, data }) => consignaApi.recibirMercancia(acuerdoId, data),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.stock(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportes(), refetchType: 'active' });
      toast.success('Mercancia recibida en consignacion');
    },
    onError: createCRUDErrorHandler('create', 'Mercancía'),
  });
}

/**
 * Hook para ajustar stock consigna
 */
export function useAjustarStockConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ stockId, data }) => consignaApi.ajustarStock(stockId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.stock(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportes(), refetchType: 'active' });
      toast.success('Stock ajustado');
    },
    onError: createCRUDErrorHandler('update', 'Stock'),
  });
}

/**
 * Hook para devolver mercancia al proveedor
 */
export function useDevolverMercanciaConsigna() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ acuerdoId, data }) => consignaApi.devolverMercancia(acuerdoId, data),
    onSuccess: (response, { acuerdoId }) => {
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.stock(), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.acuerdoDetail(acuerdoId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: CONSIGNA_KEYS.reportes(), refetchType: 'active' });
      toast.success('Devolucion registrada');
    },
    onError: createCRUDErrorHandler('create', 'Devolución'),
  });
}
