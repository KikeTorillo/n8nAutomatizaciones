/**
 * Hook para Sistema de Reorden Automatico
 * Fecha: 29 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { reordenApi, inventarioApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// ==================== DASHBOARD ====================

/**
 * Hook para obtener dashboard de reorden
 */
export function useDashboardReorden() {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.dashboard,
    queryFn: async () => {
      const response = await reordenApi.obtenerDashboard();
      return response.data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    refetchInterval: 1000 * 60 * 2, // Refrescar cada 2 minutos (alineado con staleTime)
  });
}

// ==================== PRODUCTOS BAJO MINIMO ====================

/**
 * Hook para obtener productos que necesitan reabastecimiento
 */
export function useProductosBajoMinimo(filtros = {}) {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.productosBajoMinimo(filtros),
    queryFn: async () => {
      const response = await reordenApi.productosBajoMinimo(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

// ==================== RUTAS DE OPERACION ====================

/**
 * Hook para obtener rutas de operacion disponibles
 */
export function useRutasOperacion(filtros = {}) {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.rutas(filtros),
    queryFn: async () => {
      const response = await reordenApi.listarRutas(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

// ==================== REGLAS ====================

/**
 * Hook para listar reglas de reabastecimiento
 */
export function useReglasReorden(filtros = {}) {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.reglas.list(filtros),
    queryFn: async () => {
      const response = await reordenApi.listarReglas(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para obtener una regla por ID
 */
export function useReglaReorden(id) {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.reglas.detail(id),
    queryFn: async () => {
      const response = await reordenApi.obtenerRegla(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para crear regla de reabastecimiento
 */
export function useCrearReglaReorden() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data) => reordenApi.crearRegla(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.reglas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.dashboard });
      toast.success('Regla de reorden creada');
    },
    onError: createCRUDErrorHandler('create', 'Regla'),
  });
}

/**
 * Hook para actualizar regla de reabastecimiento
 */
export function useActualizarReglaReorden() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }) => reordenApi.actualizarRegla(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.reglas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.reglas.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.dashboard });
      toast.success('Regla de reorden actualizada');
    },
    onError: createCRUDErrorHandler('update', 'Regla'),
  });
}

/**
 * Hook para eliminar regla de reabastecimiento
 */
export function useEliminarReglaReorden() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) => reordenApi.eliminarRegla(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.reglas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.dashboard });
      toast.success('Regla de reorden eliminada');
    },
    onError: createCRUDErrorHandler('delete', 'Regla'),
  });
}

// ==================== EJECUCION ====================

/**
 * Hook para ejecutar reorden manualmente
 */
export function useEjecutarReordenManual() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: () => reordenApi.ejecutarManual(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.almacen.reorden.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all });
      toast.success('Reorden ejecutado exitosamente');
    },
    onError: createCRUDErrorHandler('create', 'Reorden'),
  });
}

// ==================== LOGS ====================

/**
 * Hook para listar logs de ejecucion
 */
export function useLogsReorden(filtros = {}) {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.logs.list(filtros),
    queryFn: async () => {
      const response = await reordenApi.listarLogs(filtros);
      return response.data.data;
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para obtener detalle de un log
 */
export function useLogReorden(id) {
  return useQuery({
    queryKey: queryKeys.almacen.reorden.logs.detail(id),
    queryFn: async () => {
      const response = await reordenApi.obtenerLog(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// ==================== HISTORICO DE STOCK ====================

/**
 * Hook para obtener historico de stock de un producto para grafico de pronostico
 * @param {number} productoId - ID del producto
 * @param {number} dias - Dias de historico (default: 30)
 */
export function useHistoricoStock(productoId, dias = 30) {
  return useQuery({
    queryKey: queryKeys.inventario.productos.historicoStock(productoId, dias),
    queryFn: async () => {
      const response = await inventarioApi.obtenerHistoricoProducto(productoId, { dias });
      return response.data.data;
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}
