/**
 * ====================================================================
 * HOOK - COMBOS / PAQUETES
 * ====================================================================
 *
 * Hooks para gestión de combos/paquetes de productos en el módulo POS.
 *
 * Ene 2026 - Fase 3 POS
 * Feb 2026 - Extraído de useCombosModificadores.js
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ========================================================================
// CONSTANTES (deprecated - usar queryKeys.pos.combos)
// ========================================================================

/** @deprecated Usar queryKeys.pos.combos en su lugar */
export const COMBO_QUERY_KEYS = {
    combos: 'combos',
    combo: 'combo',
    comboVerificar: 'combo-verificar',
    comboPrecio: 'combo-precio',
    comboStock: 'combo-stock',
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 30 * 60 * 1000; // 30 minutos

// ========================================================================
// COMBOS / PAQUETES
// ========================================================================

/**
 * Hook para verificar si un producto es combo
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { es_combo }
 */
export function useVerificarCombo(productoId, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.verificar(productoId),
        queryFn: () => posApi.verificarCombo(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para obtener un combo por producto ID
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con datos del combo
 */
export function useCombo(productoId, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.detail(productoId),
        queryFn: () => posApi.obtenerCombo(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para listar combos
 * @param {Object} params - Parámetros de búsqueda { limit, offset, busqueda, activo }
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con lista de combos paginada
 */
export function useCombos(params = {}, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.list(params),
        queryFn: () => posApi.listarCombos(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para crear combo
 * @returns {Object} Mutation result
 */
export function useCrearCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => posApi.crearCombo(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.all, refetchType: 'active' });
            toast.success('Combo creado exitosamente');
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Combo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para actualizar combo
 * @returns {Object} Mutation result
 */
export function useActualizarCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, data }) => posApi.actualizarCombo(productoId, data),
        onSuccess: (_, { productoId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.all, refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.detail(productoId), refetchType: 'active' });
            toast.success('Combo actualizado exitosamente');
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('update', 'Combo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar combo
 * @returns {Object} Mutation result
 */
export function useEliminarCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, sucursalId }) => posApi.eliminarCombo(productoId, sucursalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.all, refetchType: 'active' });
            toast.success('Combo eliminado exitosamente');
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Combo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para calcular precio de combo
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { precio }
 */
export function useComboPrecio(productoId, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.precio(productoId),
        queryFn: () => posApi.calcularPrecioCombo(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para verificar stock de combo
 * @param {number} productoId - ID del producto
 * @param {number} cantidad - Cantidad a verificar
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { disponible, componentes }
 */
export function useComboStock(productoId, cantidad = 1, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.stock(productoId, cantidad),
        queryFn: () => posApi.verificarStockCombo(productoId, cantidad),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - stock cambia frecuentemente
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}
