/**
 * ====================================================================
 * HOOKS CRUD PRODUCTOS
 * ====================================================================
 *
 * Ene 2026 - Migrado a createCRUDHooks
 * Feb 2026 - Migrado a TypeScript
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer, createSearchHook } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { Producto } from '@/types/entities';

// =========================================================================
// TIPOS
// =========================================================================

/** Filtros para búsqueda de productos */
interface BusquedaProductosParams {
  termino: string;
  tipo_busqueda?: 'nombre' | 'sku' | 'codigo_barras' | 'all';
  categoria_id?: number;
  proveedor_id?: number;
  solo_activos?: boolean;
  solo_con_stock?: boolean;
  limit?: number;
}

/** Respuesta de stock crítico */
interface StockCriticoResponse {
  productos: Producto[];
}

/** Datos para bulk crear productos */
interface BulkCrearProductosData {
  productos: Omit<Producto, 'id' | 'created_at' | 'updated_at' | 'organizacion_id'>[];
}

/** Respuesta bulk crear productos */
interface BulkCrearProductosResponse {
  creados: number;
  errores?: Array<{ index: number; error: string }>;
}

/** Parámetros para ajustar stock */
interface AjustarStockParams {
  id: number;
  cantidad_ajuste: number;
  motivo: string;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste';
  ubicacion_id?: number;
}

/** Opciones para useStockPorUbicacion */
interface StockPorUbicacionOptions {
  sucursal_id?: number;
  usuario_id?: number;
  enabled?: boolean;
}

/** Respuesta de stock por ubicación */
interface StockPorUbicacionResponse {
  total: number;
  ubicaciones: Array<{
    ubicacion_id: number;
    ubicacion_nombre: string;
    cantidad: number;
  }>;
}

/** Opciones para useMiStock */
interface MiStockOptions {
  enabled?: boolean;
}

/** Respuesta de mi stock */
interface MiStockResponse {
  cantidad: number;
  ubicacion_id: number | null;
  ubicacion_nombre: string | null;
  es_ubicacion_asignada: boolean;
}

/** Parámetros para productos con stock filtrado */
interface ProductosStockFiltradoParams {
  ubicacion_id?: number;
  sucursal_id?: number;
  usuario_ubicacion?: boolean;
  solo_con_stock?: boolean;
  busqueda?: string;
  categoria_id?: number;
  limit?: number;
  offset?: number;
}

/** Respuesta de productos con stock filtrado */
interface ProductosStockFiltradoResponse {
  productos: Producto[];
  total: number;
  filtro_aplicado: {
    ubicacion_id?: number;
    ubicacion_nombre?: string;
  };
}

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
 * @param termino - Término de búsqueda
 * @param options - { tipo_busqueda?, categoria_id?, proveedor_id?, solo_activos?, solo_con_stock?, limit? }
 */
export const useBuscarProductos = createSearchHook({
  key: 'productos',
  searchFn: (params: BusquedaProductosParams) => inventarioApi.buscarProductos(sanitizeParams(params)),
  transformResponse: (data: Producto[] | undefined) => data || [],
});

/**
 * Hook para obtener productos con stock crítico
 * Ene 2026: Cambiado a REAL_TIME (30s) - datos críticos para reabastecimiento
 */
export function useStockCritico(): UseQueryResult<Producto[], Error> {
  return useQuery({
    queryKey: queryKeys.inventario.productos.stockCritico,
    queryFn: async () => {
      const response = await inventarioApi.obtenerStockCritico();
      return (response.data.data as StockCriticoResponse).productos || [];
    },
    staleTime: STALE_TIMES.REAL_TIME, // 30 seg - stock crítico requiere actualización frecuente
  });
}

/**
 * Hook para crear múltiples productos (bulk 1-50)
 */
export function useBulkCrearProductos(): UseMutationResult<
  BulkCrearProductosResponse,
  Error,
  BulkCrearProductosData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BulkCrearProductosData) => {
      const response = await inventarioApi.bulkCrearProductos(data);
      return response.data.data as BulkCrearProductosResponse;
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
export function useAjustarStock(): UseMutationResult<unknown, Error, AjustarStockParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cantidad_ajuste, motivo, tipo_movimiento, ubicacion_id }: AjustarStockParams) => {
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
 * @param productoId - ID del producto
 * @param options - { sucursal_id?, usuario_id?, enabled? }
 * @returns { total, ubicaciones: [...] }
 */
export function useStockPorUbicacion(
  productoId: number | null | undefined,
  options: StockPorUbicacionOptions = {}
): UseQueryResult<StockPorUbicacionResponse, Error> {
  const { sucursal_id, usuario_id, enabled = true } = options;

  return useQuery({
    queryKey: ['stock-ubicacion', productoId, { sucursal_id, usuario_id }],
    queryFn: async () => {
      const params = sanitizeParams({ sucursal_id, usuario_id });
      const response = await inventarioApi.obtenerStockPorUbicacion(productoId!, params);
      return response.data.data as StockPorUbicacionResponse;
    },
    enabled: enabled && !!productoId,
    staleTime: STALE_TIMES.REAL_TIME, // 30 seg - datos de ubicación cambian frecuentemente
  });
}

/**
 * Hook para obtener stock del producto en la ubicación del usuario actual
 * @param productoId - ID del producto
 * @param options - { enabled? }
 * @returns { cantidad, ubicacion_id, ubicacion_nombre, es_ubicacion_asignada }
 */
export function useMiStock(
  productoId: number | null | undefined,
  options: MiStockOptions = {}
): UseQueryResult<MiStockResponse, Error> {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['mi-stock', productoId],
    queryFn: async () => {
      const response = await inventarioApi.obtenerMiStock(productoId!);
      return response.data.data as MiStockResponse;
    },
    enabled: enabled && !!productoId,
    staleTime: STALE_TIMES.REAL_TIME,
  });
}

/**
 * Hook para listar productos con stock filtrado por ubicación
 * Útil para mostrar stock de "mi ubicación" vs "stock total"
 * @param params - { ubicacion_id?, sucursal_id?, usuario_ubicacion?, solo_con_stock?, busqueda?, categoria_id?, limit?, offset? }
 * @returns { productos, total, filtro_aplicado }
 */
export function useProductosStockFiltrado(
  params: ProductosStockFiltradoParams = {}
): UseQueryResult<ProductosStockFiltradoResponse, Error> {
  return useQuery({
    queryKey: ['productos-stock-filtrado', params],
    queryFn: async () => {
      const cleanParams = sanitizeParams(params);
      const response = await inventarioApi.listarProductosStockFiltrado(cleanParams);
      return response.data.data as ProductosStockFiltradoResponse;
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
    placeholderData: (previousData) => previousData, // Mantener datos anteriores durante refetch
  });
}
