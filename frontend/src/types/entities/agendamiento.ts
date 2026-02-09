import type { BaseEntity, ISODateString } from './common';

// ========== Horarios ==========

export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Horario extends BaseEntity {
  profesional_id: number;
  sucursal_id?: number;
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
  // Relaciones expandidas
  profesional_nombre?: string;
  sucursal_nombre?: string;
}

// ========== Bloqueos ==========

export type TipoBloqueo = 'manual' | 'vacaciones' | 'incapacidad' | 'permiso' | 'otro';

export interface Bloqueo extends BaseEntity {
  profesional_id: number;
  tipo_bloqueo_id?: number;
  tipo: TipoBloqueo;
  titulo?: string;
  descripcion?: string;
  fecha_inicio: ISODateString;
  fecha_fin: ISODateString;
  todo_el_dia: boolean;
  recurrente: boolean;
  patron_recurrencia?: Record<string, unknown>;
  activo: boolean;
  // Relaciones expandidas
  profesional_nombre?: string;
  tipo_bloqueo_nombre?: string;
}

export interface TipoBloqueoConfig extends BaseEntity {
  nombre: string;
  codigo: string;
  color?: string;
  descripcion?: string;
  activo: boolean;
}

// ========== Recordatorios ==========

export type TipoRecordatorio = 'email' | 'whatsapp' | 'sms' | 'push';
export type MomentoRecordatorio = 'antes' | 'despues';

export interface Recordatorio extends BaseEntity {
  cita_id?: number;
  tipo: TipoRecordatorio;
  momento: MomentoRecordatorio;
  minutos: number;
  enviado: boolean;
  fecha_envio?: ISODateString;
  activo: boolean;
}

// ========== Disponibilidad ==========

export interface DisponibilidadSlot {
  hora_inicio: string;
  hora_fin: string;
  profesional_id: number;
  profesional_nombre?: string;
  sucursal_id?: number;
  disponible: boolean;
}

export interface DisponibilidadDia {
  fecha: ISODateString;
  slots: DisponibilidadSlot[];
}
