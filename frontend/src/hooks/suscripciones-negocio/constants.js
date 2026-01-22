/**
 * ====================================================================
 * CONSTANTES - SUSCRIPCIONES NEGOCIO
 * ====================================================================
 * Query keys y configuración para el módulo de suscripciones.
 */

// Query Keys base
export const QUERY_KEYS = {
  // Planes
  PLANES: 'suscripciones-negocio-planes',
  PLAN: 'suscripciones-negocio-plan',

  // Suscripciones
  SUSCRIPCIONES: 'suscripciones-negocio-suscripciones',
  SUSCRIPCION: 'suscripciones-negocio-suscripcion',
  SUSCRIPCION_HISTORIAL: 'suscripciones-negocio-suscripcion-historial',

  // Cupones
  CUPONES: 'suscripciones-negocio-cupones',
  CUPON: 'suscripciones-negocio-cupon',

  // Pagos
  PAGOS: 'suscripciones-negocio-pagos',
  PAGO: 'suscripciones-negocio-pago',
  PAGOS_RESUMEN: 'suscripciones-negocio-pagos-resumen',

  // Métricas
  METRICAS_DASHBOARD: 'suscripciones-negocio-metricas-dashboard',
  METRICAS_MRR: 'suscripciones-negocio-metricas-mrr',
  METRICAS_ARR: 'suscripciones-negocio-metricas-arr',
  METRICAS_CHURN: 'suscripciones-negocio-metricas-churn',
  METRICAS_LTV: 'suscripciones-negocio-metricas-ltv',
  METRICAS_SUSCRIPTORES: 'suscripciones-negocio-metricas-suscriptores',
  METRICAS_CRECIMIENTO: 'suscripciones-negocio-metricas-crecimiento',
  METRICAS_DISTRIBUCION: 'suscripciones-negocio-metricas-distribucion',
  METRICAS_TOP_PLANES: 'suscripciones-negocio-metricas-top-planes',
  METRICAS_EVOLUCION_MRR: 'suscripciones-negocio-metricas-evolucion-mrr',
  METRICAS_EVOLUCION_CHURN: 'suscripciones-negocio-metricas-evolucion-churn',
  METRICAS_EVOLUCION_SUSCRIPTORES: 'suscripciones-negocio-metricas-evolucion-suscriptores',
};

// Estados de suscripción
export const ESTADOS_SUSCRIPCION = {
  TRIAL: 'trial',
  ACTIVA: 'activa',
  PAUSADA: 'pausada',
  CANCELADA: 'cancelada',
  VENCIDA: 'vencida',
  PENDIENTE_PAGO: 'pendiente_pago',
};

// Labels para estados
export const ESTADO_LABELS = {
  [ESTADOS_SUSCRIPCION.TRIAL]: 'Prueba',
  [ESTADOS_SUSCRIPCION.ACTIVA]: 'Activa',
  [ESTADOS_SUSCRIPCION.PAUSADA]: 'Pausada',
  [ESTADOS_SUSCRIPCION.CANCELADA]: 'Cancelada',
  [ESTADOS_SUSCRIPCION.VENCIDA]: 'Vencida',
  [ESTADOS_SUSCRIPCION.PENDIENTE_PAGO]: 'Pendiente de pago',
};

// Colores para estados (Tailwind classes)
export const ESTADO_COLORS = {
  [ESTADOS_SUSCRIPCION.TRIAL]: 'blue',
  [ESTADOS_SUSCRIPCION.ACTIVA]: 'green',
  [ESTADOS_SUSCRIPCION.PAUSADA]: 'yellow',
  [ESTADOS_SUSCRIPCION.CANCELADA]: 'red',
  [ESTADOS_SUSCRIPCION.VENCIDA]: 'gray',
  [ESTADOS_SUSCRIPCION.PENDIENTE_PAGO]: 'orange',
};

// Ciclos de facturación
export const CICLOS_FACTURACION = {
  MENSUAL: 'mensual',
  TRIMESTRAL: 'trimestral',
  SEMESTRAL: 'semestral',
  ANUAL: 'anual',
};

// Labels para ciclos
export const CICLO_LABELS = {
  [CICLOS_FACTURACION.MENSUAL]: 'Mensual',
  [CICLOS_FACTURACION.TRIMESTRAL]: 'Trimestral',
  [CICLOS_FACTURACION.SEMESTRAL]: 'Semestral',
  [CICLOS_FACTURACION.ANUAL]: 'Anual',
};

// Tipos de descuento
export const TIPOS_DESCUENTO = {
  PORCENTAJE: 'porcentaje',
  MONTO_FIJO: 'monto_fijo',
};

// Labels para tipos de descuento
export const TIPO_DESCUENTO_LABELS = {
  [TIPOS_DESCUENTO.PORCENTAJE]: 'Porcentaje',
  [TIPOS_DESCUENTO.MONTO_FIJO]: 'Monto fijo',
};

// Estados de pago
export const ESTADOS_PAGO = {
  PENDIENTE: 'pendiente',
  COMPLETADO: 'completado',
  FALLIDO: 'fallido',
  REEMBOLSADO: 'reembolsado',
  PARCIAL: 'parcial',
};

// Labels para estados de pago
export const ESTADO_PAGO_LABELS = {
  [ESTADOS_PAGO.PENDIENTE]: 'Pendiente',
  [ESTADOS_PAGO.COMPLETADO]: 'Completado',
  [ESTADOS_PAGO.FALLIDO]: 'Fallido',
  [ESTADOS_PAGO.REEMBOLSADO]: 'Reembolsado',
  [ESTADOS_PAGO.PARCIAL]: 'Parcial',
};

// Colores para estados de pago
export const ESTADO_PAGO_COLORS = {
  [ESTADOS_PAGO.PENDIENTE]: 'yellow',
  [ESTADOS_PAGO.COMPLETADO]: 'green',
  [ESTADOS_PAGO.FALLIDO]: 'red',
  [ESTADOS_PAGO.REEMBOLSADO]: 'purple',
  [ESTADOS_PAGO.PARCIAL]: 'orange',
};

// Métodos de pago
export const METODOS_PAGO = {
  STRIPE: 'stripe',
  MERCADOPAGO: 'mercadopago',
  TRANSFERENCIA: 'transferencia',
  EFECTIVO: 'efectivo',
  OTRO: 'otro',
};

// Labels para métodos de pago
export const METODO_PAGO_LABELS = {
  [METODOS_PAGO.STRIPE]: 'Stripe',
  [METODOS_PAGO.MERCADOPAGO]: 'MercadoPago',
  [METODOS_PAGO.TRANSFERENCIA]: 'Transferencia',
  [METODOS_PAGO.EFECTIVO]: 'Efectivo',
  [METODOS_PAGO.OTRO]: 'Otro',
};
