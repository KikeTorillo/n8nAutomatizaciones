import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conteosApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hooks para gestión de Conteos de Inventario (Conteo Físico)
 * Ciclo: borrador → en_proceso → completado → ajustado | cancelado
 */

// ==================== CONSULTAS ====================

/**
 * Hook para listar conteos con filtros
 * @param {Object} params - Filtros opcionales
 * @param {number} params.sucursal_id - Filtrar por sucursal
 * @param {string} params.estado - borrador | en_proceso | completado | ajustado | cancelado
 * @param {string} params.tipo_conteo - total | por_categoria | por_ubicacion | ciclico | aleatorio
 * @param {string} params.fecha_desde - Fecha inicio (YYYY-MM-DD)
 * @param {string} params.fecha_hasta - Fecha fin (YYYY-MM-DD)
 * @param {string} params.folio - Búsqueda por folio
 * @param {number} params.limit - Límite de resultados
 * @param {number} params.offset - Offset para paginación
 */
export function useConteos(params = {}) {
    const getSucursalId = useSucursalStore(selectGetSucursalId);

    return useQuery({
        queryKey: ['conteos', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries({
                ...params,
                sucursal_id: params.sucursal_id || getSucursalId() || undefined
            }).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await conteosApi.listar(sanitizedParams);
            return response.data.data || { conteos: [], totales: {} };
        },
        staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    });
}

/**
 * Hook para obtener un conteo por ID con todos sus items
 * @param {number} id - ID del conteo
 */
export function useConteo(id) {
    return useQuery({
        queryKey: ['conteo', id],
        queryFn: async () => {
            const response = await conteosApi.obtenerPorId(id);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: STALE_TIMES.REAL_TIME, // 30 segundos (datos cambian durante conteo)
        refetchInterval: (query) => {
            // Refetch automático solo cuando está en proceso
            const data = query.state.data;
            if (data?.estado === 'en_proceso') {
                return 1000 * 10; // Cada 10 segundos
            }
            return false;
        },
    });
}

/**
 * Hook para obtener estadísticas de conteos
 * @param {Object} params - { fecha_desde?, fecha_hasta? }
 */
export function useEstadisticasConteos(params = {}) {
    return useQuery({
        queryKey: ['estadisticas-conteos', params],
        queryFn: async () => {
            const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {});

            const response = await conteosApi.obtenerEstadisticas(sanitizedParams);
            return response.data.data || {};
        },
        staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    });
}

// ==================== MUTACIONES ====================

/**
 * Hook para crear un nuevo conteo de inventario
 */
export function useCrearConteo() {
    const queryClient = useQueryClient();
    const getSucursalId = useSucursalStore(selectGetSucursalId);

    return useMutation({
        mutationFn: async (data) => {
            const sanitized = {
                tipo_conteo: data.tipo_conteo,
                sucursal_id: data.sucursal_id || getSucursalId() || undefined,
                filtros: data.filtros || {},
                fecha_programada: data.fecha_programada || undefined,
                usuario_contador_id: data.usuario_contador_id || undefined,
                usuario_supervisor_id: data.usuario_supervisor_id || undefined,
                notas: data.notas?.trim() || undefined,
            };

            const response = await conteosApi.crear(sanitized);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas-conteos'] });
        },
        onError: createCRUDErrorHandler('create', 'Conteo', {
            409: 'Ya existe un conteo en proceso',
        }),
    });
}

/**
 * Hook para iniciar un conteo (genera items y cambia a en_proceso)
 */
export function useIniciarConteo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await conteosApi.iniciar(id);
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['conteo', id] });
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
        },
        onError: createCRUDErrorHandler('update', 'Conteo'),
    });
}

/**
 * Hook para registrar cantidad contada de un item
 */
