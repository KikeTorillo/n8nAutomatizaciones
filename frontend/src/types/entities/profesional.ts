import type { BaseEntity } from './common';

// ========== Union Types ==========

export type EstadoLaboral = 'activo' | 'vacaciones' | 'incapacidad' | 'suspendido' | 'baja';
export type TipoContratacion = 'tiempo_completo' | 'medio_tiempo' | 'temporal' | 'contrato' | 'freelance';
export type Genero = 'masculino' | 'femenino' | 'otro' | 'no_especificado';
export type EstadoCivil = 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'union_libre';
export type FormaPago = 'comision' | 'salario' | 'mixto';

// ========== Entidad Principal ==========

export interface Profesional extends BaseEntity {
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  direccion?: string;
  codigo_postal?: string;
  foto_url?: string;
  color?: string;
  activo: boolean;
  estado_laboral?: EstadoLaboral;
  tipo_contratacion?: TipoContratacion;
  genero?: Genero;
  estado_civil?: EstadoCivil;
  forma_pago?: FormaPago;
  fecha_nacimiento?: string;
  fecha_ingreso?: string;
  fecha_baja?: string;
  // Relaciones
  departamento_id?: number;
  departamento_nombre?: string;
  supervisor_id?: number;
  supervisor_nombre?: string;
  puesto_id?: number;
  puesto_nombre?: string;
  usuario_id?: number;
  usuario_email?: string;
  // Módulos
  modulos_acceso?: string[];
  // Metadata
  total_servicios?: number;
  total_citas?: number;
}

// ========== Request Types ==========

export interface CrearProfesionalData {
  nombre: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  descripcion?: string;
  direccion?: string;
  codigo_postal?: string;
  departamento_id?: number;
  supervisor_id?: number;
  puesto_id?: number;
  estado_laboral?: EstadoLaboral;
  tipo_contratacion?: TipoContratacion;
  forma_pago?: FormaPago;
}

export type ActualizarProfesionalData = Partial<CrearProfesionalData>;
