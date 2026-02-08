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
  notas_cliente?: string;
  notas_internas?: string;
  notas_profesional?: string;
  comentario_profesional?: string;
  precio?: number;
  descuento?: number;
  motivo_cancelacion?: string;
  motivo_no_show?: string;
  recordatorio_enviado?: boolean;
}

export type EstadoCita = 'pendiente' | 'confirmada' | 'en_progreso' | 'completada' | 'cancelada' | 'no_show';

/** Parametros para filtrar citas */
export interface CitasListParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  profesional_id?: number;
  estado?: EstadoCita;
  cliente_id?: number;
  servicio_id?: number;
  page?: number;
  limit?: number;
}

/** Metadata de paginacion de citas */
export interface CitasMetadata {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Respuesta de listado de citas */
export interface CitasListResponse {
  citas: Cita[];
  meta: CitasMetadata;
}

/** Datos para crear una cita */
export interface CrearCitaData {
  cliente_id: number;
  profesional_id: number;
  servicio_id: number;
  sucursal_id?: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  notas_cliente?: string;
  notas_internas?: string;
  descuento?: number;
  precio?: number;
}

/** Datos para actualizar una cita */
export interface ActualizarCitaData {
  cliente_id?: number;
  profesional_id?: number;
  servicio_id?: number;
  sucursal_id?: number;
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  duracion_minutos?: number;
  notas_cliente?: string;
  notas_profesional?: string;
  notas_internas?: string;
  precio?: number;
  descuento?: number;
}

/** Variables para cancelar cita */
export interface CancelarCitaVariables {
  id: number;
  motivo_cancelacion?: string;
}

/** Variables para confirmar cita */
export interface ConfirmarCitaVariables {
  id: number;
}

/** Variables para iniciar cita */
export interface IniciarCitaVariables {
  id: number;
}

/** Variables para completar cita */
export interface CompletarCitaVariables {
  id: number;
  notas_profesional?: string;
  comentario_profesional?: string;
}

/** Variables para marcar cita como no show */
export interface NoShowCitaVariables {
  id: number;
  motivo?: string;
}
