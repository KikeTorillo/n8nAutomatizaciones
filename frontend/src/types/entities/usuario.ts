import type { BaseEntity } from './common';

// ========== Union Types ==========

export type RolUsuario = 'super_admin' | 'admin' | 'propietario' | 'supervisor' | 'empleado';

// ========== Entidad Principal ==========

export interface Usuario extends BaseEntity {
  email: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  rol: RolUsuario;
  activo: boolean;
  profesional_id?: number;
  profesional_nombre?: string;
  avatar_url?: string;
  ultimo_acceso?: string;
}

// ========== Request Types ==========

export interface CrearUsuarioData {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
  rol?: RolUsuario;
  profesional_id?: number;
  activo?: boolean;
}

export interface ActualizarUsuarioData {
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  avatar_url?: string;
}

// ========== Ubicaciones ==========

export interface AsignacionUbicacion {
  id: number;
  usuario_id: number;
  ubicacion_id: number;
  es_default: boolean;
  puede_recibir: boolean;
  puede_despachar: boolean;
  ubicacion_nombre?: string;
}
