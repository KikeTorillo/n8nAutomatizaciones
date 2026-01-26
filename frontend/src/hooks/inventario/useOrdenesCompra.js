/**
 * ====================================================================
 * HOOKS DE ORDENES DE COMPRA
 * ====================================================================
 *
 * Ene 2026 - Migrado a createCRUDHooks
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordenesCompraApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

// =========================================================================
// HOOKS CRUD VIA FACTORY
// =========================================================================

// Sanitizador para datos de orden de compra
const sanitizeOrdenCompra = createSanitizer([
  'notas',
  'referencia_proveedor',
  { name: 'proveedor_id', type: 'id' },
  { name: 'fecha_entrega_esperada', type: 'string' },
  { name: 'descuento_porcentaje', type: 'number' },
  { name: 'descuento_monto', type: 'number' },
  { name: 'impuestos', type: 'number' },
  { name: 'dias_credito', type: 'number' },
]);

const hooks = createCRUDHooks({
  name: 'ordenCompra',
  namePlural: 'ordenesCompra',
  api: ordenesCompraApi,
  baseKey: 'ordenes-compra',
  apiMethods: {
    list: 'listar',
    get: 'obtenerPorId',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  sanitize: (data) => {
    // Sanitizar campos base
    const sanitized = sanitizeOrdenCompra(data);
    // Mantener items si existen (para crear orden con items)
    if (data.items) {
      sanitized.items = data.items;
    }
    return sanitized;
  },
  invalidateOnCreate: ['ordenes-compra', 'ordenes-compra-pendientes'],
  invalidateOnUpdate: ['ordenes-compra'],
  invalidateOnDelete: ['ordenes-compra', 'ordenes-compra-pendientes'],
  errorMessages: {
    delete: { 409: 'Solo se pueden eliminar órdenes en estado borrador' },
  },
  staleTime: STALE_TIMES.DYNAMIC,
  responseKey: 'ordenes',
  usePreviousData: true, // Evita flash de loading al paginar/filtrar
});

// Exportar hooks CRUD
export const useOrdenesCompra = hooks.useList;
export const useOrdenCompra = hooks.useDetail;
export const useCrearOrdenCompra = hooks.useCreate;
export const useActualizarOrdenCompra = hooks.useUpdate;
export const useEliminarOrdenCompra = hooks.useDelete;

// =========================================================================
// QUERIES ESPECIALIZADAS
// =========================================================================

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
    staleTime: STALE_TIMES.DYNAMIC,
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
    staleTime: STALE_TIMES.DYNAMIC,
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
      const response = await ordenesCompraApi.estadisticasPorProveedor(sanitizeParams(params));
      return response.data.data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// =========================================================================
// MUTATIONS PARA ITEMS
// =========================================================================

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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', variables.ordenId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', variables.ordenId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', variables.ordenId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
    },
  });
}

// =========================================================================
// MUTATIONS DE WORKFLOW
// =========================================================================

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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes'], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', variables.id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes'], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', variables.ordenId], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes-pago'], refetchType: 'active' });
      // Invalidar inventario porque se actualizó stock
      queryClient.invalidateQueries({ queryKey: ['productos'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['stock-critico'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['movimientos'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['valor-inventario'], refetchType: 'active' });
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
      queryClient.invalidateQueries({ queryKey: ['orden-compra', variables.id], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes-pago'], refetchType: 'active' });
    },
  });
}
