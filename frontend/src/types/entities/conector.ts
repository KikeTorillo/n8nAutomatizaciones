/**
 * Entity Types — Conector de Pago
 */

export interface Conector {
  id: number;
  organizacion_id: number;
  gateway: string;
  entorno: string;
  nombre_display?: string;
  credenciales: Record<string, unknown>;
  webhook_url?: string;
  webhook_secret?: string;
  es_principal: boolean;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Gateway {
  id: string;
  nombre: string;
  campos_requeridos: string[];
}

export interface ConectorListParams {
  page?: number;
  limit?: number;
  gateway?: string;
  entorno?: string;
  activo?: boolean;
  orden?: string;
  direccion?: 'asc' | 'desc';
}

export interface ConectorCreateData {
  gateway: string;
  entorno: string;
  nombre_display?: string;
  credenciales: Record<string, unknown>;
  webhook_url?: string;
  webhook_secret?: string;
  es_principal?: boolean;
}

export interface ConectorUpdateData {
  nombre_display?: string;
  credenciales?: Record<string, unknown>;
  webhook_url?: string;
  webhook_secret?: string;
  es_principal?: boolean;
  activo?: boolean;
}
