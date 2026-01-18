/**
 * Hook para Sistema de Reorden Automatico
 * Fecha: 29 Diciembre 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { reordenApi, inventarioApi } from '@/services/api/endpoints';
import { useToast } from '@/hooks/utils';

// ==================== DASHBOARD ====================

/**
 * Hook para obtener dashboard de reorden
 */
export function useDashboardReorden() {
  return useQuery({
    queryKey: ['reorden', 'dashboard'],
    queryFn: async () => {
      const response = await reordenApi.obtenerDashboard();
      return response.data.data;
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    refetchInterval: 1000 * 60 * 5, // Refrescar cada 5 minutos
  });
}

// ==================== PRODUCTOS BAJO MINIMO ====================

/**
 * Hook para obtener productos que necesitan reabastecimiento
 */
export function useProductosBajoMinimo(filtros = {}) {
  return useQuery({
    queryKey: ['reorden', 'productos-bajo-minimo', filtros],
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
    queryKey: ['reorden', 'rutas', filtros],
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
    queryKey: ['reorden', 'reglas', filtros],
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
    queryKey: ['reorden', 'regla', id],
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
      queryClient.invalidateQueries({ queryKey: ['reorden', 'reglas'] });
      queryClient.invalidateQueries({ queryKey: ['reorden', 'dashboard'] });
      toast.success('Regla de reorden creada');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Error al crear regla';
      toast.error(msg);
    },
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
      queryClient.invalidateQueries({ queryKey: ['reorden', 'reglas'] });
      queryClient.invalidateQueries({ queryKey: ['reorden', 'regla', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['reorden', 'dashboard'] });
      toast.success('Regla de reorden actualizada');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Error al actualizar regla';
      toast.error(msg);
    },
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
      queryClient.invalidateQueries({ queryKey: ['reorden', 'reglas'] });
      queryClient.invalidateQueries({ queryKey: ['reorden', 'dashboard'] });
      toast.success('Regla de reorden eliminada');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Error al eliminar regla';
      toast.error(msg);
    },
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
      queryClient.invalidateQueries({ queryKey: ['reorden'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'] });
      toast.success('Reorden ejecutado exitosamente');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Error al ejecutar reorden';
      toast.error(msg);
    },
  });
}

// ==================== LOGS ====================

/**
 * Hook para listar logs de ejecucion
 */
export function useLogsReorden(filtros = {}) {
  return useQuery({
    queryKey: ['reorden', 'logs', filtros],
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
    queryKey: ['reorden', 'log', id],
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
    queryKey: ['inventario', 'historico-stock', productoId, dias],
    queryFn: async () => {
      const response = await inventarioApi.obtenerHistoricoProducto(productoId, { dias });
      return response.data.data;
    },
    enabled: !!productoId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}
