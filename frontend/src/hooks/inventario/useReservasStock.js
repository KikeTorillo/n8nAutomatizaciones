import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { useSucursalContext } from '@/hooks/factories';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para obtener stock disponible de un producto
 * Considera reservas activas de otros usuarios
 * @param {number} productoId - ID del producto
 * @param {Object} options - { sucursalId?, enabled? }
 */
export function useStockDisponible(productoId, options = {}) {
  const sucursalId = useSucursalContext(options.sucursalId);

  return useQuery({
    queryKey: [...queryKeys.pos.stockDisponible(productoId), sucursalId],
    queryFn: async () => {
      const params = sucursalId ? { sucursal_id: sucursalId } : {};
      const response = await inventarioApi.obtenerStockDisponible(productoId, params);
      return response.data.data;
    },
    enabled: options.enabled !== false && !!productoId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos (stock debe estar fresco)
    refetchInterval: 1000 * 60, // Refrescar cada minuto
  });
}

/**
 * Hook para obtener stock disponible de múltiples productos
 * @param {Array<number>} productosIds - Array de IDs de productos
 * @param {Object} options - { sucursalId?, enabled? }
 */
export function useStockDisponibleMultiple(productosIds, options = {}) {
  const sucursalId = useSucursalContext(options.sucursalId);

  return useQuery({
    queryKey: ['stock-disponible-multiple', productosIds, sucursalId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerStockDisponibleMultiple({
        producto_ids: productosIds,
        sucursal_id: sucursalId || undefined,
      });
      return response.data.data || {};
    },
    enabled: options.enabled !== false && productosIds?.length > 0,
    staleTime: STALE_TIMES.REAL_TIME,
    refetchInterval: 1000 * 60,
  });
}

/**
 * Hook para verificar disponibilidad de un producto
 * @param {number} productoId - ID del producto
 * @param {number} cantidad - Cantidad requerida
 * @param {Object} options - { sucursalId?, enabled? }
 */
export function useVerificarDisponibilidad(productoId, cantidad, options = {}) {
  const sucursalId = useSucursalContext(options.sucursalId);

  return useQuery({
    queryKey: ['verificar-disponibilidad', productoId, cantidad, sucursalId],
    queryFn: async () => {
      const params = {
        cantidad,
        ...(sucursalId && { sucursal_id: sucursalId }),
      };
      const response = await inventarioApi.verificarDisponibilidad(productoId, params);
      return response.data.data;
    },
    enabled: options.enabled !== false && !!productoId && cantidad > 0,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para crear reserva de stock
 */
export function useCrearReserva() {
  const queryClient = useQueryClient();
  const defaultSucursalId = useSucursalContext();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        producto_id: data.producto_id,
        cantidad: data.cantidad,
        tipo_origen: data.tipo_origen || 'venta_pos',
        origen_id: data.origen_id || undefined,
        sucursal_id: data.sucursal_id || defaultSucursalId || undefined,
        minutos_expiracion: data.minutos_expiracion || 15,
      };
      const response = await inventarioApi.crearReserva(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.stockDisponible(variables.producto_id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-disponible-multiple'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['reservas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Reserva'),
  });
}

/**
 * Hook para crear múltiples reservas
 */
export function useCrearReservasMultiple() {
  const queryClient = useQueryClient();
  const defaultSucursalId = useSucursalContext();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        items: data.items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
        tipo_origen: data.tipo_origen || 'venta_pos',
        origen_id: data.origen_id || undefined,
        sucursal_id: data.sucursal_id || defaultSucursalId || undefined,
      };
      const response = await inventarioApi.crearReservasMultiple(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-disponible'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-disponible-multiple'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['reservas'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Reservas'),
  });
}

/**
 * Hook para confirmar reserva
 */
export function useConfirmarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaId) => {
      const response = await inventarioApi.confirmarReserva(reservaId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-disponible'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-disponible-multiple'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['reservas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
    },
  });
}

/**
 * Hook para confirmar múltiples reservas
 */
export function useConfirmarReservasMultiple() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaIds) => {
      const response = await inventarioApi.confirmarReservasMultiple({ reserva_ids: reservaIds });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-disponible'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-disponible-multiple'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['reservas'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
    },
  });
}

/**
 * Hook para cancelar reserva
 */
export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservaId) => {
      const response = await inventarioApi.cancelarReserva(reservaId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-disponible'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-disponible-multiple'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['reservas'], refetchType: 'active' });
    },
  });
}

/**
 * Hook para listar reservas
 * @param {Object} params - { estado?, producto_id?, sucursal_id?, tipo_origen?, origen_id?, limit?, offset? }
 */
export function useReservas(params = {}) {
  return useQuery({
    queryKey: ['reservas', params],
    queryFn: async () => {
      const response = await inventarioApi.listarReservas(sanitizeParams(params));
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.REAL_TIME,
  });
}
