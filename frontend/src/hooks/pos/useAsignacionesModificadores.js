/**
 * ====================================================================
 * HOOK - ASIGNACIONES DE MODIFICADORES
 * ====================================================================
 *
 * Hooks para asignar/desasignar grupos de modificadores
 * a productos y categorías.
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
// ASIGNACIONES DE GRUPOS A PRODUCTOS/CATEGORÍAS
// ========================================================================

/**
 * Hook para listar asignaciones de grupos a un producto
 * @param {number} productoId - ID del producto
 * @param {Object} options - Opciones adicionales
 * @returns {Object} Query result con lista de asignaciones
 */
export function useAsignacionesProducto(productoId, options = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.asignaciones(productoId),
        queryFn: () => posApi.listarAsignacionesProducto(productoId),
        enabled: !!productoId && options.enabled !== false,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        select: (response) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para asignar grupo a producto
 * @returns {Object} Mutation result
 */
export function useAsignarGrupoAProducto() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, data }) => posApi.asignarGrupoAProducto(productoId, data),
        onSuccess: (_, { productoId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.asignaciones(productoId), refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.producto(productoId), refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.tiene(productoId), refetchType: 'active' });
            toast({
                title: 'Grupo asignado',
                description: 'El grupo se ha asignado al producto exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Asignacion de grupo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para asignar grupo a categoría
 * @returns {Object} Mutation result
 */
export function useAsignarGrupoACategoria() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ categoriaId, data }) => posApi.asignarGrupoACategoria(categoriaId, data),
        onSuccess: () => {
            // Invalidar todos los modificadores de productos ya que la categoría afecta a múltiples
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.productoBase, refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.tieneBase, refetchType: 'active' });
            toast({
                title: 'Grupo asignado',
                description: 'El grupo se ha asignado a la categoría exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('create', 'Asignacion de grupo')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}

/**
 * Hook para eliminar asignación de grupo a producto
 * @returns {Object} Mutation result
 */
export function useEliminarAsignacionProducto() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, grupoId }) => posApi.eliminarAsignacionProducto(productoId, grupoId),
        onSuccess: (_, { productoId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.asignaciones(productoId), refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.producto(productoId), refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.tiene(productoId), refetchType: 'active' });
            toast({
                title: 'Asignación eliminada',
                description: 'La asignación se ha eliminado exitosamente',
                variant: 'success',
            });
        },
        onError: (error) => {
            try {
                createCRUDErrorHandler('delete', 'Asignacion')(error);
            } catch (e) {
                toast.error(e.message);
            }
        },
    });
}
