import type { BaseEntity, ISODateString } from './common';

// ========== Documentos de Empleado ==========

export type TipoDocumentoEmpleado =
  | 'identificacion'
  | 'comprobante_domicilio'
  | 'acta_nacimiento'
  | 'curp'
  | 'rfc'
  | 'nss'
  | 'contrato'
  | 'carta_recomendacion'
  | 'curriculum'
  | 'certificado'
  | 'otro';

export type EstadoVencimientoDocumento = 'vigente' | 'por_vencer' | 'vencido' | 'sin_vencimiento';

export interface DocumentoEmpleado extends BaseEntity {
  profesional_id: number;
  tipo_documento: TipoDocumentoEmpleado;
  nombre: string;
  descripcion?: string;
  archivo_url?: string;
  archivo_nombre?: string;
  archivo_tipo?: string;
  archivo_tamano?: number;
  fecha_vencimiento?: ISODateString;
  estado_vencimiento?: EstadoVencimientoDocumento;
  verificado: boolean;
  verificado_por?: number;
  fecha_verificacion?: ISODateString;
  notas_verificacion?: string;
  activo: boolean;
}

// ========== Experiencia Laboral ==========

export interface ExperienciaLaboral extends BaseEntity {
  profesional_id: number;
  empresa: string;
  puesto: string;
  descripcion?: string;
  fecha_inicio: ISODateString;
  fecha_fin?: ISODateString;
  es_empleo_actual: boolean;
  ubicacion?: string;
  sector?: string;
  motivo_salida?: string;
  orden?: number;
  activo: boolean;
}

// ========== Educación Formal ==========

export type NivelEducacion =
  | 'primaria'
  | 'secundaria'
  | 'preparatoria'
  | 'tecnico'
  | 'licenciatura'
  | 'maestria'
  | 'doctorado'
  | 'otro';

export type EstadoEstudio = 'en_curso' | 'completado' | 'trunco' | 'titulado';

export interface EducacionFormal extends BaseEntity {
  profesional_id: number;
  institucion: string;
  titulo: string;
  nivel: NivelEducacion;
  estado: EstadoEstudio;
  campo_estudio?: string;
  fecha_inicio: ISODateString;
  fecha_fin?: ISODateString;
  cedula_profesional?: string;
  descripcion?: string;
  orden?: number;
  activo: boolean;
}

// ========== Habilidades ==========

export type NivelHabilidad = 'basico' | 'intermedio' | 'avanzado' | 'experto';
export type CategoriaHabilidad = 'tecnica' | 'blanda' | 'idioma' | 'certificacion' | 'otra';

export interface Habilidad extends BaseEntity {
  nombre: string;
  codigo?: string;
  categoria: CategoriaHabilidad;
  descripcion?: string;
  activo: boolean;
}

export interface HabilidadEmpleado extends BaseEntity {
  profesional_id: number;
  habilidad_id: number;
  nivel: NivelHabilidad;
  anios_experiencia?: number;
  verificado: boolean;
  verificado_por?: number;
  notas?: string;
  certificaciones?: string;
  // Relaciones expandidas
  habilidad_nombre?: string;
  habilidad_categoria?: CategoriaHabilidad;
}

// ========== Cuentas Bancarias ==========

export type TipoCuentaBancaria = 'debito' | 'ahorro' | 'nomina' | 'credito';
export type UsoCuentaBancaria = 'nomina' | 'reembolsos' | 'comisiones' | 'todos';
export type MonedaCuenta = 'MXN' | 'USD' | 'COP' | 'EUR';

export interface CuentaBancaria extends BaseEntity {
  profesional_id: number;
  banco: string;
  numero_cuenta?: string;
  clabe?: string;
  tipo_cuenta: TipoCuentaBancaria;
  uso: UsoCuentaBancaria;
  moneda: MonedaCuenta;
  es_principal: boolean;
  activo: boolean;
}

// ========== Incapacidades ==========

export type TipoIncapacidad = 'enfermedad_general' | 'maternidad' | 'riesgo_trabajo';
export type EstadoIncapacidad = 'activa' | 'finalizada' | 'cancelada';

export interface Incapacidad extends BaseEntity {
  profesional_id: number;
  tipo_incapacidad: TipoIncapacidad;
  estado: EstadoIncapacidad;
  fecha_inicio: ISODateString;
  fecha_fin: ISODateString;
  dias_incapacidad: number;
  numero_folio?: string;
  institucion_medica?: string;
  diagnostico?: string;
  notas?: string;
  motivo_cancelacion?: string;
  fecha_finalizacion?: ISODateString;
  // Relaciones expandidas
  profesional_nombre?: string;
  prorrogas?: Prorroga[];
}

export interface Prorroga {
  id: number;
  incapacidad_id: number;
  fecha_inicio: ISODateString;
  fecha_fin: ISODateString;
  dias: number;
  notas?: string;
}

// ========== Categorías Profesional ==========

export interface CategoriaProfesional extends BaseEntity {
  nombre: string;
  descripcion?: string;
  color?: string;
  activo: boolean;
}

// ========== Onboarding ==========

export interface PlantillaOnboarding extends BaseEntity {
  nombre: string;
  descripcion?: string;
  tareas: TareaOnboarding[];
  activo: boolean;
}

export interface TareaOnboarding {
  id: number;
  titulo: string;
  descripcion?: string;
  orden: number;
  categoria?: string;
  obligatoria: boolean;
}

export interface ProgresoOnboarding {
  tarea_id: number;
  completado: boolean;
  fecha_completado?: ISODateString;
  notas?: string;
}
