import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventarioApi } from '@/services/api/endpoints';

/**
 * Hook para listar productos con filtros
 * @param {Object} params - { activo?, categoria_id?, proveedor_id?, busqueda?, sku?, codigo_barras?, stock_bajo?, stock_agotado?, permite_venta?, orden_por?, orden_dir?, limit?, offset? }
 */
export function useProductos(params = {}) {
  return useQuery({
    queryKey: ['productos', params],
    queryFn: async () => {
      // ⚠️ CRÍTICO: Sanitizar params - eliminar valores vacíos
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.listarProductos(sanitizedParams);
      return response.data.data || { productos: [], total: 0 };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
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
    staleTime: 1000 * 60 * 5,
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
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await inventarioApi.buscarProductos(sanitizedParams);
      return response.data.data || [];
    },
    enabled: !!params.q && params.q.length >= 2,
    staleTime: 1000 * 30, // 30 segundos (búsqueda debe ser más fresca)
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
    staleTime: 1000 * 60 * 2, // 2 minutos (stock crítico requiere actualización frecuente)
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
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['valor-inventario']);
    },
    onError: (error) => {
      // Priorizar mensaje del backend
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        409: 'Ya existe un producto con ese SKU o código de barras',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para crear productos o alcanzaste el límite de tu plan',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || error.response?.data?.error || 'Error inesperado';
      throw new Error(message);
    },
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
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['valor-inventario']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        403: 'Alcanzaste el límite de productos de tu plan',
        400: 'Algunos productos tienen datos inválidos',
        500: 'Error del servidor. Intenta nuevamente',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al crear productos en lote';
      throw new Error(message);
    },
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
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['producto', variables.id]);
      queryClient.invalidateQueries(['stock-critico']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Producto no encontrado',
        409: 'Ya existe otro producto con ese SKU o código de barras',
        400: 'Datos inválidos. Revisa los campos',
        403: 'No tienes permisos para actualizar este producto',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al actualizar producto';
      throw new Error(message);
    },
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
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['producto', variables.id]);
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['movimientos']);
      queryClient.invalidateQueries(['kardex', variables.id]);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Producto no encontrado',
        400: 'Datos inválidos. Revisa cantidad y tipo de movimiento',
        403: 'No tienes permisos para ajustar el stock',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al ajustar stock';
      throw new Error(message);
    },
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
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['stock-critico']);
    },
    onError: (error) => {
      const backendMessage = error.response?.data?.message;
      if (backendMessage) {
        throw new Error(backendMessage);
      }

      const errorMessages = {
        404: 'Producto no encontrado',
        403: 'No tienes permisos para eliminar productos',
        409: 'No se puede eliminar el producto porque tiene movimientos o ventas asociadas',
      };

      const statusCode = error.response?.status;
      const message = errorMessages[statusCode] || 'Error al eliminar producto';
      throw new Error(message);
    },
  });
}
