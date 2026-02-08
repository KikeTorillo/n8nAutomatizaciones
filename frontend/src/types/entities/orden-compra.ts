import type { BaseEntity, ISODateString } from './common';

export interface OrdenCompra extends BaseEntity {
  folio: string;
  proveedor_id: number;
  proveedor_nombre?: string;
  sucursal_id?: number;
  sucursal_nombre?: string;
  estado: EstadoOrdenCompra;
  fecha_emision: ISODateString;
  fecha_esperada?: ISODateString;
  fecha_recepcion?: ISODateString;
  subtotal: number;
  impuestos: number;
  descuento: number;
  total: number;
  moneda?: string;
  notas?: string;
  referencia_externa?: string;
  items?: OrdenCompraItem[];
}

export interface OrdenCompraItem {
  id: number;
  orden_compra_id: number;
  producto_id: number;
  producto_nombre?: string;
  producto_sku?: string;
  cantidad: number;
  cantidad_recibida?: number;
  precio_unitario: number;
  subtotal: number;
  impuesto?: number;
  descuento?: number;
}

export type EstadoOrdenCompra = 'borrador' | 'enviada' | 'confirmada' | 'recibida_parcial' | 'recibida' | 'cancelada';
