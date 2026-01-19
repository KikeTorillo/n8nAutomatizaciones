/**
 * ====================================================================
 * MUTATIONS: Operaciones de Almacén
 * ====================================================================
 * React Query hooks de escritura
 * Ene 2026 - Fragmentación de hooks
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { operacionesAlmacenApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { OPERACIONES_ALMACEN_KEYS } from './constants';
import { queryKeys } from '@/hooks/config';

/**
 * Hook para crear operación manual
 */
export function useCrearOperacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (data) => {
      const response = await operacionesAlmacenApi.crear(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Operación creada exitosamente');
    },
    onError: createCRUDErrorHandler('create', 'Operación'),
  });
}

/**
 * Hook para actualizar operación
 */
export function useActualizarOperacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await operacionesAlmacenApi.actualizar(id, data);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
      toast.success('Operación actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Operación'),
  });
}

/**
 * Hook para asignar operación a usuario
 */
export function useAsignarOperacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, usuarioId }) => {
      const response = await operacionesAlmacenApi.asignar(id, { usuario_id: usuarioId });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
      toast.success('Operación asignada');
    },
    onError: createCRUDErrorHandler('update', 'Operación'),
  });
}

/**
 * Hook para iniciar operación
 */
export function useIniciarOperacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const response = await operacionesAlmacenApi.iniciar(id);
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
      toast.success('Operación iniciada');
    },
    onError: createCRUDErrorHandler('update', 'Operación'),
  });
}

/**
 * Hook para completar operación
 */
export function useCompletarOperacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, items }) => {
      const response = await operacionesAlmacenApi.completar(id, { items });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      if (result.operacion_siguiente_id) {
        queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.operacion_siguiente_id));
      }
      // Invalidar solo queries activas de inventario
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.movimientos.all,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventario.productos.stockCritico,
        refetchType: 'active'
      });
      toast.success('Operación completada');
    },
    onError: createCRUDErrorHandler('update', 'Operación'),
  });
}

/**
 * Hook para cancelar operación
 */
export function useCancelarOperacion() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await operacionesAlmacenApi.cancelar(id, { motivo });
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.detail(result.id));
      toast.success('Operación cancelada');
    },
    onError: createCRUDErrorHandler('delete', 'Operación'),
  });
}

/**
 * Hook para procesar item individual
 */
export function useProcesarItem() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ itemId, cantidadProcesada, ubicacionDestinoId }) => {
      const response = await operacionesAlmacenApi.procesarItem(itemId, {
        cantidad_procesada: cantidadProcesada,
        ubicacion_destino_id: ubicacionDestinoId,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Item procesado');
    },
    onError: createCRUDErrorHandler('update', 'Item'),
  });
}

/**
 * Hook para cancelar item
 */
export function useCancelarItem() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (itemId) => {
      const response = await operacionesAlmacenApi.cancelarItem(itemId);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(OPERACIONES_ALMACEN_KEYS.all);
      toast.success('Item cancelado');
    },
    onError: createCRUDErrorHandler('delete', 'Item'),
  });
}
