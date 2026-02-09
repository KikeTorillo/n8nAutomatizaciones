/**
 * ====================================================================
 * HOOK - COMBOS / PAQUETES
 * ====================================================================
 *
 * Hooks para gestion de combos/paquetes de productos en el modulo POS.
 *
 * Ene 2026 - Fase 3 POS
 * Feb 2026 - Extraido de useCombosModificadores.js
 * Feb 2026 - Migrado a TypeScript
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { Combo } from '@/types/entities';

const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 30 * 60 * 1000; // 30 minutos

// ========================================================================
// INTERFACES LOCALES
// ========================================================================

interface ActualizarComboData {
    productoId: number;
    data: Partial<Combo>;
}

interface EliminarComboData {
    productoId: number;
    sucursalId?: number;
}

// ========================================================================
// COMBOS / PAQUETES
// ========================================================================

/**
 * Hook para verificar si un producto es combo
 */
export function useVerificarCombo(productoId: number | undefined | null, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.verificar(productoId),
        queryFn: () => posApi.verificarCombo(productoId!),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para obtener un combo por producto ID
 */
export function useCombo(productoId: number | undefined | null, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.detail(productoId),
        queryFn: () => posApi.obtenerCombo(productoId!),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para listar combos
 */
export function useCombos(params: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.list(params),
        queryFn: () => posApi.listarCombos(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para crear combo
 */
export function useCrearCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data: Partial<Combo>) => posApi.crearCombo(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.all, refetchType: 'active' });
            toast.success('Combo creado exitosamente');
        },
        onError: createCRUDErrorHandler('create', 'Combo'),
    });
}

/**
 * Hook para actualizar combo
 */
export function useActualizarCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, data }: ActualizarComboData) => posApi.actualizarCombo(productoId, data),
        onSuccess: (_: unknown, { productoId }: ActualizarComboData) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.all, refetchType: 'active' });
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.detail(productoId), refetchType: 'active' });
            toast.success('Combo actualizado exitosamente');
        },
        onError: createCRUDErrorHandler('update', 'Combo'),
    });
}

/**
 * Hook para eliminar combo
 */
export function useEliminarCombo() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ productoId, sucursalId }: EliminarComboData) => posApi.eliminarCombo(productoId, sucursalId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.combos.all, refetchType: 'active' });
            toast.success('Combo eliminado exitosamente');
        },
        onError: createCRUDErrorHandler('delete', 'Combo'),
    });
}

/**
 * Hook para calcular precio de combo
 */
export function useComboPrecio(productoId: number | undefined | null, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.precio(productoId),
        queryFn: () => posApi.calcularPrecioCombo(productoId!),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para verificar stock de combo
 */
export function useComboStock(productoId: number | undefined | null, cantidad: number = 1, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.combos.stock(productoId, cantidad),
        queryFn: () => posApi.verificarStockCombo(productoId!, cantidad),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIMES.REAL_TIME, // 30 segundos - stock cambia frecuentemente
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}
