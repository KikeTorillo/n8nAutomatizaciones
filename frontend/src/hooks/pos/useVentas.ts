import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/app/queryClient';
import { posApi } from '@/services/api/endpoints';
import useSucursalStore, { selectGetSucursalId } from '@/store/sucursalStore';
import { createCRUDErrorHandler } from '@/hooks/config/errorHandlerFactory';
import { sanitizeParams } from '@/lib/params';
import { queryKeys } from '@/hooks/config';
import type {
  Venta,
  VentaItem,
  TipoVenta,
  MetodoPago,
  EstadoVenta,
  EstadoPagoVenta,
} from '@/types/entities/venta';

// ==================== VENTAS POS ====================
// ✅ FEATURE: Multi-sucursal - Los hooks inyectan sucursal_id automáticamente

// ========== Query Params ==========

interface ListarVentasParams {
  estado?: EstadoVenta;
  estado_pago?: EstadoPagoVenta;
  tipo_venta?: TipoVenta;
  cliente_id?: number;
  profesional_id?: number;
  metodo_pago?: MetodoPago;
  fecha_desde?: string;
  fecha_hasta?: string;
  folio?: string;
  limit?: number;
  offset?: number;
  sucursalId?: number;
}

interface VentasResponse {
  ventas: Venta[];
  total: number;
}

interface VentaDetailResponse {
  venta: Venta | null;
  items: VentaItem[];
}

// ========== Create/Update Params ==========

interface VentaItemInput {
  producto_id: number;
  variante_id?: number;
  cantidad: number;
  precio_unitario?: number;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  aplica_comision?: boolean;
  notas?: string;
  numero_serie_id?: number;
}

interface CrearVentaInput {
  tipo_venta?: TipoVenta;
  cliente_id?: number;
  cita_id?: number;
  profesional_id?: number;
  items: VentaItemInput[];
  descuento_porcentaje?: number;
  descuento_monto?: number;
  impuestos?: number;
  metodo_pago: MetodoPago;
  monto_pagado?: number;
  fecha_apartado?: string;
  fecha_vencimiento_apartado?: string;
  notas?: string;
  sucursal_id?: number;
}

interface ActualizarVentaInput {
  tipo_venta?: TipoVenta;
  cliente_id?: number;
  profesional_id?: number;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  impuestos?: number;
  metodo_pago?: MetodoPago;
  fecha_apartado?: string;
  fecha_vencimiento_apartado?: string;
  notas?: string;
}

interface RegistrarPagoInput {
  monto_pago: number;
  metodo_pago: MetodoPago;
  pago_id?: number;
}

interface CancelarVentaInput {
  motivo?: string;
  usuario_id: number;
}

interface DevolverItemsInput {
  items_devueltos: Array<{
    item_id: number;
    cantidad: number;
  }>;
  motivo?: string;
  usuario_id: number;
}

// ========== Reportes Params ==========

interface CorteCajaParams {
  fecha_inicio: string;
  fecha_fin: string;
  usuario_id?: number;
  sucursalId?: number;
}

interface CorteCajaResponse {
  resumen: {
    total_ventas?: number;
    monto_total?: number;
    monto_efectivo?: number;
    monto_tarjeta?: number;
    monto_transferencia?: number;
    monto_mixto?: number;
  };
  totales_por_metodo: Array<{
    metodo_pago: MetodoPago;
    cantidad: number;
    monto: number;
  }>;
  ventas_por_hora: Array<{
    hora: number;
    cantidad: number;
    monto: number;
  }>;
  top_productos: Array<{
    producto_id: number;
    nombre_producto: string;
    cantidad: number;
    monto: number;
  }>;
}

interface VentasDiariasParams {
  fecha: string;
  profesional_id?: number;
  usuario_id?: number;
}

interface VentasDiariasResponse {
  resumen: {
    total_ventas?: number;
    monto_total?: number;
  };
  ventas_por_hora: Array<{
    hora: number;
    cantidad: number;
    monto: number;
  }>;
  top_productos: Array<{
    producto_id: number;
    nombre_producto: string;
    cantidad: number;
    monto: number;
  }>;
  detalle: Venta[];
}

// ========== Query Hooks ==========

/**
 * Hook para listar ventas con filtros
 */
export function useVentas(params: ListarVentasParams = {}) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const sucursalId = getSucursalId();

  return useQuery({
    queryKey: [...queryKeys.pos.ventas.list(params), sucursalId],
    queryFn: async (): Promise<VentasResponse> => {
      // Fix 27-Dic-2025: Agregar sucursalId para permisos
      const queryParams = sanitizeParams({
        ...params,
        ...(sucursalId && { sucursalId })
      });

      const response = await posApi.listarVentas(queryParams);
      return response.data.data || { ventas: [], total: 0 };
    },
    staleTime: STALE_TIMES.DYNAMIC, // 2 minutos
    enabled: !!sucursalId, // Solo ejecutar si hay sucursal
  });
}

/**
 * Hook para obtener venta por ID con items
 */
export function useVenta(ventaId: number | undefined | null) {
  return useQuery({
    queryKey: queryKeys.pos.ventas.detail(ventaId),
    queryFn: async (): Promise<VentaDetailResponse> => {
      const response = await posApi.obtenerVenta(ventaId!);
      return response.data.data || { venta: null, items: [] };
    },
    enabled: !!ventaId,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}

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

// ==================== REPORTES POS ====================

/**
 * Hook para obtener corte de caja
 */
export function useCorteCaja(params: CorteCajaParams) {
  const getSucursalId = useSucursalStore(selectGetSucursalId);
  const sucursalId = getSucursalId();

  return useQuery({
    queryKey: [...queryKeys.pos.ventas.corteCaja(params), sucursalId],
    queryFn: async (): Promise<CorteCajaResponse> => {
      // Fix 27-Dic-2025: Agregar sucursalId para permisos
      const queryParams = sanitizeParams({
        ...params,
        ...(sucursalId && { sucursalId })
      });

      const response = await posApi.obtenerCorteCaja(queryParams);
      return response.data.data || { resumen: {}, totales_por_metodo: [], ventas_por_hora: [], top_productos: [] };
    },
    enabled: !!params.fecha_inicio && !!params.fecha_fin && !!sucursalId,
    staleTime: STALE_TIMES.SEMI_STATIC, // 5 minutos
  });
}

/**
 * Hook para obtener ventas diarias
 */
export function useVentasDiarias(params: VentasDiariasParams) {
  return useQuery({
    queryKey: queryKeys.pos.ventas.diarias(params),
    queryFn: async (): Promise<VentasDiariasResponse> => {
      const response = await posApi.obtenerVentasDiarias(sanitizeParams(params));
      return response.data.data || { resumen: {}, ventas_por_hora: [], top_productos: [], detalle: [] };
    },
    enabled: !!params.fecha,
    staleTime: STALE_TIMES.SEMI_STATIC,
  });
}
