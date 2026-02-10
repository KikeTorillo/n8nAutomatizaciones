/**
 * Entity Types — Moneda
 */

export interface Moneda {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  decimales: number;
  activo: boolean;
}

export type TipoMoneda = 'MXN' | 'USD' | 'EUR' | 'COP' | 'ARS' | 'CLP' | 'PEN' | 'BRL';
