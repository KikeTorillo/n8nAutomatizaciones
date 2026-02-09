import type { BaseEntity, ISODateString } from './common';

// ========== Roles y Permisos ==========

export interface Rol extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  nivel_jerarquia: number;
  bypass_permisos: boolean;
  color?: string;
  icono?: string;
  es_rol_sistema: boolean;
  activo: boolean;
}

export interface Permiso extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  modulo: string;
  categoria?: string;
  tipo: 'boolean' | 'number' | 'string';
  valor_default: boolean | number | string;
}

export interface PermisoRol {
  rol_id: number;
  permiso_id: number;
  valor: boolean | number | string;
  permiso_codigo?: string;
  permiso_nombre?: string;
  permiso_modulo?: string;
}

// ========== Módulos ==========

export interface Modulo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activo: boolean;
  requiere_suscripcion: boolean;
}

// ========== Notificaciones ==========

export type TipoNotificacion = 'info' | 'warning' | 'error' | 'success';
export type CanalNotificacion = 'app' | 'email' | 'push' | 'whatsapp';

export interface Notificacion extends BaseEntity {
  usuario_id: number;
  tipo: TipoNotificacion;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_lectura?: ISODateString;
  enlace?: string;
  metadata?: Record<string, unknown>;
}

export interface PreferenciasNotificacion {
  canal: CanalNotificacion;
  tipo_evento: string;
  habilitado: boolean;
}

// ========== Workflows ==========

export type EstadoWorkflow = 'activo' | 'inactivo' | 'borrador';
export type TipoNodoWorkflow = 'trigger' | 'condition' | 'action' | 'delay' | 'branch';

export interface Workflow extends BaseEntity {
  nombre: string;
  descripcion?: string;
  estado: EstadoWorkflow;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  nodos?: WorkflowNodo[];
  activo: boolean;
}

export interface WorkflowNodo {
  id: string;
  tipo: TipoNodoWorkflow;
  nombre: string;
  config: Record<string, unknown>;
  posicion_x?: number;
  posicion_y?: number;
  siguiente_nodo_id?: string;
  nodo_verdadero_id?: string;
  nodo_falso_id?: string;
}

export interface EjecucionWorkflow extends BaseEntity {
  workflow_id: number;
  estado: 'pendiente' | 'ejecutando' | 'completado' | 'error';
  trigger_data?: Record<string, unknown>;
  resultado?: Record<string, unknown>;
  error?: string;
  fecha_inicio: ISODateString;
  fecha_fin?: ISODateString;
}

// ========== Custom Fields ==========

export type TipoCampoCustom = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url' | 'email' | 'phone';

export interface CustomField extends BaseEntity {
  nombre: string;
  codigo: string;
  tipo: TipoCampoCustom;
  entidad: string;
  descripcion?: string;
  requerido: boolean;
  opciones?: string[];
  valor_default?: string;
  orden: number;
  activo: boolean;
}

export interface CustomFieldValue {
  custom_field_id: number;
  entidad_id: number;
  valor: string | number | boolean | null;
}
