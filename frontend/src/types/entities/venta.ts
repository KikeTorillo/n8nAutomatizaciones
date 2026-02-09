import type { BaseEntity } from './common';

// ========== Union Types ==========

export type EstadoVenta = 'cotizacion' | 'apartado' | 'completada' | 'cancelada';
export type EstadoPagoVenta = 'pendiente' | 'parcial' | 'pagado';
export type TipoVenta = 'directa' | 'apartado' | 'cotizacion';
export type MetodoPago =
  | 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito'
  | 'transferencia' | 'qr_mercadopago' | 'terminal_mercadopago'
  | 'cuenta_cliente'
  | 'tarjeta' | 'mixto';
export type TipoDescuentoPOS = 'porcentaje' | 'monto';
export type EstadoSesionCaja = 'abierta' | 'cerrada';
export type TipoMovimientoCaja = 'entrada' | 'salida';

// ========== Venta POS ==========

export interface VentaItem {
  id: number;
  venta_pos_id: number;
  producto_id: number;
  variante_id?: number;
  nombre_producto: string;
  sku?: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  precio_final: number;
  subtotal: number;
  aplica_comision: boolean;
  notas?: string;
  numero_serie_id?: number;
}

export interface Venta extends BaseEntity {
  sucursal_id?: number;
  folio: string;
  tipo_venta: TipoVenta;
  estado: EstadoVenta;
  estado_pago: EstadoPagoVenta;
  cliente_id?: number;
  cita_id?: number;
  profesional_id?: number;
  usuario_id: number;
  sesion_caja_id?: number;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  impuestos: number;
  total: number;
  metodo_pago: MetodoPago;
  monto_pagado: number;
  monto_pendiente: number;
  fecha_venta: string;
  fecha_apartado?: string;
  fecha_vencimiento_apartado?: string;
  puntos_canjeados?: number;
  descuento_puntos?: number;
  notas?: string;
  // Joins opcionales
  items?: VentaItem[];
  cliente_nombre?: string;
  profesional_nombre?: string;
  usuario_nombre?: string;
}

// ========== Sesion de Caja ==========

export interface SesionCaja extends BaseEntity {
  sucursal_id: number;
  usuario_id: number;
  estado: EstadoSesionCaja;
  monto_inicial: number;
  monto_final_sistema?: number;
  monto_final_contado?: number;
  diferencia?: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  nota_apertura?: string;
  nota_cierre?: string;
  // Joins opcionales
  usuario_nombre?: string;
  sucursal_nombre?: string;
}

export interface MovimientoCaja {
  id: number;
  sesion_caja_id: number;
  tipo: TipoMovimientoCaja;
  monto: number;
  motivo: string;
  created_at: string;
}

// ========== Cupones ==========

export interface Cupon extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo_descuento: TipoDescuentoPOS;
  valor: number;
  monto_minimo: number;
  monto_maximo_descuento?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  usos_maximos?: number;
  usos_por_cliente: number;
  solo_primera_compra: boolean;
  categorias_ids?: number[];
  productos_ids?: number[];
  activo: boolean;
  creado_por: number;
  // Calculado
  usos_registrados?: number;
}

// ========== Promociones ==========

export type TipoPromocion = string;

export interface Promocion extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoPromocion;
  reglas: Record<string, unknown>;
  valor_descuento?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  hora_inicio?: string;
  hora_fin?: string;
  dias_semana?: number[];
  prioridad: number;
  exclusiva: boolean;
  acumulable_cupones: boolean;
  usos_maximos?: number;
  usos_por_cliente?: number;
  monto_minimo: number;
  monto_maximo_descuento?: number;
  solo_primera_compra: boolean;
  sucursales_ids?: number[];
  activo: boolean;
  creado_por: number;
  // Calculado
  usos_registrados?: number;
}

// ========== Lealtad ==========

export interface ConfiguracionLealtad {
  id?: number;
  activo: boolean;
  puntos_por_peso: number;
  puntos_por_peso_descuento: number;
  meses_expiracion: number;
}

export interface NivelLealtad {
  id: number;
  nombre: string;
  codigo: string;
  color?: string;
  puntos_minimos: number;
  puntos_maximos?: number;
  multiplicador_puntos: number;
  activo: boolean;
}

export interface PuntosCliente {
  puntos_disponibles: number;
  puntos_totales: number;
  nivel?: NivelLealtad;
  proximo_nivel?: NivelLealtad;
}

// ========== Combos ==========

export interface Combo {
  id: number;
  producto_id: number;
  tipo_precio: string;
  descuento_porcentaje?: number;
  componentes: ComboComponente[];
}

export interface ComboComponente {
  id: number;
  combo_id: number;
  producto_id: number;
  cantidad: number;
  producto_nombre?: string;
}

// ========== Modificadores ==========

export interface GrupoModificadores {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo_seleccion: string;
  es_obligatorio: boolean;
  minimo_seleccion?: number;
  maximo_seleccion?: number;
  activo: boolean;
  modificadores?: Modificador[];
}

export interface Modificador {
  id: number;
  grupo_id: number;
  nombre: string;
  descripcion?: string;
  precio_adicional: number;
  prefijo?: string;
  orden: number;
  activo: boolean;
}
