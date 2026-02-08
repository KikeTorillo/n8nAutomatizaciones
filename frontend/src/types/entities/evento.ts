import type { BaseEntity, ISODateString } from './common';

// ========== Union Types ==========

export type TipoEvento = 'boda' | 'xv' | 'bautizo' | 'cumpleanos' | 'otro';

export type EstadoEvento = 'borrador' | 'publicado' | 'finalizado';

export type EstadoRsvp = 'pendiente' | 'confirmado' | 'declinado';

export type TipoMesa = 'redonda' | 'rectangular' | 'cuadrada';

export type EstadoFoto = 'visible' | 'oculta' | 'eliminada';

export type TipoUbicacion = 'ceremonia' | 'recepcion' | 'fiesta' | 'otro';

// ========== Evento Digital ==========

export interface EventoDigital extends BaseEntity {
  plantilla_id?: number;
  nombre: string;
  tipo: TipoEvento;
  slug: string;
  descripcion?: string;
  fecha_evento: ISODateString;
  hora_evento?: string;
  fecha_fin_evento?: string;
  fecha_limite_rsvp?: string;
  protagonistas?: Record<string, unknown>[];
  portada_url?: string;
  galeria_urls?: string[];
  configuracion?: Record<string, unknown>;
  plantilla?: Record<string, unknown>;
  estado: EstadoEvento;
  publicado_en?: ISODateString;
  activo: boolean;
  // Campos computados (joins)
  plantilla_nombre?: string;
  plantilla_codigo?: string;
  total_invitados?: number;
  total_confirmados?: number;
  total_pendientes?: number;
  ubicaciones?: Ubicacion[];
  mesa_regalos?: Regalo[];
}

// ========== Invitado ==========

export interface Invitado extends BaseEntity {
  evento_id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  grupo_familiar?: string;
  etiquetas: string[];
  max_acompanantes: number;
  token: string;
  estado_rsvp: EstadoRsvp;
  num_asistentes?: number;
  nombres_acompanantes?: string[];
  mensaje_rsvp?: string;
  restricciones_dieteticas?: string;
  confirmado_en?: ISODateString;
  confirmado_via?: string;
  mesa_id?: number;
  checkin_at?: ISODateString;
  ultima_visualizacion?: ISODateString;
  total_visualizaciones?: number;
  activo: boolean;
  // Campos computados (joins)
  evento_nombre?: string;
  mesa_nombre?: string;
  mesa_numero?: number;
}

// ========== Plantilla ==========

export interface Plantilla {
  id: number;
  codigo: string;
  nombre: string;
  tipo_evento: TipoEvento;
  preview_url?: string;
  categoria?: string;
  subcategoria?: string;
  tema?: Record<string, unknown>;
  bloques_plantilla?: Record<string, unknown>[];
  estructura_html?: string;
  estilos_css?: string;
  es_premium: boolean;
  activo: boolean;
  orden: number;
}

// ========== Mesa (Seating Chart) ==========

export interface Mesa extends BaseEntity {
  evento_id: number;
  nombre: string;
  numero?: number;
  tipo: TipoMesa;
  posicion_x: number;
  posicion_y: number;
  rotacion: number;
  capacidad: number;
  activo: boolean;
  // Campos computados (joins)
  invitados?: Pick<Invitado, 'id' | 'nombre' | 'num_asistentes' | 'estado_rsvp' | 'grupo_familiar'>[];
  total_invitados?: number;
  total_personas?: number;
}

// ========== Foto Galeria ==========

export interface FotoGaleria {
  id: number;
  evento_id: number;
  invitado_id?: number;
  url: string;
  thumbnail_url?: string;
  nombre_autor?: string;
  caption?: string;
  tamanio_bytes?: number;
  tipo_mime?: string;
  estado: EstadoFoto;
  reportada?: boolean;
  motivo_reporte?: string;
  creado_en: ISODateString;
  // Campos computados (joins)
  invitado_nombre?: string;
}

// ========== Felicitacion ==========

export interface Felicitacion {
  id: number;
  evento_id: number;
  invitado_id?: number;
  nombre_autor: string;
  mensaje: string;
  aprobado: boolean;
  creado_en: ISODateString;
  // Campos computados (joins)
  invitado_nombre?: string;
}

// ========== Ubicacion ==========

export interface Ubicacion {
  id: number;
  evento_id: number;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  google_maps_url?: string;
  hora_inicio?: string;
  hora_fin?: string;
  codigo_vestimenta?: string;
  notas?: string;
  orden: number;
  activo: boolean;
}

// ========== Regalo (Mesa de Regalos) ==========

export interface Regalo {
  id: number;
  evento_id: number;
  tipo?: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  imagen_url?: string;
  url_externa?: string;
  comprado: boolean;
  comprado_por?: string;
  comprado_en?: ISODateString;
  orden: number;
  activo: boolean;
}
