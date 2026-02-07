/**
 * ====================================================================
 * HOOK - MODIFICADORES
 * ====================================================================
 *
 * Hooks para gestión de grupos de modificadores y modificadores
 * individuales en el módulo POS.
 *
 * Ene 2026 - Fase 3 POS
 * Feb 2026 - Extraído de useCombosModificadores.js
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ========================================================================
// CONSTANTES (deprecated - usar queryKeys.pos.modificadores)
// ========================================================================

/** @deprecated Usar queryKeys.pos.modificadores en su lugar */
export const MODIFICADORES_QUERY_KEYS = {
    gruposModificadores: 'grupos-modificadores',
    modificadoresProducto: 'modificadores-producto',
    tieneModificadores: 'tiene-modificadores',
};

const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 30 * 60 * 1000; // 30 minutos

// ========================================================================
// GRUPOS DE MODIFICADORES
// ========================================================================

/**
 * Hook para listar grupos de modificadores
 * @param {Object} params - { activo, incluir_modificadores }
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con lista de grupos
 */
export function useGruposModificadores(params = {}, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.grupos(params),
        queryFn: () => posApi.listarGruposModificadores(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para crear grupo de modificadores
 * @returns {Object} Mutation result
 */
export function useCrearGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => posApi.crearGrupoModificadores(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast({
                title: 'Grupo creado',
                description: 'El grupo de modificadores se ha creado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Grupo de modificadores')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para actualizar grupo de modificadores
 * @returns {Object} Mutation result
 */
export function useActualizarGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => posApi.actualizarGrupoModificadores(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast({
                title: 'Grupo actualizado',
                description: 'El grupo de modificadores se ha actualizado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('update', 'Grupo de modificadores')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar grupo de modificadores
 * @returns {Object} Mutation result
 */
export function useEliminarGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id) => posApi.eliminarGrupoModificadores(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast({
                title: 'Grupo eliminado',
                description: 'El grupo de modificadores se ha eliminado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Grupo de modificadores')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

// ========================================================================
// MODIFICADORES
// ========================================================================

/**
 * Hook para crear modificador
 * @returns {Object} Mutation result
 */
export function useCrearModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data) => posApi.crearModificador(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast({
                title: 'Modificador creado',
                description: 'El modificador se ha creado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Modificador')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para actualizar modificador
 * @returns {Object} Mutation result
 */
export function useActualizarModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }) => posApi.actualizarModificador(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast({
                title: 'Modificador actualizado',
                description: 'El modificador se ha actualizado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('update', 'Modificador')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar modificador
 * @returns {Object} Mutation result
 */
export function useEliminarModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id) => posApi.eliminarModificador(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast({
                title: 'Modificador eliminado',
                description: 'El modificador se ha eliminado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Modificador')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

// ========================================================================
// MODIFICADORES DE PRODUCTO (Para uso en POS)
// ========================================================================

/**
 * Hook para obtener modificadores de un producto
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con grupos y modificadores del producto
 */
export function useModificadoresProducto(productoId, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.producto(productoId),
        queryFn: () => posApi.obtenerModificadoresProducto(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para verificar si un producto tiene modificadores
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con { tiene_modificadores }
 */
export function useTieneModificadores(productoId, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.tiene(productoId),
        queryFn: () => posApi.tieneModificadores(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}
