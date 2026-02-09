import type { BaseEntity, ISODateString } from './common';

// ========== Proveedores (exportado desde producto.ts ya existe, esto es complemento) ==========

// ========== Variantes ==========

export interface Atributo extends BaseEntity {
  nombre: string;
  tipo: 'color' | 'talla' | 'material' | 'otro';
  valores: string[];
  activo: boolean;
}

export interface Variante extends BaseEntity {
  producto_id: number;
  sku: string;
  nombre?: string;
  precio?: number;
  costo?: number;
  stock?: number;
  atributos: Record<string, string>;
  activo: boolean;
  // Relaciones expandidas
  producto_nombre?: string;
}

// ========== Stock ==========

export interface MovimientoStock extends BaseEntity {
  producto_id: number;
  variante_id?: number;
  ubicacion_id?: number;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'transferencia';
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo?: string;
  referencia_tipo?: string;
  referencia_id?: number;
  // Relaciones expandidas
  producto_nombre?: string;
  ubicacion_nombre?: string;
}

export interface ReservaStock extends BaseEntity {
  producto_id: number;
  variante_id?: number;
  cantidad: number;
  tipo_reserva: 'cita' | 'orden' | 'manual';
  referencia_tipo?: string;
  referencia_id?: number;
  estado: 'activa' | 'consumida' | 'cancelada' | 'expirada';
  fecha_expiracion?: ISODateString;
}

// ========== Conteos de Inventario ==========

export type EstadoConteo = 'borrador' | 'en_progreso' | 'completado' | 'cancelado';

export interface ConteoInventario extends BaseEntity {
  titulo?: string;
  descripcion?: string;
  estado: EstadoConteo;
  tipo: 'completo' | 'parcial' | 'ciclico';
  ubicacion_id?: number;
  fecha_inicio?: ISODateString;
  fecha_fin?: ISODateString;
  total_productos?: number;
  total_contados?: number;
  total_diferencias?: number;
  // Relaciones expandidas
  ubicacion_nombre?: string;
}

export interface ConteoItem {
  id: number;
  conteo_id: number;
  producto_id: number;
  variante_id?: number;
  cantidad_sistema: number;
  cantidad_contada?: number;
  diferencia?: number;
  notas?: string;
  // Relaciones expandidas
  producto_nombre?: string;
  producto_sku?: string;
}

// ========== Ubicaciones de Almacén ==========

export type TipoUbicacionAlmacen = 'estante' | 'pasillo' | 'zona' | 'nivel' | 'contenedor';

export interface UbicacionAlmacen extends BaseEntity {
  nombre: string;
  codigo: string;
  tipo: TipoUbicacionAlmacen;
  ubicacion_padre_id?: number;
  capacidad?: number;
  temperatura_controlada: boolean;
  activo: boolean;
  // Relaciones expandidas
  ubicacion_padre_nombre?: string;
  total_productos?: number;
}

// ========== Valoración de Inventario ==========

export type MetodoCosteo = 'promedio' | 'peps' | 'ueps' | 'especifico';

export interface ValoracionInventario {
  producto_id: number;
  producto_nombre: string;
  sku?: string;
  stock_actual: number;
  costo_unitario: number;
  valor_total: number;
  metodo: MetodoCosteo;
}

// ========== Consigna ==========

export type EstadoAcuerdoConsigna = 'borrador' | 'activo' | 'pausado' | 'terminado';
export type EstadoLiquidacion = 'pendiente' | 'confirmada' | 'pagada' | 'cancelada';

export interface AcuerdoConsigna extends BaseEntity {
  proveedor_id: number;
  porcentaje_comision: number;
  dias_liquidacion: number;
  estado: EstadoAcuerdoConsigna;
  notas?: string;
  // Relaciones expandidas
  proveedor_nombre?: string;
}

export interface LiquidacionConsigna extends BaseEntity {
  acuerdo_id: number;
  fecha_desde: ISODateString;
  fecha_hasta: ISODateString;
  monto_total: number;
  comision_total: number;
  monto_proveedor: number;
  estado: EstadoLiquidacion;
  fecha_pago?: ISODateString;
  metodo_pago?: string;
  referencia_pago?: string;
}
