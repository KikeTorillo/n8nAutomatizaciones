import type { BaseEntity, ISODateString } from './common';

export interface Producto extends BaseEntity {
  nombre: string;
  descripcion?: string;
  sku?: string;
  codigo_barras?: string;
  precio: number;
  precio_compra?: number;
  costo?: number;
  categoria_id?: number;
  categoria_nombre?: string;
  tipo?: 'producto' | 'servicio' | 'combo';
  unidad_medida?: string;
  activo: boolean;
  imagen_url?: string;
  // Stock
  stock_actual?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  stock_reservado?: number;
  // Impuestos
  iva?: number;
  exento_iva?: boolean;
  // Variantes
  tiene_variantes?: boolean;
  // Trazabilidad
  requiere_lote?: boolean;
  requiere_serie?: boolean;
  // Proveedor
  proveedor_id?: number;
  proveedor_nombre?: string;
}

export interface Categoria extends BaseEntity {
  nombre: string;
  descripcion?: string;
  parent_id?: number;
  orden?: number;
  activo: boolean;
  imagen_url?: string;
}
