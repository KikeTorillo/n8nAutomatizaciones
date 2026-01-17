import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conteosApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';

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
        staleTime: 1000 * 60 * 2, // 2 minutos
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
        staleTime: 1000 * 30, // 30 segundos (datos cambian durante conteo)
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
        staleTime: 1000 * 60 * 5, // 5 minutos
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
            queryClient.invalidateQueries(['conteos']);
            queryClient.invalidateQueries(['estadisticas-conteos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            const errorMessages = {
                400: 'Datos inválidos. Revisa el tipo de conteo y filtros',
                403: 'No tienes permisos para crear conteos',
                409: 'Ya existe un conteo en proceso',
            };

            const statusCode = error.response?.status;
            throw new Error(errorMessages[statusCode] || 'Error al crear conteo');
        },
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
            queryClient.invalidateQueries(['conteo', id]);
            queryClient.invalidateQueries(['conteos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al iniciar conteo');
        },
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
            queryClient.invalidateQueries(['conteo']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al registrar conteo');
        },
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
            queryClient.invalidateQueries(['conteo', id]);
            queryClient.invalidateQueries(['conteos']);
            queryClient.invalidateQueries(['estadisticas-conteos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al completar conteo');
        },
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
            queryClient.invalidateQueries(['conteo', id]);
            queryClient.invalidateQueries(['conteos']);
            queryClient.invalidateQueries(['estadisticas-conteos']);
            // Invalidar datos de inventario afectados
            queryClient.invalidateQueries(['productos']);
            queryClient.invalidateQueries(['movimientos']);
            queryClient.invalidateQueries(['kardex']);
            queryClient.invalidateQueries(['stock-critico']);
            queryClient.invalidateQueries(['valor-inventario']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al aplicar ajustes');
        },
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
            queryClient.invalidateQueries(['conteo', id]);
            queryClient.invalidateQueries(['conteos']);
            queryClient.invalidateQueries(['estadisticas-conteos']);
        },
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }
            throw new Error('Error al cancelar conteo');
        },
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
        onError: (error) => {
            const backendMessage = error.response?.data?.message;
            if (backendMessage) {
                throw new Error(backendMessage);
            }

            if (error.response?.status === 404) {
                throw new Error('Producto no encontrado en este conteo');
            }

            throw new Error('Error al buscar producto');
        },
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
        color: 'blue',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
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
