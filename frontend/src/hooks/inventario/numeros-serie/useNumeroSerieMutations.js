/**
 * Mutations para operaciones de Numeros de Serie
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { numeroSerieQueryKeys } from './numeroSerieConstants';

// ==================== MUTACIONES ====================

/**
 * Hook para crear numero de serie
 */
export function useCrearNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const response = await inventarioApi.crearNumeroSerie(data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('create', 'número de serie'),
    });
}

/**
 * Hook para crear multiples numeros de serie
 */
export function useCrearNumerosSerieMultiple() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (items) => {
            const response = await inventarioApi.crearNumerosSerieMultiple({ items });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('create', 'números de serie'),
    });
}

/**
 * Hook para vender numero de serie
 */
export function useVenderNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ventaId, clienteId }) => {
            const response = await inventarioApi.venderNumeroSerie(id, {
                venta_id: ventaId,
                cliente_id: clienteId
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'número de serie'),
    });
}

/**
 * Hook para transferir numero de serie
 */
export function useTransferirNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, sucursalDestinoId, ubicacionDestinoId, notas }) => {
            const response = await inventarioApi.transferirNumeroSerie(id, {
                sucursal_destino_id: sucursalDestinoId,
                ubicacion_destino_id: ubicacionDestinoId,
                notas
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'número de serie'),
    });
}

/**
 * Hook para devolver numero de serie
 */
export function useDevolverNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, sucursalId, ubicacionId, motivo }) => {
            const response = await inventarioApi.devolverNumeroSerie(id, {
                sucursal_id: sucursalId,
                ubicacion_id: ubicacionId,
                motivo
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'número de serie'),
    });
}

/**
 * Hook para marcar como defectuoso
 */
export function useMarcarDefectuoso() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, motivo }) => {
            const response = await inventarioApi.marcarNumeroSerieDefectuoso(id, { motivo });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'número de serie'),
    });
}

/**
 * Hook para reservar numero de serie
 */
export function useReservarNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, notas }) => {
            const response = await inventarioApi.reservarNumeroSerie(id, { notas });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'número de serie'),
    });
}

/**
 * Hook para liberar reserva
 */
export function useLiberarReservaNumeroSerie() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const response = await inventarioApi.liberarReservaNumeroSerie(id);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.all, refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'número de serie'),
    });
}

/**
 * Hook para actualizar garantia
 */
export function useActualizarGarantia() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, garantiaData }) => {
            const response = await inventarioApi.actualizarGarantiaNumeroSerie(id, garantiaData);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: numeroSerieQueryKeys.detail(variables.id), refetchType: 'active' });
        },
        onError: createCRUDErrorHandler('update', 'garantía'),
    });
}
