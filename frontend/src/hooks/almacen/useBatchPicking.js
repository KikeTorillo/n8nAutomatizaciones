/**
 * ====================================================================
 * HOOKS: Batch Picking (Wave Picking)
 * ====================================================================
 * React Query hooks para gestión de batch picking consolidado
 * Agrupar múltiples operaciones de picking para procesamiento eficiente
 * Fecha: 31 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { batchPickingApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { OPERACIONES_ALMACEN_KEYS } from './useOperacionesAlmacen';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * QUERY KEYS para batch picking
 */
export const BATCH_PICKING_KEYS = {
  all: ['batch-picking'],
  list: (params) => [...BATCH_PICKING_KEYS.all, 'list', params],
  detail: (id) => [...BATCH_PICKING_KEYS.all, 'detail', id],
  listaConsolidada: (id) => [...BATCH_PICKING_KEYS.all, 'lista-consolidada', id],
  estadisticas: (id) => [...BATCH_PICKING_KEYS.all, 'estadisticas', id],
  pendientes: (sucursalId) => [...BATCH_PICKING_KEYS.all, 'pendientes', sucursalId],
  operacionesDisponibles: (sucursalId) => [...BATCH_PICKING_KEYS.all, 'operaciones-disponibles', sucursalId],
};

// ==================== QUERIES ====================

/**
 * Hook para listar batches con filtros
 * @param {Object} params - { sucursal_id?, estado?, estados?, asignado_a?, limit? }
 */
export function useBatchPickings(params = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useQuery({
    queryKey: BATCH_PICKING_KEYS.list(params),
    queryFn: async () => {
      const sanitizedParams = {
        ...params,
        sucursal_id: params.sucursal_id || getSucursalId() || undefined,
      };

      // Limpiar valores vacíos
      Object.keys(sanitizedParams).forEach(key => {
        if (sanitizedParams[key] === '' || sanitizedParams[key] === null || sanitizedParams[key] === undefined) {
          delete sanitizedParams[key];
        }
      });

      const response = await batchPickingApi.listar(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
  });
}

/**
 * Hook para obtener batch por ID con operaciones
 * @param {number} id - ID del batch
 */
export function useBatchPicking(id) {
  return useQuery({
    queryKey: BATCH_PICKING_KEYS.detail(id),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerPorId(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener lista consolidada de productos a recoger
 * @param {number} id - ID del batch
 */
export function useListaConsolidada(id) {
  return useQuery({
    queryKey: BATCH_PICKING_KEYS.listaConsolidada(id),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerListaConsolidada(id);
      return response.data.data || [];
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener estadísticas del batch
 * @param {number} id - ID del batch
 */
export function useEstadisticasBatch(id) {
  return useQuery({
    queryKey: BATCH_PICKING_KEYS.estadisticas(id),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerEstadisticas(id);
      return response.data.data || {};
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener batches pendientes de una sucursal
 * @param {number} sucursalId - ID de la sucursal
 */
export function useBatchesPendientes(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: BATCH_PICKING_KEYS.pendientes(efectiveSucursalId),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerPendientes(efectiveSucursalId);
      return response.data.data || [];
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para obtener operaciones de picking disponibles para batch
 * @param {number} sucursalId - ID de la sucursal
 */
export function useOperacionesDisponiblesParaBatch(sucursalId) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  return useQuery({
    queryKey: BATCH_PICKING_KEYS.operacionesDisponibles(efectiveSucursalId),
    queryFn: async () => {
      const response = await batchPickingApi.obtenerOperacionesDisponibles(efectiveSucursalId);
      return response.data.data || [];
    },
    enabled: !!efectiveSucursalId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

// ==================== MUTATIONS ====================

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
      // Invalidar inventario ya que puede haber movimientos de stock
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos-inventario'] });
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

// ==================== HOOK COMBINADO ====================

/**
 * Hook combinado para gestión de batch picking
 * @param {Object} options - { sucursalId }
 */
export function useBatchPickingManager({ sucursalId } = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const efectiveSucursalId = sucursalId || getSucursalId();

  // Queries
  const {
    data: batches = [],
    isLoading: loadingBatches,
    error: errorBatches,
    refetch: refetchBatches,
  } = useBatchPickings({ sucursal_id: efectiveSucursalId });

  const {
    data: pendientes = [],
    isLoading: loadingPendientes,
  } = useBatchesPendientes(efectiveSucursalId);

  const {
    data: operacionesDisponibles = [],
    isLoading: loadingOperacionesDisponibles,
    refetch: refetchOperacionesDisponibles,
  } = useOperacionesDisponiblesParaBatch(efectiveSucursalId);

  // Mutations
  const crearMutation = useCrearBatch();
  const actualizarMutation = useActualizarBatch();
  const eliminarMutation = useEliminarBatch();
  const agregarOperacionMutation = useAgregarOperacionBatch();
  const quitarOperacionMutation = useQuitarOperacionBatch();
  const iniciarMutation = useIniciarBatch();
  const procesarItemMutation = useProcesarItemBatch();
  const completarMutation = useCompletarBatch();
  const cancelarMutation = useCancelarBatch();

  return {
    // Data
    batches,
    pendientes,
    operacionesDisponibles,
    sucursalId: efectiveSucursalId,

    // Loading
    loadingBatches,
    loadingPendientes,
    loadingOperacionesDisponibles,
    isLoading: loadingBatches || loadingPendientes,

    // Errors
    errorBatches,
    hasError: !!errorBatches,

    // Actions
    refetch: refetchBatches,
    refetchOperacionesDisponibles,
    crear: crearMutation.mutateAsync,
    actualizar: actualizarMutation.mutateAsync,
    eliminar: eliminarMutation.mutateAsync,
    agregarOperacion: agregarOperacionMutation.mutateAsync,
    quitarOperacion: quitarOperacionMutation.mutateAsync,
    iniciar: iniciarMutation.mutateAsync,
    procesarItem: procesarItemMutation.mutateAsync,
    completar: completarMutation.mutateAsync,
    cancelar: cancelarMutation.mutateAsync,

    // Mutation states
    isCreating: crearMutation.isPending,
    isUpdating: actualizarMutation.isPending,
    isDeleting: eliminarMutation.isPending,
    isAddingOperation: agregarOperacionMutation.isPending,
    isRemovingOperation: quitarOperacionMutation.isPending,
    isStarting: iniciarMutation.isPending,
    isProcessingItem: procesarItemMutation.isPending,
    isCompleting: completarMutation.isPending,
    isCanceling: cancelarMutation.isPending,
  };
}

// ==================== ESTADOS BATCH ====================

export const ESTADOS_BATCH = {
  BORRADOR: 'borrador',
  CONFIRMADO: 'confirmado',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado',
};

export const LABELS_ESTADO_BATCH = {
  [ESTADOS_BATCH.BORRADOR]: 'Borrador',
  [ESTADOS_BATCH.CONFIRMADO]: 'Confirmado',
  [ESTADOS_BATCH.EN_PROCESO]: 'En Proceso',
  [ESTADOS_BATCH.COMPLETADO]: 'Completado',
  [ESTADOS_BATCH.CANCELADO]: 'Cancelado',
};

export const COLORES_ESTADO_BATCH = {
  [ESTADOS_BATCH.BORRADOR]: 'gray',
  [ESTADOS_BATCH.CONFIRMADO]: 'blue',
  [ESTADOS_BATCH.EN_PROCESO]: 'yellow',
  [ESTADOS_BATCH.COMPLETADO]: 'green',
  [ESTADOS_BATCH.CANCELADO]: 'red',
};

