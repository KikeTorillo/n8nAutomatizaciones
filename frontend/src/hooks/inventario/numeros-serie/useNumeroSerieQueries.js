/**
 * Queries para listados y búsquedas de Numeros de Serie
 */

import { useQuery } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';
import { createSearchHook } from '@/hooks/factories';
import { numeroSerieQueryKeys } from './numeroSerieConstants';

// ==================== LISTADOS Y BUSQUEDAS ====================

/**
 * Hook para listar numeros de serie con filtros y paginacion
 * Ene 2026: Migrado a queryKeys centralizados
 */
export function useNumerosSerie(filtros = {}) {
    return useQuery({
        queryKey: numeroSerieQueryKeys.list(filtros),
        queryFn: async () => {
            const sanitizedParams = Object.entries(filtros).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.listarNumerosSerie(sanitizedParams);
            return response.data;
        },
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

/**
 * Hook para buscar numeros de serie
 * Refactorizado con createSearchHook - Ene 2026
 */
export const useBuscarNumeroSerie = createSearchHook({
    key: 'numeros-serie',
    searchFn: (params) => inventarioApi.buscarNumeroSerie(params.q),
    staleTime: STALE_TIMES.REAL_TIME,
});

/**
 * Hook para obtener numero de serie por ID
 */
export function useNumeroSerie(id) {
    return useQuery({
        queryKey: numeroSerieQueryKeys.detail(id),
        queryFn: async () => {
            const response = await inventarioApi.obtenerNumeroSerie(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

/**
 * Hook para obtener historial de un numero de serie
 */
export function useHistorialNumeroSerie(id) {
    return useQuery({
        queryKey: numeroSerieQueryKeys.historial(id),
        queryFn: async () => {
            const response = await inventarioApi.obtenerHistorialNumeroSerie(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: STALE_TIMES.DYNAMIC,
    });
}

/**
 * Hook para obtener productos que requieren numero de serie
 */
export function useProductosConSerie() {
    return useQuery({
        queryKey: numeroSerieQueryKeys.productosConSerie,
        queryFn: async () => {
            const response = await inventarioApi.obtenerProductosConSerie();
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

/**
 * Hook para obtener estadisticas generales
 */
export function useEstadisticasNumerosSerie() {
    return useQuery({
        queryKey: numeroSerieQueryKeys.estadisticas,
        queryFn: async () => {
            const response = await inventarioApi.obtenerEstadisticasNumerosSerie();
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

/**
 * Hook para obtener numeros de serie proximos a vencer
 */
export function useProximosVencer(dias = 30) {
    return useQuery({
        queryKey: numeroSerieQueryKeys.proximosVencer(dias),
        queryFn: async () => {
            const response = await inventarioApi.obtenerProximosVencer(dias);
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

/**
 * Hook para verificar existencia de numero de serie
 */
export function useVerificarExistencia(productoId, numeroSerie) {
    return useQuery({
        queryKey: numeroSerieQueryKeys.existe(productoId, numeroSerie),
        queryFn: async () => {
            const response = await inventarioApi.verificarExistenciaNumeroSerie(productoId, numeroSerie);
            return response.data.data.existe;
        },
        enabled: !!productoId && !!numeroSerie,
        staleTime: 0,
    });
}
