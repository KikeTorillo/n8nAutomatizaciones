/**
 * Tipos base compartidos por todas las entidades
 */

/** Entidad base con campos comunes de PostgreSQL */
export interface BaseEntity {
  id: number;
  organizacion_id: number;
  created_at: string;
  updated_at: string;
}

/** Respuesta paginada del backend */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** @deprecated Usar ApiResponse de '@/services/api/client' */
export type { ApiResponse } from '@/services/api/client';

/** Respuesta API con paginación (formato backend Nexo) */
export interface ApiListResponse<T> {
  data: T[];
  total: number;
  paginacion?: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

/** Respuesta paginada formato servicio (usado por algunos endpoints) */
export interface PaginatedResponseServicio<T> {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

/** Union de todos los formatos de paginación del backend */
export type AnyPaginatedResponse<T> = PaginatedResponse<T> | ApiListResponse<T> | PaginatedResponseServicio<T>;

/** Parámetros comunes de listado */
export interface ListParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'ASC' | 'DESC';
}

/** Estado activo/inactivo */
export type EstadoActivo = boolean;

/** Timestamp ISO string */
export type ISODateString = string;
