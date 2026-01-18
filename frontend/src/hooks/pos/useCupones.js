/**
 * ====================================================================
 * HOOKS DE CUPONES DE DESCUENTO
 * ====================================================================
 *
 * Hooks para gestión de cupones en POS:
 * - Validación de cupones
 * - Aplicación de cupones
 * - CRUD de cupones (administración)
 *
 * Ene 2026 - Fase 2 POS
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';

// =========================================================================
// HOOKS PARA POS (Uso en ventas)
// =========================================================================

/**
 * Hook para obtener cupones vigentes (selector en POS)
 * GET /pos/cupones/vigentes
 */
export function useCuponesVigentes() {
  return useQuery({
    queryKey: ['cupones-vigentes'],
    queryFn: async () => {
      const response = await posApi.listarCuponesVigentes();
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para validar un cupón (preview sin aplicar)
 * POST /pos/cupones/validar
 * @returns mutation con { mutateAsync, isLoading, ... }
 */
export function useValidarCupon() {
  return useMutation({
    mutationFn: async ({ codigo, subtotal, clienteId, productosIds }) => {
      const response = await posApi.validarCupon({
        codigo,
        subtotal,
        cliente_id: clienteId,
        productos_ids: productosIds,
      });
      return response.data.data;
    },
  });
}

/**
 * Hook para aplicar un cupón a una venta
 * POST /pos/cupones/aplicar
 */
export function useAplicarCupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cuponId, ventaPosId, clienteId, subtotalAntes }) => {
      const response = await posApi.aplicarCupon({
        cupon_id: cuponId,
        venta_pos_id: ventaPosId,
        cliente_id: clienteId,
        subtotal_antes: subtotalAntes,
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar venta para refrescar totales
      queryClient.invalidateQueries({ queryKey: ['venta', variables.ventaPosId] });
      queryClient.invalidateQueries({ queryKey: ['cupones-vigentes'] });
    },
  });
}

// =========================================================================
// HOOKS PARA ADMINISTRACIÓN DE CUPONES
// =========================================================================

/**
 * Hook para listar cupones con paginación (admin)
 * GET /pos/cupones
 * @param {Object} params - { page, limit, busqueda, activo, vigente, ordenPor, orden }
 */
export function useCupones(params = {}) {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);
  const sucursalId = sucursalActiva?.id;

  return useQuery({
    queryKey: ['cupones', params, sucursalId],
    queryFn: async () => {
      const sanitizedParams = sanitizeParams(params);

      // Agregar sucursalId para verificación de permisos
      if (sucursalId) {
        sanitizedParams.sucursalId = sucursalId;
      }

      const response = await posApi.listarCupones(sanitizedParams);
      return {
        cupones: response.data.data,
        paginacion: response.data.pagination,
      };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    keepPreviousData: true,
    enabled: !!sucursalId, // Solo ejecutar si hay sucursal
  });
}

/**
 * Hook para obtener cupón por ID
 * GET /pos/cupones/:id
 */
export function useCupon(id) {
  return useQuery({
    queryKey: ['cupon', id],
    queryFn: async () => {
      const response = await posApi.obtenerCupon(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

/**
 * Hook para crear cupón
 * POST /pos/cupones
 */
export function useCrearCupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await posApi.crearCupon(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      queryClient.invalidateQueries({ queryKey: ['cupones-vigentes'] });
    },
  });
}

/**
 * Hook para actualizar cupón
 * PUT /pos/cupones/:id
 */
export function useActualizarCupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await posApi.actualizarCupon(id, data);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      queryClient.invalidateQueries({ queryKey: ['cupon', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cupones-vigentes'] });
    },
  });
}

/**
 * Hook para eliminar cupón
 * DELETE /pos/cupones/:id
 */
export function useEliminarCupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await posApi.eliminarCupon(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      queryClient.invalidateQueries({ queryKey: ['cupones-vigentes'] });
    },
  });
}

/**
 * Hook para obtener historial de uso de un cupón
 * GET /pos/cupones/:id/historial
 */
export function useHistorialCupon(cuponId, params = {}) {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);
  const sucursalId = sucursalActiva?.id;

  return useQuery({
    queryKey: ['cupon-historial', cuponId, params, sucursalId],
    queryFn: async () => {
      const paramsWithSucursal = { ...params };
      if (sucursalId) {
        paramsWithSucursal.sucursalId = sucursalId;
      }
      const response = await posApi.obtenerHistorialCupon(cuponId, paramsWithSucursal);
      return response.data.data;
    },
    enabled: !!cuponId && !!sucursalId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 segundos
  });
}

/**
 * Hook para obtener estadísticas de un cupón
 * GET /pos/cupones/:id/estadisticas
 */
export function useEstadisticasCupon(cuponId) {
  const sucursalActiva = useSucursalStore(selectSucursalActiva);
  const sucursalId = sucursalActiva?.id;

  return useQuery({
    queryKey: ['cupon-estadisticas', cuponId, sucursalId],
    queryFn: async () => {
      const params = sucursalId ? { sucursalId } : {};
      const response = await posApi.obtenerEstadisticasCupon(cuponId, params);
      return response.data.data;
    },
    enabled: !!cuponId && !!sucursalId,
    staleTime: STALE_TIMES.FREQUENT, // 1 minuto
  });
}

/**
 * Hook para cambiar estado de cupón (activar/desactivar)
 * PATCH /pos/cupones/:id/estado
 */
export function useCambiarEstadoCupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, activo }) => {
      const response = await posApi.cambiarEstadoCupon(id, activo);
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cupones'] });
      queryClient.invalidateQueries({ queryKey: ['cupon', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['cupones-vigentes'] });
    },
  });
}
