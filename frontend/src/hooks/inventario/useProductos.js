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
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

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
 * @param {Object} params - { q, tipo_busqueda?, categoria_id?, proveedor_id?, solo_activos?, solo_con_stock?, limit? }
 */
export function useBuscarProductos(params) {
  return useQuery({
    queryKey: ['buscar-productos', params],
    queryFn: async () => {
      const response = await inventarioApi.buscarProductos(sanitizeParams(params));
      return response.data.data || [];
    },
    enabled: !!params.q && params.q.length >= 2,
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos - Ene 2026: aumentado para reducir requests POS
  });
}

/**
 * Hook para obtener productos con stock crítico
 */
export function useStockCritico() {
  return useQuery({
    queryKey: ['stock-critico'],
    queryFn: async () => {
      const response = await inventarioApi.obtenerStockCritico();
      return response.data.data.productos || [];
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos (stock crítico requiere actualización frecuente)
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
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
      queryClient.invalidateQueries({ queryKey: ['valor-inventario'] });
    },
    onError: createCRUDErrorHandler('create', 'Productos', {
      403: 'Alcanzaste el límite de productos de tu plan',
      400: 'Algunos productos tienen datos inválidos',
    }),
  });
}

/**
 * Hook para ajustar stock manualmente (conteo físico, correcciones)
 */
export function useAjustarStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cantidad_ajuste, motivo, tipo_movimiento }) => {
      const response = await inventarioApi.ajustarStock(id, {
        cantidad_ajuste,
        motivo,
        tipo_movimiento,
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['producto', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['kardex', variables.id] });
    },
    onError: createCRUDErrorHandler('update', 'Stock', {
      400: 'Datos inválidos. Revisa cantidad y tipo de movimiento',
    }),
  });
}
