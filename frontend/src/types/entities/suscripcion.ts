import type { BaseEntity } from './common';

// ========================================================================
// Union Types
// ========================================================================

export type CicloFacturacion = 'mensual' | 'trimestral' | 'semestral' | 'anual';

export type EstadoSuscripcion =
  | 'trial'
  | 'pendiente_pago'
  | 'activa'
  | 'pausada'
  | 'cancelada'
  | 'vencida'
  | 'grace_period'
  | 'suspendida';

export type EstadoPago = 'pendiente' | 'completado' | 'fallido' | 'reembolsado';

export type TipoDescuento = 'porcentaje' | 'monto';

// ========================================================================
// Planes de Suscripcion
// ========================================================================

export interface PlanSuscripcion extends BaseEntity {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio_mensual: number;
  precio_trimestral?: number;
  precio_semestral?: number;
  precio_anual?: number;
  moneda: string;
  dias_trial: number;
  limites: Record<string, number>;
  features: string[];
  modulos_habilitados: string[];
  precio_usuario_adicional?: number;
  usuarios_incluidos?: number;
  max_usuarios_hard?: number;
  color?: string;
  icono?: string;
  destacado: boolean;
  activo: boolean;
  publico?: boolean;
  orden_display: number;
  creado_en: string;
  actualizado_en: string;
  creado_por?: number;
}

// ========================================================================
// Suscripciones
// ========================================================================

export interface SuscripcionOrg extends BaseEntity {
  plan_id: number;
  cliente_id?: number;
  suscriptor_externo?: Record<string, unknown>;
  periodo: CicloFacturacion;
  estado: EstadoSuscripcion;
  fecha_inicio: string;
  fecha_proximo_cobro?: string;
  fecha_fin?: string;
  es_trial: boolean;
  fecha_fin_trial?: string;
  fecha_gracia?: string;
  gateway?: string;
  customer_id_gateway?: string;
  subscription_id_gateway?: string;
  payment_method_id?: string;
  precio_actual: number;
  moneda: string;
  auto_cobro?: boolean;
  meses_activo: number;
  total_pagado: number;
  cupon_aplicado_id?: number;
  descuento_porcentaje?: number;
  descuento_monto?: number;
  razon_cancelacion?: string;
  cancelado_por?: number;
  creado_en: string;
  actualizado_en: string;
  creado_por?: number;
  // JOINs del backend
  plan_nombre?: string;
  plan_codigo?: string;
  plan_features?: string[];
  plan_limites?: Record<string, number>;
  modulos_habilitados?: string[];
  cliente_nombre?: string;
  cliente_email?: string;
}

// ========================================================================
// Pagos
// ========================================================================

export interface PagoSuscripcion extends BaseEntity {
  suscripcion_id: number;
  monto: number;
  moneda: string;
  estado: EstadoPago;
  gateway?: string;
  transaction_id?: string;
  payment_intent_id?: string;
  charge_id?: string;
  metodo_pago?: string;
  ultimos_digitos?: string;
  fecha_pago?: string;
  fecha_inicio_periodo?: string;
  fecha_fin_periodo?: string;
  reembolsado?: boolean;
  fecha_reembolso?: string;
  monto_reembolsado?: number;
  razon_reembolso?: string;
  metadata?: Record<string, unknown>;
  procesado_por?: number;
  creado_en: string;
  actualizado_en?: string;
  // JOINs del backend
  plan_nombre?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_id?: number;
  suscriptor_externo?: Record<string, unknown>;
}

// ========================================================================
// Cupones
// ========================================================================

export interface CuponSuscripcion extends BaseEntity {
  codigo: string;
  nombre?: string;
  descripcion?: string;
  tipo_descuento: TipoDescuento;
  porcentaje_descuento?: number;
  monto_descuento?: number;
  moneda?: string;
  duracion_descuento?: string;
  meses_duracion?: number;
  fecha_inicio: string;
  fecha_expiracion?: string;
  usos_maximos?: number;
  usos_actuales: number;
  planes_aplicables?: number[];
  solo_primer_pago?: boolean;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}
