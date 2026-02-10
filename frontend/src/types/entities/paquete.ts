/**
 * Entity Types — Paquete
 */

export type EstadoPaquete = 'borrador' | 'empaquetado' | 'enviado' | 'entregado' | 'cancelado';

export interface PaqueteItem {
  id: number;
  paquete_id: number;
  producto_id: number;
  cantidad: number;
  producto_nombre?: string;
  producto_sku?: string;
}

export interface Paquete {
  id: number;
  operacion_id: number;
  numero: string;
  peso?: number;
  dimensiones?: {
    largo?: number;
    ancho?: number;
    alto?: number;
  };
  estado: EstadoPaquete;
  items: PaqueteItem[];
  notas?: string;
  created_at: string;
  updated_at?: string;
}
