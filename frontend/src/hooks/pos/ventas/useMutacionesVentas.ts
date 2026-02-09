import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { queryKeys } from '@/hooks/config';
import type { TipoVenta, EstadoVenta } from '@/types/entities/venta';
import type {
  CrearVentaInput,
  ActualizarVentaInput,
  RegistrarPagoInput,
  CancelarVentaInput,
  DevolverItemsInput,
  VentaItemInput,
} from './types';

// ========== Mutation Hooks ==========

/**
 * Hook para crear venta con items
 */
export function useCrearVenta() {
  const queryClient = useQueryClient();
  // ✅ Multi-sucursal: Obtener sucursal activa del store
  const getSucursalId = useSucursalStore(selectGetSucursalId);

  return useMutation({
    mutationFn: async (data: CrearVentaInput) => {
      const sanitized = {
        ...data,
        tipo_venta: data.tipo_venta || ('directa' as TipoVenta),
        cliente_id: data.cliente_id || undefined,
        cita_id: data.cita_id || undefined,
        profesional_id: data.profesional_id || undefined,
        descuento_porcentaje: data.descuento_porcentaje || undefined,
        descuento_monto: data.descuento_monto || undefined,
        impuestos: data.impuestos || undefined,
        monto_pagado: data.monto_pagado || undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
        // ✅ Multi-sucursal: Inyectar sucursal_id automáticamente
        sucursal_id: data.sucursal_id || getSucursalId() || undefined,
      };

      const response = await posApi.crearVenta(sanitized);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' }); // Stock se actualizó
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.stockCritico, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.movimientos.all, refetchType: 'active' }); // Se generó movimiento
    },
    onError: createCRUDErrorHandler('create', 'Venta', {
      409: 'Stock insuficiente para completar la venta',
    }),
  });
}

/**
 * Hook para actualizar venta
 */
export function useActualizarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ActualizarVentaInput }) => {
      const sanitized = {
        tipo_venta: data.tipo_venta || undefined,
        cliente_id: data.cliente_id || undefined,
        profesional_id: data.profesional_id || undefined,
        descuento_porcentaje: data.descuento_porcentaje || undefined,
        descuento_monto: data.descuento_monto || undefined,
        impuestos: data.impuestos || undefined,
        metodo_pago: data.metodo_pago || undefined,
        fecha_apartado: data.fecha_apartado || undefined,
        fecha_vencimiento_apartado: data.fecha_vencimiento_apartado || undefined,
        notas: data.notas?.trim() || undefined,
      };

      const response = await posApi.actualizarVenta(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.id), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Venta'),
  });
}

/**
 * Hook para actualizar estado de venta
 */
export function useActualizarEstadoVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }: { id: number; estado: EstadoVenta }) => {
      const response = await posApi.actualizarEstadoVenta(id, { estado });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.id), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('update', 'Estado de venta'),
  });
}

/**
 * Hook para registrar pago en venta
 */
export function useRegistrarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RegistrarPagoInput }) => {
      const sanitized = {
        monto_pago: data.monto_pago,
        metodo_pago: data.metodo_pago,
        pago_id: data.pago_id || undefined,
      };

      const response = await posApi.registrarPago(id, sanitized);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.id), refetchType: 'active' });
    },
    onError: createCRUDErrorHandler('create', 'Pago', {
      409: 'El pago excede el monto pendiente',
    }),
  });
}

/**
 * Hook para cancelar venta y revertir stock
 */
export function useCancelarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo, usuario_id }: { id: number } & CancelarVentaInput) => {
      const response = await posApi.cancelarVenta(id, {
        motivo: motivo?.trim() || undefined,
        usuario_id
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' }); // Stock revertido
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.movimientos.all, refetchType: 'active' }); // Movimiento de reversión
    },
    onError: createCRUDErrorHandler('delete', 'Venta', {
      400: 'No se puede cancelar una venta ya cancelada',
    }),
  });
}

/**
 * Hook para procesar devolución de items
 */
export function useDevolverItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items_devueltos, motivo, usuario_id }: { id: number } & DevolverItemsInput) => {
      const response = await posApi.devolverItems(id, {
        items_devueltos,
        motivo: motivo?.trim() || undefined,
        usuario_id
      });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' }); // Stock ajustado
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.movimientos.all, refetchType: 'active' }); // Movimiento de devolución
    },
    onError: createCRUDErrorHandler('update', 'Devolución', {
      400: 'Cantidad a devolver inválida',
    }),
  });
}

/**
 * Hook para agregar items a venta existente
 */
export function useAgregarItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, items }: { id: number; items: VentaItemInput[] }) => {
      const response = await posApi.agregarItems(id, { items });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.detail(variables.id), refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' }); // Stock actualizado
    },
    onError: createCRUDErrorHandler('update', 'Items', {
      409: 'Stock insuficiente para agregar items',
    }),
  });
}

/**
 * Hook para eliminar venta (cancela y revierte stock)
 */
export function useEliminarVenta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo, usuario_id }: { id: number; motivo?: string; usuario_id: number }) => {
      const response = await posApi.eliminarVenta(id, { motivo, usuario_id });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.ventas.all, refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.productos.all, refetchType: 'active' }); // Stock revertido
      queryClient.invalidateQueries({ queryKey: queryKeys.inventario.movimientos.all, refetchType: 'active' }); // Movimiento de reversión
    },
    onError: createCRUDErrorHandler('delete', 'Venta'),
  });
}
