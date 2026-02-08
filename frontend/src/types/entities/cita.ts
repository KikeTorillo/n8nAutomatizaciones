import type { BaseEntity, ISODateString } from './common';

export interface Cita extends BaseEntity {
  cliente_id: number;
  cliente_nombre?: string;
  profesional_id: number;
  profesional_nombre?: string;
  servicio_id: number;
  servicio_nombre?: string;
  sucursal_id?: number;
  sucursal_nombre?: string;
  fecha: ISODateString;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  estado: EstadoCita;
  notas?: string;
  precio?: number;
  motivo_cancelacion?: string;
  recordatorio_enviado?: boolean;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'en_progreso' | 'completada' | 'cancelada' | 'no_show';
