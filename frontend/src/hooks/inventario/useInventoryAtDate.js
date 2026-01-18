import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hook para consultar inventario historico en una fecha especifica
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {Object} filtros - Filtros opcionales { producto_id, categoria_id, solo_con_stock, limit, offset }
 * @param {Object} options - Opciones de React Query
 */
export function useInventoryAtDate(fecha, filtros = {}, options = {}) {
    return useQuery({
        queryKey: ['inventario-at-date', fecha, filtros],
        queryFn: async () => {
            const response = await inventarioApi.obtenerStockEnFecha(fecha, filtros);
            return response.data.data;
        },
        enabled: !!fecha && options.enabled !== false,
        staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos (datos historicos no cambian)
        ...options
    });
}

/**
 * Hook para comparar inventario entre dos fechas
 * @param {string} fechaDesde - Fecha inicial YYYY-MM-DD
 * @param {string} fechaHasta - Fecha final YYYY-MM-DD
 * @param {boolean} soloCambios - Solo productos con cambios (default: true)
 * @param {Object} options - Opciones de React Query
 */
export function useCompararInventario(fechaDesde, fechaHasta, soloCambios = true, options = {}) {
    return useQuery({
        queryKey: ['inventario-comparar', fechaDesde, fechaHasta, soloCambios],
        queryFn: async () => {
            const response = await inventarioApi.compararInventario(fechaDesde, fechaHasta, soloCambios);
            return response.data.data;
        },
        enabled: !!fechaDesde && !!fechaHasta && options.enabled !== false,
        staleTime: STALE_TIMES.SEMI_STATIC,
        ...options
    });
}

/**
 * Hook para listar snapshots disponibles
 * @param {Object} params - { limit?, offset? }
 * @param {Object} options - Opciones de React Query
 */
export function useSnapshots(params = {}, options = {}) {
    return useQuery({
        queryKey: ['inventario-snapshots', params],
        queryFn: async () => {
            const response = await inventarioApi.listarSnapshots(params);
            return response.data.data || [];
        },
        staleTime: STALE_TIMES.FREQUENT, // 1 minuto
        ...options
    });
}

/**
 * Hook para obtener fechas disponibles (para selector)
 * @param {Object} options - Opciones de React Query
 */
export function useFechasDisponibles(options = {}) {
    return useQuery({
        queryKey: ['inventario-snapshots-fechas'],
        queryFn: async () => {
            const response = await inventarioApi.obtenerFechasDisponibles();
            return response.data.data || [];
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
        ...options
    });
}

/**
 * Hook para generar snapshot manualmente
 * @returns {Object} - { mutate, mutateAsync, isLoading, ... }
 */
export function useGenerarSnapshot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ fecha, descripcion } = {}) => {
            const response = await inventarioApi.generarSnapshot({ fecha, descripcion });
            return response.data.data;
        },
        onSuccess: () => {
            // Invalidar queries relacionadas
            queryClient.invalidateQueries({ queryKey: ['inventario-snapshots'] });
            queryClient.invalidateQueries({ queryKey: ['inventario-snapshots-fechas'] });
        }
    });
}

export default {
    useInventoryAtDate,
    useCompararInventario,
    useSnapshots,
    useFechasDisponibles,
    useGenerarSnapshot
};
