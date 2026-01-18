import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar movimientos con filtros
 * @param {Object} params - { tipo_movimiento?, categoria?, producto_id?, proveedor_id?, fecha_desde?, fecha_hasta?, limit?, offset? }
 */
export function useMovimientos(params = {}) {
  return useQuery({
    queryKey: ['movimientos', params],
    queryFn: async () => {
      const response = await inventarioApi.listarMovimientos(sanitizeParams(params));
      return response.data.data || { movimientos: [], total: 0 };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (movimientos requieren frescura)
  });
}

/**
 * Hook para obtener kardex de un producto
 * @param {number} productoId
 * @param {Object} params - { tipo_movimiento?, fecha_desde?, fecha_hasta?, proveedor_id?, limit?, offset? }
 */
export function useKardex(productoId, params = {}) {
  return useQuery({
    queryKey: ['kardex', productoId, params],
    queryFn: async () => {
      const response = await inventarioApi.obtenerKardex(productoId, sanitizeParams(params));
      return response.data.data || { kardex: [], producto: null };
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener estadísticas de movimientos
 * @param {Object} params - { fecha_desde, fecha_hasta }
 */
export function useEstadisticasMovimientos(params) {
  return useQuery({
    queryKey: ['estadisticas-movimientos', params],
    queryFn: async () => {
      const response = await inventarioApi.obtenerEstadisticasMovimientos(params);
      return response.data.data.estadisticas || {};
    },
    enabled: !!params.fecha_desde && !!params.fecha_hasta,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

/**
 * Hook para registrar movimiento de inventario
 */
export function useRegistrarMovimiento() {
  const queryClient = useQueryClient();
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        ...data,
        costo_unitario: data.costo_unitario || undefined,
        proveedor_id: data.proveedor_id || undefined,
        venta_pos_id: data.venta_pos_id || undefined,
        cita_id: data.cita_id || undefined,
        usuario_id: data.usuario_id || undefined,
        referencia: data.referencia?.trim() || undefined,
        motivo: data.motivo?.trim() || undefined,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        lote: data.lote?.trim() || undefined,
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
      };

      const response = await inventarioApi.registrarMovimiento(sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['kardex', variables.producto_id] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['producto', variables.producto_id] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
      queryClient.invalidateQueries({ queryKey: ['valor-inventario'] });
    },
    onError: createCRUDErrorHandler('create', 'Movimiento', {
      409: 'Stock insuficiente para realizar la salida',
    }),
  });
}
