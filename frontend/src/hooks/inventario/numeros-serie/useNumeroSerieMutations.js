/**
 * Mutations para operaciones de Numeros de Serie
 *
 * Feb 2026 - Migrado a createStatusMutationHook (status mutations)
 * Se mantienen manuales: useCrearNumeroSerie y useCrearNumerosSerieMultiple (bulk create)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { createStatusMutationHook } from '@/hooks/factories';
import { numeroSerieQueryKeys } from './numeroSerieConstants';

// ==================== CREAR (mantener manual por bulk) ====================

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

// ==================== STATUS MUTATIONS (via factory) ====================

/** Hook para vender numero de serie */
export const useVenderNumeroSerie = createStatusMutationHook({
    mutationFn: ({ id, ventaId, clienteId }) =>
        inventarioApi.venderNumeroSerie(id, { venta_id: ventaId, cliente_id: clienteId }),
    queryKey: numeroSerieQueryKeys.all[0],
    entityName: 'número de serie',
});

/** Hook para transferir numero de serie */
export const useTransferirNumeroSerie = createStatusMutationHook({
    mutationFn: ({ id, sucursalDestinoId, ubicacionDestinoId, notas }) =>
        inventarioApi.transferirNumeroSerie(id, {
            sucursal_destino_id: sucursalDestinoId,
            ubicacion_destino_id: ubicacionDestinoId,
            notas,
        }),
    queryKey: numeroSerieQueryKeys.all[0],
    entityName: 'número de serie',
});

/** Hook para devolver numero de serie */
export const useDevolverNumeroSerie = createStatusMutationHook({
    mutationFn: ({ id, sucursalId, ubicacionId, motivo }) =>
        inventarioApi.devolverNumeroSerie(id, {
            sucursal_id: sucursalId,
            ubicacion_id: ubicacionId,
            motivo,
        }),
    queryKey: numeroSerieQueryKeys.all[0],
    entityName: 'número de serie',
});

/** Hook para marcar como defectuoso */
export const useMarcarDefectuoso = createStatusMutationHook({
    mutationFn: ({ id, motivo }) =>
        inventarioApi.marcarNumeroSerieDefectuoso(id, { motivo }),
    queryKey: numeroSerieQueryKeys.all[0],
    entityName: 'número de serie',
});

/** Hook para reservar numero de serie */
export const useReservarNumeroSerie = createStatusMutationHook({
    mutationFn: ({ id, notas }) =>
        inventarioApi.reservarNumeroSerie(id, { notas }),
    queryKey: numeroSerieQueryKeys.all[0],
    entityName: 'número de serie',
});

/** Hook para liberar reserva */
export const useLiberarReservaNumeroSerie = createStatusMutationHook({
    mutationFn: (id) =>
        inventarioApi.liberarReservaNumeroSerie(id),
    queryKey: numeroSerieQueryKeys.all[0],
    entityName: 'número de serie',
});

/** Hook para actualizar garantia */
export const useActualizarGarantia = createStatusMutationHook({
    mutationFn: ({ id, garantiaData }) =>
        inventarioApi.actualizarGarantiaNumeroSerie(id, garantiaData),
    queryKey: numeroSerieQueryKeys.all[0],
    getEntityId: (v) => v.id,
    entityName: 'garantía',
});
