import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordenesCompraApi } from '@/services/api/endpoints';

// ==================== QUERIES ====================

/**
 * Hook para listar ordenes de compra con filtros
 * @param {Object} params - { proveedor_id?, estado?, estado_pago?, fecha_desde?, fecha_hasta?, folio?, limit?, offset? }
 */
export function useOrdenesCompra(params = {}) {
  return useQuery({
    queryKey: ['ordenes-compra', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await ordenesCompraApi.listar(sanitizedParams);
      return response.data.data || { ordenes: [], totales: {} };
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener una orden de compra por ID
 * @param {number} id - ID de la orden
 */
export function useOrdenCompra(id) {
  return useQuery({
    queryKey: ['orden-compra', id],
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerPorId(id);
      return response.data.data || null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener ordenes pendientes de recibir
 */
export function useOrdenesCompraPendientes() {
  return useQuery({
    queryKey: ['ordenes-compra-pendientes'],
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerPendientes();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener ordenes pendientes de pago
 */
export function useOrdenesCompraPendientesPago() {
  return useQuery({
    queryKey: ['ordenes-compra-pendientes-pago'],
    queryFn: async () => {
      const response = await ordenesCompraApi.obtenerPendientesPago();
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para obtener estadisticas de compras por proveedor
 * @param {Object} params - { fecha_desde?, fecha_hasta? }
 */
export function useEstadisticasComprasPorProveedor(params = {}) {
  return useQuery({
    queryKey: ['estadisticas-compras-proveedor', params],
    queryFn: async () => {
      const sanitizedParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await ordenesCompraApi.estadisticasPorProveedor(sanitizedParams);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook para crear orden de compra
 */
export function useCrearOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const sanitized = {
        proveedor_id: data.proveedor_id,
        fecha_entrega_esperada: data.fecha_entrega_esperada || undefined,
        descuento_porcentaje: data.descuento_porcentaje || undefined,
        descuento_monto: data.descuento_monto || undefined,
        impuestos: data.impuestos || undefined,
        dias_credito: data.dias_credito !== undefined ? data.dias_credito : undefined,
        notas: data.notas?.trim() || undefined,
        referencia_proveedor: data.referencia_proveedor?.trim() || undefined,
        items: data.items || undefined,
      };

      const response = await ordenesCompraApi.crear(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes']);
    },
  });
}

/**
 * Hook para actualizar orden de compra
 */
export function useActualizarOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const sanitized = {
        proveedor_id: data.proveedor_id || undefined,
        fecha_entrega_esperada: data.fecha_entrega_esperada || undefined,
        descuento_porcentaje: data.descuento_porcentaje !== undefined ? data.descuento_porcentaje : undefined,
        descuento_monto: data.descuento_monto !== undefined ? data.descuento_monto : undefined,
        impuestos: data.impuestos !== undefined ? data.impuestos : undefined,
        dias_credito: data.dias_credito !== undefined ? data.dias_credito : undefined,
        notas: data.notas?.trim() || undefined,
        referencia_proveedor: data.referencia_proveedor?.trim() || undefined,
      };

      // Eliminar campos undefined
      Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined) delete sanitized[key];
      });

      const response = await ordenesCompraApi.actualizar(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['orden-compra', variables.id]);
    },
  });
}

/**
 * Hook para eliminar orden de compra (solo borradores)
 */
export function useEliminarOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await ordenesCompraApi.eliminar(id);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes']);
    },
  });
}

/**
 * Hook para agregar items a orden
 */
export function useAgregarItemsOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, items }) => {
      const sanitizedItems = items.map(item => ({
        producto_id: item.producto_id,
        cantidad_ordenada: item.cantidad_ordenada,
        precio_unitario: item.precio_unitario || undefined,
        fecha_vencimiento: item.fecha_vencimiento || undefined,
        notas: item.notas?.trim() || undefined,
      }));

      const response = await ordenesCompraApi.agregarItems(ordenId, { items: sanitizedItems });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['orden-compra', variables.ordenId]);
      queryClient.invalidateQueries(['ordenes-compra']);
    },
  });
}

/**
 * Hook para actualizar item de orden
 */
export function useActualizarItemOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, itemId, data }) => {
      const sanitized = {
        cantidad_ordenada: data.cantidad_ordenada || undefined,
        precio_unitario: data.precio_unitario || undefined,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        notas: data.notas?.trim() || undefined,
      };

      Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined) delete sanitized[key];
      });

      const response = await ordenesCompraApi.actualizarItem(ordenId, itemId, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['orden-compra', variables.ordenId]);
      queryClient.invalidateQueries(['ordenes-compra']);
    },
  });
}

/**
 * Hook para eliminar item de orden
 */
export function useEliminarItemOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, itemId }) => {
      const response = await ordenesCompraApi.eliminarItem(ordenId, itemId);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['orden-compra', variables.ordenId]);
      queryClient.invalidateQueries(['ordenes-compra']);
    },
  });
}

/**
 * Hook para enviar orden al proveedor
 */
export function useEnviarOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await ordenesCompraApi.enviar(id);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(['orden-compra', id]);
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes']);
    },
  });
}

/**
 * Hook para cancelar orden
 */
export function useCancelarOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }) => {
      const response = await ordenesCompraApi.cancelar(id, { motivo: motivo || undefined });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['orden-compra', variables.id]);
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes']);
    },
  });
}

/**
 * Hook para recibir mercancia
 */
export function useRecibirMercancia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, recepciones }) => {
      const sanitizedRecepciones = recepciones.map(r => ({
        item_id: r.item_id,
        producto_id: r.producto_id,
        cantidad: r.cantidad,
        precio_unitario_real: r.precio_unitario_real || undefined,
        fecha_vencimiento: r.fecha_vencimiento || undefined,
        lote: r.lote?.trim() || undefined,
        notas: r.notas?.trim() || undefined,
        // Números de serie para productos que lo requieren
        numeros_serie: r.numeros_serie?.length > 0 ? r.numeros_serie : undefined,
      }));

      const response = await ordenesCompraApi.recibirMercancia(ordenId, { recepciones: sanitizedRecepciones });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['orden-compra', variables.ordenId]);
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes-pago']);
      // Invalidar inventario porque se actualizó stock
      queryClient.invalidateQueries(['productos']);
      queryClient.invalidateQueries(['stock-critico']);
      queryClient.invalidateQueries(['movimientos']);
      queryClient.invalidateQueries(['valor-inventario']);
    },
  });
}

/**
 * Hook para registrar pago de orden
 */
export function useRegistrarPagoOrdenCompra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, monto }) => {
      const response = await ordenesCompraApi.registrarPago(id, { monto });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['orden-compra', variables.id]);
      queryClient.invalidateQueries(['ordenes-compra']);
      queryClient.invalidateQueries(['ordenes-compra-pendientes-pago']);
    },
  });
}
