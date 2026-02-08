import type { BaseEntity, ISODateString } from './common';

export interface Cliente extends BaseEntity {
  nombre: string;
  email?: string;
  telefono?: string;
  telefono_secundario?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
  tipo?: 'persona' | 'empresa';
  rfc?: string;
  razon_social?: string;
  marketing_permitido?: boolean;
  fecha_nacimiento?: ISODateString;
  genero?: string;
  fuente?: string;
  referido_por?: number;
  foto_url?: string;
  // Crédito
  permite_credito?: boolean;
  limite_credito?: number;
  saldo_credito?: number;
  dias_credito?: number;
  credito_suspendido?: boolean;
  // Metadata
  ultima_visita?: ISODateString;
  total_visitas?: number;
}

export interface ClienteEstadisticas {
  total_clientes: number;
  clientes_activos: number;
  clientes_nuevos_mes: number;
  clientes_inactivos: number;
}

export interface Etiqueta extends BaseEntity {
  nombre: string;
  color: string;
  descripcion?: string;
  orden?: number;
  activo: boolean;
}
