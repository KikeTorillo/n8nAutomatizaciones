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

export interface ListarVentasParams {
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

export interface VentasResponse {
  ventas: Venta[];
  total: number;
}

export interface VentaDetailResponse {
  venta: Venta | null;
  items: VentaItem[];
}

// ========== Create/Update Params ==========

export interface VentaItemInput {
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

export interface CrearVentaInput {
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

export interface ActualizarVentaInput {
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

export interface RegistrarPagoInput {
  monto_pago: number;
  metodo_pago: MetodoPago;
  pago_id?: number;
}

export interface CancelarVentaInput {
  motivo?: string;
  usuario_id: number;
}

export interface DevolverItemsInput {
  items_devueltos: Array<{
    item_id: number;
    cantidad: number;
  }>;
  motivo?: string;
  usuario_id: number;
}

// ========== Reportes Params ==========

export interface CorteCajaParams {
  fecha_inicio: string;
  fecha_fin: string;
  usuario_id?: number;
  sucursalId?: number;
}

export interface CorteCajaResponse {
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

export interface VentasDiariasParams {
  fecha: string;
  profesional_id?: number;
  usuario_id?: number;
}

export interface VentasDiariasResponse {
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
