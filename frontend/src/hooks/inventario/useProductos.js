/**
 * ====================================================================
 * HOOKS CRUD PRODUCTOS
 * ====================================================================
 *
 * Ene 2026 - Migrado a createCRUDHooks
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer, createSearchHook } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

// Sanitizador para datos de producto
const sanitizeProducto = createSanitizer([
  'descripcion',
  'sku',
  'codigo_barras',
  'notas',
  { name: 'categoria_id', type: 'id' },
  { name: 'proveedor_id', type: 'id' },
  { name: 'dias_vida_util', type: 'number' },
]);

const hooks = createCRUDHooks({
  name: 'producto',
  namePlural: 'productos',
  api: inventarioApi,
  baseKey: 'productos',
  apiMethods: {
    list: 'listarProductos',
    get: 'obtenerProducto',
    create: 'crearProducto',
    update: 'actualizarProducto',
    delete: 'eliminarProducto',
  },
  sanitize: sanitizeProducto,
  invalidateOnCreate: ['productos', 'stock-critico', 'valor-inventario'],
  invalidateOnUpdate: ['productos', 'stock-critico'],
  invalidateOnDelete: ['productos', 'stock-critico'],
  errorMessages: {
    create: {
      409: 'Ya existe un producto con ese SKU o código de barras',
      403: 'No tienes permisos para crear productos o alcanzaste el límite de tu plan',
    },
    update: { 409: 'Ya existe otro producto con ese SKU o código de barras' },
    delete: { 409: 'No se puede eliminar el producto porque tiene movimientos o ventas asociadas' },
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
  responseKey: 'productos',
  usePreviousData: true, // Evita flash de loading durante paginación
});

// Exportar hooks CRUD
export const useProductos = hooks.useList;
export const useProducto = hooks.useDetail;
export const useCrearProducto = hooks.useCreate;
export const useActualizarProducto = hooks.useUpdate;
export const useEliminarProducto = hooks.useDelete;

// =========================================================================
// HOOKS ESPECIALIZADOS
// =========================================================================

/**
 * Hook para buscar productos (full-text search + código de barras)
 * Refactorizado con createSearchHook - Ene 2026
 * @param {string} termino - Término de búsqueda
 * @param {Object} options - { tipo_busqueda?, categoria_id?, proveedor_id?, solo_activos?, solo_con_stock?, limit? }
 */
export const useBuscarProductos = createSearchHook({
  key: 'productos',
  searchFn: (params) => inventarioApi.buscarProductos(sanitizeParams(params)),
  transformResponse: (data) => data || [],
});

/**
 * Hook para obtener productos con stock crítico
 * Ene 2026: Cambiado a REAL_TIME (30s) - datos críticos para reabastecimiento
 */
export function useStockCritico() {
  return useQuery({
    queryKey: queryKeys.inventario.productos.stockCritico,
    queryFn: async () => {
      const response = await inventarioApi.obtenerStockCritico();
      return response.data.data.productos || [];
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 seg - stock crítico requiere actualización frecuente
  });
}

/**
 * Hook para crear múltiples productos (bulk 1-50)
 */
export function useBulkCrearProductos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productos) => {
      const response = await inventarioApi.bulkCrearProductos({ productos });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.stockCritico, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.valoracion.resumen, refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Productos', {
      403: 'Alcanzaste el límite de productos de tu plan',
      400: 'Algunos productos tienen datos inválidos',
    }),
  });
}

/**
 * Hook para ajustar stock manualmente (conteo físico, correcciones)
 * Ene 2026: Soporta ubicacion_id opcional para integración WMS
 */
export function useAjustarStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cantidad_ajuste, motivo, tipo_movimiento, ubicacion_id }) => {
      const response = await inventarioApi.ajustarStock(id, {
        cantidad_ajuste,
        motivo,
        tipo_movimiento,
        ubicacion_id, // Ubicación destino opcional
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.detail(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.stockCritico, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.movimientos.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.kardex(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-ubicacion'], refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Stock', {
      400: 'Datos inválidos. Revisa cantidad y tipo de movimiento',
    }),
  });
}

// =========================================================================
// HOOKS DE STOCK POR UBICACIÓN (Ene 2026)
// =========================================================================

/**
 * Hook para obtener stock de un producto desglosado por ubicación
 * @param {number} productoId - ID del producto
 * @param {Object} options - { sucursal_id?, usuario_id?, enabled? }
 * @returns {Object} { total, ubicaciones: [...] }
 */
export function useStockPorUbicacion(productoId, options = {}) {
  const { sucursal_id, usuario_id, enabled = true } = options;

  return useQuery({
    queryKey: ['stock-ubicacion', productoId, { sucursal_id, usuario_id }],
    queryFn: async () => {
      const params = sanitizeParams({ sucursal_id, usuario_id });
      const response = await inventarioApi.obtenerStockPorUbicacion(productoId, params);
      return response.data.data;
    },
    enabled: enabled && !!productoId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 seg - datos de ubicación cambian frecuentemente
  });
}

/**
 * Hook para obtener stock del producto en la ubicación del usuario actual
 * @param {number} productoId - ID del producto
 * @param {Object} options - { enabled? }
 * @returns {Object} { cantidad, ubicacion_id, ubicacion_nombre, es_ubicacion_asignada }
 */
export function useMiStock(productoId, options = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['mi-stock', productoId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerMiStock(productoId);
      return response.data.data;
    },
    enabled: enabled && !!productoId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para listar productos con stock filtrado por ubicación
 * Útil para mostrar stock de "mi ubicación" vs "stock total"
 * @param {Object} params - { ubicacion_id?, sucursal_id?, usuario_ubicacion?, solo_con_stock?, busqueda?, categoria_id?, limit?, offset? }
 * @returns {Object} { productos, total, filtro_aplicado }
 */
export function useProductosStockFiltrado(params = {}) {
  return useQuery({
    queryKey: ['productos-stock-filtrado', params],
    queryFn: async () => {
      const cleanParams = sanitizeParams(params);
      const response = await inventarioApi.listarProductosStockFiltrado(cleanParams);
      return response.data.data;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    placeholderData: (previousData) => previousData, // Mantener datos anteriores durante refetch
  });
}
