/**
 * Mutations: Batch Picking (Wave Picking)
 * React Query hooks de escritura para batch picking
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchPickingApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import { BATCH_PICKING_KEYS } from './constants';
import { OPERACIONES_ALMACEN_KEYS } from '../operaciones-almacen';

/**
 * Hook para crear batch de picking
 */
export function useCrearBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ sucursalId, operacionIds, nombre }) => {
      const response = await batchPickingApi.crear({
        sucursal_id: sucursalId,
        operacion_ids: operacionIds,
        nombre,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Batch creado exitosamente');
    },
    onError: createCRUDErrorHandler('create', 'Batch'),
  });
}

/**
 * Hook para actualizar batch
 */
export function useActualizarBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await batchPickingApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.all);
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.detail(result.id));
      toast.success('Batch actualizado');
    },
    onError: createCRUDErrorHandler('update', 'Batch'),
  });
}

/**
 * Hook para eliminar batch (solo en borrador)
 */
export function useEliminarBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await batchPickingApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Batch eliminado');
    },
    onError: createCRUDErrorHandler('delete', 'Batch'),
  });
}

/**
 * Hook para agregar operación al batch
 */
export function useAgregarOperacionBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ batchId, operacionId }) => {
      const response = await batchPickingApi.agregarOperacion(batchId, {
        operacion_id: operacionId,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.detail(variables.batchId));
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.listaConsolidada(variables.batchId));
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Operación agregada al batch');
    },
    onError: createCRUDErrorHandler('create', 'Operación'),
  });
}

/**
 * Hook para quitar operación del batch
 */
export function useQuitarOperacionBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ batchId, operacionId }) => {
      const response = await batchPickingApi.quitarOperacion(batchId, operacionId);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.detail(variables.batchId));
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.listaConsolidada(variables.batchId));
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Operación quitada del batch');
    },
    onError: createCRUDErrorHandler('delete', 'Operación'),
  });
}

/**
 * Hook para iniciar procesamiento del batch
 */
export function useIniciarBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await batchPickingApi.iniciar(id);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.all);
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.detail(id));
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Batch iniciado');
    },
    onError: createCRUDErrorHandler('update', 'Batch'),
  });
}

/**
 * Hook para procesar item del batch
 */
export function useProcesarItemBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ batchId, productoId, varianteId, ubicacionId, cantidad }) => {
      const response = await batchPickingApi.procesarItem(batchId, {
        producto_id: productoId,
        variante_id: varianteId,
        ubicacion_id: ubicacionId,
        cantidad,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.detail(variables.batchId));
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.listaConsolidada(variables.batchId));
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.estadisticas(variables.batchId));
      toast.success('Item procesado');
    },
    onError: createCRUDErrorHandler('update', 'Item'),
  });
}

/**
 * Hook para completar batch
 */
export function useCompletarBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await batchPickingApi.completar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      // Invalidar solo queries activas de inventario
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.movimientos.all,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.productos.stockCritico,
        refetchType: 'active'
      });
      toast.success('Batch completado');
    },
    onError: createCRUDErrorHandler('update', 'Batch'),
  });
}

/**
 * Hook para cancelar batch
 */
export function useCancelarBatch() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await batchPickingApi.cancelar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(BATCH_PICKING_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Batch cancelado');
    },
    onError: createCRUDErrorHandler('delete', 'Batch'),
  });
}