export function useRegistrarConteoItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ itemId, cantidad_contada, notas }) => {
            const response = await conteosApi.registrarConteo(itemId, {
                cantidad_contada,
                notas: notas?.trim() || undefined,
            });
            return response.data.data;
        },
        onSuccess: (data) => {
            // Invalidar el conteo padre para actualizar resumen
            queryClient.invalidateQueries({ queryKey: ['conteo'] });
        },
        onError: createCRUDErrorHandler('update', 'Item conteo'),
    });
}

/**
 * Hook para completar un conteo
 */
export function useCompletarConteo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await conteosApi.completar(id);
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['conteo', id] });
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas-conteos'] });
        },
        onError: createCRUDErrorHandler('update', 'Conteo'),
    });
}

/**
 * Hook para aplicar ajustes de inventario basados en el conteo
 */
export function useAplicarAjustesConteo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await conteosApi.aplicarAjustes(id);
            return response.data.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['conteo', id] });
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas-conteos'] });
            // Invalidar datos de inventario afectados
            queryClient.invalidateQueries({ queryKey: ['productos'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            queryClient.invalidateQueries({ queryKey: ['kardex'] });
            queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
            queryClient.invalidateQueries({ queryKey: ['valor-inventario'] });
        },
        onError: createCRUDErrorHandler('update', 'Ajustes conteo'),
    });
}

/**
 * Hook para cancelar un conteo
 */
export function useCancelarConteo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, motivo }) => {
            const response = await conteosApi.cancelar(id, { motivo: motivo?.trim() || undefined });
            return response.data.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['conteo', id] });
            queryClient.invalidateQueries({ queryKey: ['conteos'] });
            queryClient.invalidateQueries({ queryKey: ['estadisticas-conteos'] });
        },
        onError: createCRUDErrorHandler('delete', 'Conteo'),
    });
}

/**
 * Hook para buscar item por código de barras o SKU dentro de un conteo
 */
export function useBuscarItemConteo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conteoId, codigo }) => {
            const response = await conteosApi.buscarItem(conteoId, codigo);
            return response.data.data;
        },
        onError: createCRUDErrorHandler('fetch', 'Producto en conteo', {
            404: 'Producto no encontrado en este conteo',
        }),
    });
}

// ==================== CONSTANTES ====================

export const ESTADOS_CONTEO = {
    BORRADOR: 'borrador',
    EN_PROCESO: 'en_proceso',
    COMPLETADO: 'completado',
    AJUSTADO: 'ajustado',
    CANCELADO: 'cancelado',
};

export const TIPOS_CONTEO = {
    TOTAL: 'total',
    POR_CATEGORIA: 'por_categoria',
    POR_UBICACION: 'por_ubicacion',
    CICLICO: 'ciclico',
    ALEATORIO: 'aleatorio',
};

export const TIPOS_CONTEO_LABELS = {
    [TIPOS_CONTEO.TOTAL]: 'Conteo Total',
    [TIPOS_CONTEO.POR_CATEGORIA]: 'Por Categoría',
    [TIPOS_CONTEO.POR_UBICACION]: 'Por Ubicación',
    [TIPOS_CONTEO.CICLICO]: 'Cíclico',
    [TIPOS_CONTEO.ALEATORIO]: 'Aleatorio',
};

export const ESTADOS_CONTEO_CONFIG = {
    [ESTADOS_CONTEO.BORRADOR]: {
        label: 'Borrador',
        color: 'gray',
        badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    },
    [ESTADOS_CONTEO.EN_PROCESO]: {
        label: 'En Proceso',
        color: 'primary',
        badgeClass: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300',
    },
    [ESTADOS_CONTEO.COMPLETADO]: {
        label: 'Completado',
        color: 'yellow',
        badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    },
    [ESTADOS_CONTEO.AJUSTADO]: {
        label: 'Ajustado',
        color: 'green',
        badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    [ESTADOS_CONTEO.CANCELADO]: {
        label: 'Cancelado',
        color: 'red',
        badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    },
};
