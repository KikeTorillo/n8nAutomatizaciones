/**
 * Entity Types — Barrel Export
 *
 * Tipos de entidades del dominio de Nexo.
 * Usar como: import type { Cliente, Producto } from '@/types/entities';
 */

// Base
export type {
  BaseEntity,
  PaginatedResponse,
  ApiResponse,
  ApiListResponse,
  ListParams,
  EstadoActivo,
  ISODateString,
} from './common';

// Entidades
export type { Cliente, ClienteEstadisticas, Etiqueta } from './cliente';
export type { Producto, Categoria } from './producto';
export type { Cita, EstadoCita } from './cita';
export type { OrdenCompra, OrdenCompraItem, EstadoOrdenCompra } from './orden-compra';
export type { Servicio } from './servicio';
