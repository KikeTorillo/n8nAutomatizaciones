/**
 * ====================================================================
 * HOOK - MODIFICADORES
 * ====================================================================
 *
 * Hooks para gestion de grupos de modificadores y modificadores
 * individuales en el modulo POS.
 *
 * Ene 2026 - Fase 3 POS
 * Feb 2026 - Extraido de useCombosModificadores.js
 * Feb 2026 - Migrado a TypeScript
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { GrupoModificadores, Modificador } from '@/types/entities';

const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 30 * 60 * 1000; // 30 minutos

// ========================================================================
// INTERFACES LOCALES
// ========================================================================

interface ActualizarGrupoData {
    id: number;
    data: Partial<GrupoModificadores>;
}

interface ActualizarModificadorData {
    id: number;
    data: Partial<Modificador>;
}

// ========================================================================
// GRUPOS DE MODIFICADORES
// ========================================================================

/**
 * Hook para listar grupos de modificadores
 */
export function useGruposModificadores(params: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.grupos(params),
        queryFn: () => posApi.listarGruposModificadores(params),
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para crear grupo de modificadores
 */
export function useCrearGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data: Partial<GrupoModificadores>) => posApi.crearGrupoModificadores(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast.success('El grupo de modificadores se ha creado exitosamente');
        },
        onError: createCRUDErrorHandler('create', 'Grupo de modificadores'),
    });
}

/**
 * Hook para actualizar grupo de modificadores
 */
export function useActualizarGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }: ActualizarGrupoData) => posApi.actualizarGrupoModificadores(id, data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast.success('El grupo de modificadores se ha actualizado exitosamente');
        },
        onError: createCRUDErrorHandler('update', 'Grupo de modificadores'),
    });
}

/**
 * Hook para eliminar grupo de modificadores
 */
export function useEliminarGrupoModificadores() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id: number) => posApi.eliminarGrupoModificadores(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast.success('El grupo de modificadores se ha eliminado exitosamente');
        },
        onError: createCRUDErrorHandler('delete', 'Grupo de modificadores'),
    });
}

// ========================================================================
// MODIFICADORES
// ========================================================================

/**
 * Hook para crear modificador
 */
export function useCrearModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (data: Partial<Modificador>) => posApi.crearModificador(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast.success('El modificador se ha creado exitosamente');
        },
        onError: createCRUDErrorHandler('create', 'Modificador'),
    });
}

/**
 * Hook para actualizar modificador
 */
export function useActualizarModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: ({ id, data }: ActualizarModificadorData) => posApi.actualizarModificador(id, data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast.success('El modificador se ha actualizado exitosamente');
        },
        onError: createCRUDErrorHandler('update', 'Modificador'),
    });
}

/**
 * Hook para eliminar modificador
 */
export function useEliminarModificador() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: (id: number) => posApi.eliminarModificador(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.pos.modificadores.gruposBase, refetchType: 'active' });
            toast.success('El modificador se ha eliminado exitosamente');
        },
        onError: createCRUDErrorHandler('delete', 'Modificador'),
    });
}

// ========================================================================
// MODIFICADORES DE PRODUCTO (Para uso en POS)
// ========================================================================

/**
 * Hook para obtener modificadores de un producto
 */
export function useModificadoresProducto(productoId: number | undefined | null, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.producto(productoId),
        queryFn: () => posApi.obtenerModificadoresProducto(productoId!),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}

/**
 * Hook para verificar si un producto tiene modificadores
 */
export function useTieneModificadores(productoId: number | undefined | null, options: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: queryKeys.pos.modificadores.tiene(productoId),
        queryFn: () => posApi.tieneModificadores(productoId!),
        enabled: !!productoId && options.enabled !== false,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        select: (response: any) => response.data?.data || response.data,
        ...options,
    });
}
