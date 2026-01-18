import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';

/**
 * Hook para listar productos con filtros
 * @param {Object} params - { activo?, categoria_id?, proveedor_id?, busqueda?, sku?, codigo_barras?, stock_bajo?, stock_agotado?, permite_venta?, orden_por?, orden_dir?, limit?, offset? }
 */
export function useProductos(params = {}) {
  return useQuery({
    queryKey: ['productos', params],
    queryFn: async () => {
      const response = await inventarioApi.listarProductos(sanitizeParams(params));
      return response.data.data || { productos: [], total: 0 };
    },
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
    refetchOnWindowFocus: false, // Ene 2026: evitar refetch innecesario en POS
  });
}

/**
 * Hook para obtener producto por ID
 */
export function useProducto(id) {
  return useQuery({
    queryKey: ['producto', id],
    queryFn: async () => {
      const response = await inventarioApi.obtenerProducto(id);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

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
 * Hook para crear producto
 */
export function useCrearProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // ⚠️ Sanitizar campos opcionales vacíos
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        sku: data.sku?.trim() || undefined,
        codigo_barras: data.codigo_barras?.trim() || undefined,
        categoria_id: data.categoria_id || undefined,
        proveedor_id: data.proveedor_id || undefined,
        dias_vida_util: data.dias_vida_util || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await inventarioApi.crearProducto(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar múltiples queries
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
      queryClient.invalidateQueries({ queryKey: ['valor-inventario'] });
    },
    onError: createCRUDErrorHandler('create', 'Producto', {
      409: 'Ya existe un producto con ese SKU o código de barras',
      403: 'No tienes permisos para crear productos o alcanzaste el límite de tu plan',
    }),
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
 * Hook para actualizar producto
 */
export function useActualizarProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        ...data,
        descripcion: data.descripcion?.trim() || undefined,
        sku: data.sku?.trim() || undefined,
        codigo_barras: data.codigo_barras?.trim() || undefined,
        categoria_id: data.categoria_id || undefined,
        proveedor_id: data.proveedor_id || undefined,
        dias_vida_util: data.dias_vida_util || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await inventarioApi.actualizarProducto(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['producto', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
    },
    onError: createCRUDErrorHandler('update', 'Producto', {
      409: 'Ya existe otro producto con ese SKU o código de barras',
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

/**
 * Hook para eliminar producto (soft delete)
 */
export function useEliminarProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await inventarioApi.eliminarProducto(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'] });
    },
    onError: createCRUDErrorHandler('delete', 'Producto', {
      409: 'No se puede eliminar el producto porque tiene movimientos o ventas asociadas',
    }),
  });
}
