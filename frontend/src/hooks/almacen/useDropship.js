/**
 * Hook para Dropshipping
 * Queries y mutations para gestion de OC dropship
 * Fecha: 30 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { dropshipApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== QUERIES ====================

/**
 * Hook para obtener estadisticas de dropship
 */
export function useDropshipEstadisticas() {
  return useQuery({
    queryKey: queryKeys.almacen.dropship.estadisticas,
    queryFn: async () => {
      const response = await dropshipApi.obtenerEstadisticas();
      return response.data.data;
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para obtener configuracion de dropship
 */
export function useDropshipConfiguracion() {
  return useQuery({
    queryKey: queryKeys.almacen.dropship.configuracion,
    queryFn: async () => {
      const response = await dropshipApi.obtenerConfiguracion();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener ventas pendientes de generar OC
 */
export function useVentasPendientesDropship() {
  return useQuery({
    queryKey: queryKeys.almacen.dropship.pendientes,
    queryFn: async () => {
      const response = await dropshipApi.obtenerVentasPendientes();
      return response.data.data;
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para listar OC dropship
 * @param {Object} filtros - { estado?, proveedor_id?, fecha_desde?, fecha_hasta? }
 */
export function useOrdenesDropship(filtros = {}) {
  return useQuery({
    queryKey: queryKeys.almacen.dropship.ordenes.list(filtros),
    queryFn: async () => {
      const response = await dropshipApi.listarOrdenes(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para obtener detalle de una OC dropship
 * @param {number} id - ID de la OC
 */
export function useOrdenDropship(id) {
  return useQuery({
    queryKey: queryKeys.almacen.dropship.ordenes.detail(id),
    queryFn: async () => {
      const response = await dropshipApi.obtenerOrden(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para actualizar configuracion de dropship
 */
export function useActualizarConfigDropship() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => dropshipApi.actualizarConfiguracion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.dropship.configuracion, refetchType: 'active' });
      toast.success('Configuración de dropship actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Configuración'),
  });
}

/**
 * Hook para crear OC desde una venta
 */
export function useCrearOCDesdeVenta() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (ventaId) => dropshipApi.crearDesdeVenta(ventaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.dropship.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
      toast.success('Orden de compra dropship creada');
    },
    onError: createCRUDErrorHandler('create', 'Orden de compra'),
  });
}

/**
 * Hook para confirmar entrega de OC dropship
 */
export function useConfirmarEntregaDropship() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, notas }) => dropshipApi.confirmarEntrega(id, { notas }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.dropship.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.dropship.ordenes.detail(id), refetchType: 'active' });
      toast.success('Entrega confirmada exitosamente');
    },
    onError: createCRUDErrorHandler('update', 'Entrega'),
  });
}

/**
 * Hook para cancelar OC dropship
 */
export function useCancelarDropship() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, motivo }) => dropshipApi.cancelar(id, { motivo }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.dropship.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.dropship.ordenes.detail(id), refetchType: 'active' });
      toast.success('Orden dropship cancelada');
    },
    onError: createCRUDErrorHandler('delete', 'Orden'),
  });
}
