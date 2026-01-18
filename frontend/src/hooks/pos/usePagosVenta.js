import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';

/**
 * Hook para registrar pago en venta
 */
export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, monto_pago, metodo_pago, pago_id }) => {
      const response = await posApi.registrarPago(id, {
        monto_pago,
        metodo_pago,
        pago_id: pago_id || undefined,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['corte-caja'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-diarias'] });
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        404: 'Venta no encontrada',
        400: 'Monto de pago inválido',
        409: 'El pago excede el monto pendiente',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al registrar pago');
    },
  });
}

/**
 * Hook para registrar pagos split (múltiples métodos de pago)
 */
export function useRegistrarPagosSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ventaId, pagos, clienteId }) => {
      const data = {
        pagos,
        cliente_id: clienteId || undefined,
      };

      const response = await posApi.registrarPagosSplit(ventaId, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas-pos'] });
      queryClient.invalidateQueries({ queryKey: ['venta-pos', variables.ventaId] });
      queryClient.invalidateQueries({ queryKey: ['pagos-venta', variables.ventaId] });
      queryClient.invalidateQueries({ queryKey: ['corte-caja'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-diarias'] });
      queryClient.invalidateQueries({ queryKey: ['sesion-caja-activa'] });
      if (variables.clienteId) {
        queryClient.invalidateQueries({ queryKey: ['cliente-credito', variables.clienteId] });
      }
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) throw new Error(backendMessage);

      const errorMessages = {
        400: 'Datos de pago inválidos',
        404: 'Venta no encontrada',
        403: 'No tienes permisos para registrar pagos',
        409: 'El monto de pagos excede el total de la venta',
      };

      const statusCode = error.response?.status;
      throw new Error(errorMessages[statusCode] || 'Error al registrar pagos');
    },
  });
}

/**
 * Hook para obtener desglose de pagos de una venta
 */
export function usePagosVenta(ventaId) {
  return useQuery({
    queryKey: ['pagos-venta', ventaId],
    queryFn: async () => {
      const response = await posApi.obtenerPagosVenta(ventaId);
      return response.data.data || { venta: null, pagos: [], resumen: {} };
    },
    enabled: !!ventaId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}
