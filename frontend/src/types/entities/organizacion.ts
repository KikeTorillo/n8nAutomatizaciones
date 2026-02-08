import type { BaseEntity } from './common';

// ========== Entidad Principal ==========

export interface Organizacion extends BaseEntity {
  nombre: string;
  slug?: string;
  tipo_negocio?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  logo_url?: string;
  activo: boolean;
  configuracion?: Record<string, unknown>;
  trial_fin?: string;
}

// ========== Request Types ==========

export interface OrganizacionRegisterData {
  organizacion: {
    nombre: string;
    tipo_negocio?: string;
    telefono?: string;
    email?: string;
  };
  admin: {
    nombre: string;
    apellidos?: string;
    email: string;
    password: string;
  };
  aplicar_plantilla_servicios?: boolean;
}

// ========== Response Types ==========

export interface SetupProgress {
  completed: boolean;
  profesionales: boolean;
  horarios_configurados: boolean;
  servicios: boolean;
  asignaciones: boolean;
  progress: number;
}

export interface EstadoSuscripcionOrg {
  plan_actual: string | null;
  es_trial: boolean;
  dias_restantes_trial: number;
  fecha_fin_trial: string | null;
  trial_expirado: boolean;
}

export interface EstadisticasOrganizacion {
  total_clientes: number;
  total_profesionales: number;
  total_servicios: number;
  total_citas: number;
  total_ventas: number;
}
