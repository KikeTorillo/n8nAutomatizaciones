import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { STALE_TIMES } from '@/app/queryClient';

/**
 * Hooks para valoracion de inventario FIFO/AVCO
 * Gap Alta Prioridad - Dic 2025
 */

// ==================== CONFIGURACION ====================

/**
 * Hook para obtener configuracion de valoracion
 */
export function useConfiguracionValoracion() {
    return useQuery({
        queryKey: ['valoracion', 'configuracion'],
        queryFn: async () => {
            const response = await inventarioApi.obtenerConfiguracionValoracion();
            return response.data.data;
        },
        staleTime: STALE_TIMES.STATIC_DATA, // 10 minutos
    });
}

/**
 * Hook para actualizar configuracion de valoracion
 */
export function useActualizarConfiguracionValoracion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await inventarioApi.actualizarConfiguracionValoracion(data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['valoracion'] });
        },
    });
}

// ==================== RESUMEN Y TOTALES ====================

/**
 * Hook para obtener resumen comparativo de valoracion
 * Incluye metodo configurado, valores por cada metodo y diferencias
 */
export function useResumenValoracion() {
    return useQuery({
        queryKey: ['valoracion', 'resumen'],
        queryFn: async () => {
            const response = await inventarioApi.obtenerResumenValoracion();
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    });
}

/**
 * Hook para obtener valor total del inventario
 * @param {Object} params - { metodo?, categoria_id?, sucursal_id? }
 */
export function useValorTotalInventario(params = {}) {
    return useQuery({
        queryKey: ['valoracion', 'total', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.obtenerValorTotal(sanitizedParams);
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

// ==================== COMPARATIVAS ====================

/**
 * Hook para obtener comparativa de valoracion por todos los metodos
 * @param {Object} params - { producto_id? }
 */
export function useComparativaValoracion(params = {}) {
    return useQuery({
        queryKey: ['valoracion', 'comparativa', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.obtenerComparativaValoracion(sanitizedParams);
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

// ==================== REPORTES ====================

/**
 * Hook para obtener reporte de valoracion por categorias
 * @param {Object} params - { metodo? }
 */
export function useReporteValoracionCategorias(params = {}) {
    return useQuery({
        queryKey: ['valoracion', 'reporte', 'categorias', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.obtenerReporteValoracionCategorias(sanitizedParams);
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

/**
 * Hook para obtener productos con mayor diferencia entre metodos
 * @param {Object} params - { limite? }
 */
export function useReporteDiferenciasValoracion(params = {}) {
    return useQuery({
        queryKey: ['valoracion', 'reporte', 'diferencias', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await inventarioApi.obtenerReporteDiferenciasValoracion(sanitizedParams);
            return response.data.data;
        },
        staleTime: STALE_TIMES.SEMI_STATIC,
    });
}

// ==================== VALORACION POR PRODUCTO ====================

/**
 * Hook para obtener valoracion detallada de un producto
 * @param {number} productoId
 */
export function useValoracionProducto(productoId) {
    return useQuery({
        queryKey: ['valoracion', 'producto', productoId],
        queryFn: async () => {
            const response = await inventarioApi.obtenerValoracionProducto(productoId);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: STALE_TIMES.MEDIUM,
    });
}

/**
 * Hook para obtener valoracion FIFO de un producto
 * @param {number} productoId
 * @param {Object} params - { sucursal_id? }
 */
export function useValoracionFIFO(productoId, params = {}) {
    return useQuery({
        queryKey: ['valoracion', 'fifo', productoId, params],
        queryFn: async () => {
            const response = await inventarioApi.obtenerValoracionFIFO(productoId, params);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: STALE_TIMES.MEDIUM,
    });
}

/**
 * Hook para obtener valoracion AVCO de un producto
 * @param {number} productoId
 * @param {Object} params - { sucursal_id? }
 */
export function useValoracionAVCO(productoId, params = {}) {
    return useQuery({
        queryKey: ['valoracion', 'avco', productoId, params],
        queryFn: async () => {
            const response = await inventarioApi.obtenerValoracionAVCO(productoId, params);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: STALE_TIMES.MEDIUM,
    });
}

/**
 * Hook para obtener capas de inventario FIFO
 * Muestra trazabilidad de entradas por antiguedad
 * @param {number} productoId
 */
export function useCapasFIFO(productoId) {
    return useQuery({
        queryKey: ['valoracion', 'capas', productoId],
        queryFn: async () => {
            const response = await inventarioApi.obtenerCapasFIFO(productoId);
            return response.data.data;
        },
        enabled: !!productoId,
        staleTime: STALE_TIMES.MEDIUM,
    });
}

// ==================== UTILIDADES ====================

/**
 * Formatea un valor monetario
 */
export function formatearValor(valor, decimales = 2) {
    if (valor === null || valor === undefined) return '-';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    }).format(valor);
}

/**
 * Calcula porcentaje de diferencia entre dos valores
 */
export function calcularDiferenciaPorcentaje(valorA, valorB) {
    if (!valorB || valorB === 0) return 0;
    return ((valorA - valorB) / valorB * 100).toFixed(2);
}

/**
 * Nombres legibles de metodos
 */
export const METODOS_VALORACION = {
    fifo: 'FIFO (First In, First Out)',
    avco: 'AVCO (Costo Promedio Ponderado)',
    promedio: 'Promedio Simple',
};

/**
 * Descripciones de metodos
 */
export const DESCRIPCIONES_METODOS = {
    fifo: 'Los primeros productos en entrar son los primeros en valorarse. Ideal para productos perecederos.',
    avco: 'Calcula un costo promedio ponderado basado en todas las entradas. Suaviza variaciones de precio.',
    promedio: 'Usa el precio de compra actual del producto. Metodo mas simple pero menos preciso.',
};
