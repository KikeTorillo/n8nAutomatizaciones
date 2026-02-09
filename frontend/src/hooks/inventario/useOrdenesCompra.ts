/**
 * ====================================================================
 * HOOKS DE ORDENES DE COMPRA
 * ====================================================================
 *
 * Ene 2026 - Migrado a createCRUDHooks
 * Feb 2026 - Migrado a TypeScript
 * ====================================================================
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { ordenesCompraApi } from '@/services/api/endpoints';
import { sanitizeParams } from '@/lib/params';
import { STALE_TIMES } from '@/app/queryClient';
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';
import { queryKeys } from '@/hooks/config';
import type { OrdenCompra } from '@/types/entities';

// =========================================================================
// TIPOS
// =========================================================================

interface CrearOrdenCompraData {
  proveedor_id: number;
  notas?: string;
  referencia_proveedor?: string;
  fecha_entrega_esperada?: string;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  impuestos?: number;
  dias_credito?: number;
  items?: Array<{
    producto_id: number;
    cantidad_ordenada: number;
    precio_unitario?: number;
  }>;
}

type ActualizarOrdenCompraData = Partial<Omit<CrearOrdenCompraData, 'items'>>;

interface ItemOrdenCompra {
  producto_id: number;
  cantidad_ordenada: number;
  precio_unitario?: number;
  fecha_vencimiento?: string;
  notas?: string;
}

interface RecepcionItem {
  item_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario_real?: number;
  fecha_vencimiento?: string;
  lote?: string;
  notas?: string;
  numeros_serie?: string[];
}

interface EstadisticasParams {
  fecha_desde?: string;
  fecha_hasta?: string;
}

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

const hooks = createCRUDHooks<OrdenCompra, CrearOrdenCompraData, ActualizarOrdenCompraData>({
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
  sanitize: (data: CrearOrdenCompraData | ActualizarOrdenCompraData) => {
    // Sanitizar campos base
    const sanitized = sanitizeOrdenCompra(data as Record<string, unknown>);
    // Mantener items si existen (para crear orden con items)
    if ('items' in data && data.items) {
      (sanitized as Record<string, unknown>).items = data.items;
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

export function useOrdenesCompraPendientes(): UseQueryResult<OrdenCompra[]> {
  return useQuery({
    queryKey: queryKeys.inventario.ordenesCompra.pendientes,
    queryFn: async (): Promise<OrdenCompra[]> => {
      const response = await ordenesCompraApi.obtenerPendientes();
      return (response.data as any).data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useOrdenesCompraPendientesPago(): UseQueryResult<OrdenCompra[]> {
  return useQuery({
    queryKey: ['ordenes-compra-pendientes-pago'],
    queryFn: async (): Promise<OrdenCompra[]> => {
      const response = await ordenesCompraApi.obtenerPendientesPago();
      return (response.data as any).data || [];
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

export function useEstadisticasComprasPorProveedor(params: EstadisticasParams = {}): UseQueryResult<unknown[]> {
  return useQuery({
    queryKey: ['estadisticas-compras-proveedor', params],
    queryFn: async (): Promise<unknown[]> => {
      const response = await ordenesCompraApi.estadisticasPorProveedor(sanitizeParams(params));
      return (response.data as any).data || [];
    },
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}

// =========================================================================
// MUTATIONS PARA ITEMS
// =========================================================================

export function useAgregarItemsOrdenCompra(): UseMutationResult<unknown, Error, { ordenId: number; items: ItemOrdenCompra[] }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, items }: { ordenId: number; items: ItemOrdenCompra[] }) => {
      const sanitizedItems = items.map((item: ItemOrdenCompra) => ({
        producto_id: item.producto_id,
        cantidad_ordenada: item.cantidad_ordenada,
        precio_unitario: item.precio_unitario || undefined,
        fecha_vencimiento: item.fecha_vencimiento || undefined,
        notas: item.notas?.trim() || undefined,
      }));

      const response = await ordenesCompraApi.agregarItems(ordenId, { items: sanitizedItems });
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, variables: { ordenId: number; items: ItemOrdenCompra[] }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(variables.ordenId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
    },
  });
}

export function useActualizarItemOrdenCompra(): UseMutationResult<unknown, Error, { ordenId: number; itemId: number; data: Partial<ItemOrdenCompra> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, itemId, data }: { ordenId: number; itemId: number; data: Partial<ItemOrdenCompra> }) => {
      const sanitized: Record<string, unknown> = {
        cantidad_ordenada: data.cantidad_ordenada || undefined,
        precio_unitario: data.precio_unitario || undefined,
        fecha_vencimiento: data.fecha_vencimiento || undefined,
        notas: data.notas?.trim() || undefined,
      };

      Object.keys(sanitized).forEach((key: string) => {
        if (sanitized[key] === undefined) delete sanitized[key];
      });

      const response = await ordenesCompraApi.actualizarItem(ordenId, itemId, sanitized);
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, variables: { ordenId: number; itemId: number; data: Partial<ItemOrdenCompra> }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(variables.ordenId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
    },
  });
}

export function useEliminarItemOrdenCompra(): UseMutationResult<unknown, Error, { ordenId: number; itemId: number }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, itemId }: { ordenId: number; itemId: number }) => {
      const response = await ordenesCompraApi.eliminarItem(ordenId, itemId);
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, variables: { ordenId: number; itemId: number }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(variables.ordenId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
    },
  });
}

// =========================================================================
// MUTATIONS DE WORKFLOW
// =========================================================================

export function useEnviarOrdenCompra(): UseMutationResult<unknown, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await ordenesCompraApi.enviar(id);
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, id: number) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.pendientes, refetchType: 'active' });
    },
  });
}

export function useCancelarOrdenCompra(): UseMutationResult<unknown, Error, { id: number; motivo?: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: number; motivo?: string }) => {
      const response = await ordenesCompraApi.cancelar(id, { motivo: motivo || undefined });
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, variables: { id: number; motivo?: string }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.pendientes, refetchType: 'active' });
    },
  });
}

export function useRecibirMercancia(): UseMutationResult<unknown, Error, { ordenId: number; recepciones: RecepcionItem[] }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ordenId, recepciones }: { ordenId: number; recepciones: RecepcionItem[] }) => {
      const sanitizedRecepciones = recepciones.map((r: RecepcionItem) => ({
        item_id: r.item_id,
        producto_id: r.producto_id,
        cantidad: r.cantidad,
        precio_unitario_real: r.precio_unitario_real || undefined,
        fecha_vencimiento: r.fecha_vencimiento || undefined,
        lote: r.lote?.trim() || undefined,
        notas: r.notas?.trim() || undefined,
        numeros_serie: r.numeros_serie?.length ? r.numeros_serie : undefined,
      }));

      const response = await ordenesCompraApi.recibirMercancia(ordenId, { recepciones: sanitizedRecepciones });
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, variables: { ordenId: number; recepciones: RecepcionItem[] }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(variables.ordenId), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.pendientes, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes-pago'], refetchType: 'active' });
      // Invalidar inventario porque se actualizo stock
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.stockCritico, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.movimientos.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.valoracion.resumen, refetchType: 'active' });
    },
  });
}

export function useRegistrarPagoOrdenCompra(): UseMutationResult<unknown, Error, { id: number; monto: number }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, monto }: { id: number; monto: number }) => {
      const response = await ordenesCompraApi.registrarPago(id, { monto });
      return (response.data as any).data;
    },
    onSuccess: (_: unknown, variables: { id: number; monto: number }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.detail(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.ordenesCompra.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['ordenes-compra-pendientes-pago'], refetchType: 'active' });
    },
  });
}
