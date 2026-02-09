import type { BaseEntity, ISODateString } from './common';

// ========== Entidad Principal ==========

export interface Sucursal extends BaseEntity {
  nombre: string;
  codigo?: string;
  direccion?: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  whatsapp?: string;
  pais_id?: number;
  estado_id?: number;
  ciudad_id?: number;
  es_matriz: boolean;
  activo: boolean;
  latitud?: number;
  longitud?: number;
  // Relaciones expandidas
  pais_nombre?: string;
  estado_nombre?: string;
  ciudad_nombre?: string;
  total_usuarios?: number;
  total_profesionales?: number;
}

// ========== Request Types ==========

export interface CrearSucursalData {
  nombre: string;
  codigo?: string;
  direccion?: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  whatsapp?: string;
  pais_id?: number;
  estado_id?: number;
  ciudad_id?: number;
}

export type ActualizarSucursalData = Partial<CrearSucursalData>;

// ========== Transferencias ==========

export type EstadoTransferencia = 'borrador' | 'enviado' | 'recibido' | 'cancelado';

export interface Transferencia extends BaseEntity {
  folio?: string;
  sucursal_origen_id: number;
  sucursal_destino_id: number;
  estado: EstadoTransferencia;
  notas?: string;
  fecha_envio?: ISODateString;
  fecha_recepcion?: ISODateString;
  // Relaciones expandidas
  sucursal_origen_nombre?: string;
  sucursal_destino_nombre?: string;
  items?: TransferenciaItem[];
  total_items?: number;
}

export interface TransferenciaItem {
  id: number;
  transferencia_id: number;
  producto_id: number;
  cantidad: number;
  cantidad_recibida?: number;
  producto_nombre?: string;
  producto_sku?: string;
}
