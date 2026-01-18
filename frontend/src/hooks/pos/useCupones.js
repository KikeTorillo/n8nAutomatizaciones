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
 * Ene 2026 - Migrado a createCRUDHooks
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectSucursalActiva } from '@/store/sucursalStore';
import { sanitizeParams } from '@/lib/params';
import { createCRUDHooks } from '@/hooks/factories';

// =========================================================================
// HOOKS CRUD VIA FACTORY (base)
// =========================================================================

const baseHooks = createCRUDHooks({
  name: 'cupon',
  namePlural: 'cupones',
  api: posApi,
  baseKey: 'cupones',
  apiMethods: {
    list: 'listarCupones',
    get: 'obtenerCupon',
    create: 'crearCupon',
    update: 'actualizarCupon',
    delete: 'eliminarCupon',
  },
  invalidateOnCreate: ['cupones', 'cupones-vigentes'],
  invalidateOnUpdate: ['cupones', 'cupones-vigentes'],
  invalidateOnDelete: ['cupones', 'cupones-vigentes'],
  staleTime: STALE_TIMES.DYNAMIC,
  responseKey: 'cupones',
  keepPreviousData: true,
});

// =========================================================================
// WRAPPER useCupones (agrega sucursalId del store)
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
    staleTime: STALE_TIMES.DYNAMIC,
    keepPreviousData: true,
    enabled: !!sucursalId,
  });
}

// Exportar hooks CRUD (mutations no requieren sucursalId)
export const useCupon = baseHooks.useDetail;
export const useCrearCupon = baseHooks.useCreate;
export const useActualizarCupon = baseHooks.useUpdate;
export const useEliminarCupon = baseHooks.useDelete;

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
// HOOKS ESPECIALIZADOS DE ADMINISTRACION
// =========================================================================

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
