/**
 * Queries específicas por producto para Numeros de Serie
 */

import { useQuery } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { numeroSerieQueryKeys } from './numeroSerieConstants';

// ==================== POR PRODUCTO ====================

/**
 * Hook para obtener numeros de serie disponibles de un producto
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @param {number} options.sucursalId - ID de la sucursal (opcional)
 * @param {boolean} options.enabled - Si la consulta está habilitada (default: true)
 */
export function useNumerosSerieDisponibles(productoId, options = {}) {
    const { sucursalId, enabled = true } = options;

    return useQuery({
        queryKey: numeroSerieQueryKeys.disponibles(productoId, sucursalId),
        queryFn: async () => {
            const response = await inventarioApi.obtenerNumerosSerieDisponibles(
                productoId,
                sucursalId ? { sucursal_id: sucursalId } : {}
            );
            return response.data.data;
        },
        enabled: !!productoId && enabled,
        staleTime: STALE_TIMES.REAL_TIME,
    });
}

/**
 * Hook para obtener resumen de numeros de serie por producto
 */
export function useResumenNumeroSerieProducto(productoId) {
    return useQuery({
        queryKey: numeroSerieQueryKeys.resumen(productoId),
        queryFn: async () => {
            const response = await inventarioApi.obtenerResumenNumeroSerieProducto(productoId);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: STALE_TIMES.DYNAMIC,
    });
}
