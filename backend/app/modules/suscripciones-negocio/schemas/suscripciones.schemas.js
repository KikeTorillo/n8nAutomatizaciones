/**
 * ====================================================================
 * SCHEMAS: SUSCRIPCIONES-NEGOCIO
 * ====================================================================
 * Validaciones Joi para el módulo de suscripciones.
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

// ====================================================================
// SCHEMAS: PLANES
// ====================================================================

const crearPlan = Joi.object({
    codigo: fields.codigo.required(),
    nombre: fields.nombre.required(),
    descripcion: fields.descripcion,
    precio_mensual: fields.precio.default(0),
    precio_trimestral: fields.precio,
    precio_semestral: fields.precio,
    precio_anual: fields.precio,
    moneda: fields.codigoMoneda.default('MXN'),
    dias_trial: Joi.number().integer().min(0).max(365).default(0),
    limites: fields.metadata.default({}),
    features: Joi.array().items(Joi.string()).default([]),
    color: fields.colorHex.default('#6366F1'),
    icono: fields.icono.default('package'),
    destacado: Joi.boolean().default(false),
    activo: fields.activo.default(true),
    orden_display: fields.orden.default(0)
});

const actualizarPlan = Joi.object({
    nombre: fields.nombre,
    descripcion: fields.descripcion,
    precio_mensual: fields.precio,
    precio_trimestral: fields.precio,
    precio_semestral: fields.precio,
    precio_anual: fields.precio,
    moneda: fields.codigoMoneda,
    dias_trial: Joi.number().integer().min(0).max(365),
    limites: fields.metadata,
    features: Joi.array().items(Joi.string()),
    color: fields.colorHex,
    icono: fields.icono,
    destacado: Joi.boolean(),
    activo: fields.activo,
    orden_display: fields.orden
}).min(1);

const listarPlanes = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    activo: Joi.boolean(),
    busqueda: Joi.string().max(200).trim()
});

// ====================================================================
// SCHEMAS: SUSCRIPCIONES
// ====================================================================

const crearSuscripcion = Joi.object({
    plan_id: Joi.number().integer().positive().required(),
    cliente_id: Joi.number().integer().positive(),
    suscriptor_externo: Joi.object({
        nombre: Joi.string().max(200).required(),
        email: Joi.string().email().max(200).required(),
        telefono: Joi.string().max(20),
        empresa: Joi.string().max(200)
    }),
    periodo: Joi.string().valid('mensual', 'trimestral', 'semestral', 'anual').default('mensual'),
    es_trial: Joi.boolean().default(false),
    fecha_inicio: fields.fecha,
    cupon_codigo: Joi.string().max(50).uppercase().trim(),
    gateway: Joi.string().valid('stripe', 'mercadopago', 'manual').default('manual'),
    customer_id_gateway: Joi.string().max(100),
    metadata: fields.metadata
}).xor('cliente_id', 'suscriptor_externo');

const actualizarSuscripcion = Joi.object({
    periodo: Joi.string().valid('mensual', 'trimestral', 'semestral', 'anual'),
    gateway: Joi.string().valid('stripe', 'mercadopago', 'manual'),
    customer_id_gateway: Joi.string().max(100).allow(null),
    subscription_id_gateway: Joi.string().max(100).allow(null),
    payment_method_id: Joi.string().max(100).allow(null),
    auto_cobro: Joi.boolean(),
    metadata: fields.metadata
}).min(1);

const cambiarEstado = Joi.object({
    nuevo_estado: Joi.string()
        .valid('trial', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida')
        .required(),
    razon: Joi.string().max(500).trim()
});

const cambiarPlan = Joi.object({
    nuevo_plan_id: Joi.number().integer().positive().required(),
    periodo: Joi.string().valid('mensual', 'trimestral', 'semestral', 'anual'),
    cambio_inmediato: Joi.boolean().default(false)
});

const cancelarSuscripcion = Joi.object({
    motivo_cancelacion: Joi.string().min(10).max(500).trim().required()
        .messages({
            'string.min': 'El motivo de cancelación debe tener al menos 10 caracteres',
            'string.max': 'El motivo de cancelación no puede exceder 500 caracteres',
            'any.required': 'El motivo de cancelación es obligatorio'
        }),
    inmediato: Joi.boolean().default(false)
});

const pausarSuscripcion = Joi.object({
    razon: Joi.string().max(500).trim().required()
});

const actualizarProximoCobro = Joi.object({
    fecha_proximo_cobro: fields.fecha.required()
});

const listarSuscripciones = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    estado: Joi.string().valid('trial', 'activa', 'pausada', 'cancelada', 'vencida', 'suspendida'),
    plan_id: Joi.number().integer().positive(),
    cliente_id: Joi.number().integer().positive(),
    periodo: Joi.string().valid('mensual', 'trimestral', 'semestral', 'anual'),
    es_trial: Joi.boolean(),
    gateway: Joi.string().valid('stripe', 'mercadopago', 'manual'),
    auto_cobro: Joi.boolean(),
    busqueda: Joi.string().max(200).trim(),
    fecha_desde: fields.fecha,
    fecha_hasta: fields.fecha
});

// ====================================================================
// SCHEMAS: CUSTOMER BILLING (Admin crea suscripción para cliente)
// ====================================================================

/**
 * Crear suscripción para un cliente (Customer Billing)
 * Genera un token/link de checkout para que el cliente pague
 */
const crearParaCliente = Joi.object({
    cliente_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID del cliente debe ser un número',
            'any.required': 'El cliente es requerido'
        }),

    plan_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID del plan debe ser un número',
            'any.required': 'El plan es requerido'
        }),

    periodo: Joi.string()
        .valid('mensual', 'trimestral', 'semestral', 'anual')
        .default('mensual')
        .messages({
            'any.only': 'El período debe ser: mensual, trimestral, semestral o anual'
        }),

    cupon_codigo: Joi.string()
        .trim()
        .uppercase()
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'El código del cupón no puede exceder 50 caracteres'
        }),

    notificar_cliente: Joi.boolean()
        .default(true)
        .messages({
            'boolean.base': 'notificar_cliente debe ser booleano'
        }),

    dias_expiracion: Joi.number()
        .integer()
        .min(1)
        .max(30)
        .default(7)
        .messages({
            'number.min': 'El link debe ser válido por al menos 1 día',
            'number.max': 'El link no puede ser válido por más de 30 días'
        })
});

/**
 * Listar tokens de checkout generados
 */
const listarCheckoutTokens = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    estado: Joi.string().valid('pendiente', 'usado', 'expirado', 'cancelado'),
    cliente_id: Joi.number().integer().positive()
});

// ====================================================================
// SCHEMAS: PAGOS
// ====================================================================

const crearPago = Joi.object({
    suscripcion_id: Joi.number().integer().positive().required(),
    monto: fields.precio.required(),
    moneda: fields.codigoMoneda.default('MXN'),
    estado: Joi.string()
        .valid('pendiente', 'completado', 'fallido', 'reembolsado')
        .default('pendiente'),
    gateway: Joi.string().valid('stripe', 'mercadopago', 'manual').required(),
    transaction_id: Joi.string().max(100),
    payment_intent_id: Joi.string().max(100),
    charge_id: Joi.string().max(100),
    metodo_pago: Joi.string().max(50),
    ultimos_digitos: Joi.string().max(4),
    fecha_inicio_periodo: fields.fecha,
    fecha_fin_periodo: fields.fecha,
    metadata: fields.metadata,
    procesado_por: Joi.string().max(200)
});

const actualizarEstadoPago = Joi.object({
    estado: Joi.string()
        .valid('pendiente', 'completado', 'fallido', 'reembolsado')
        .required()
});

const procesarReembolso = Joi.object({
    monto_reembolso: fields.precio.required(),
    razon: Joi.string().max(500).trim().required()
});

const listarPagos = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    estado: Joi.string().valid('pendiente', 'completado', 'fallido', 'reembolsado'),
    suscripcion_id: Joi.number().integer().positive(),
    gateway: Joi.string().valid('stripe', 'mercadopago', 'manual'),
    fecha_desde: fields.fecha,
    fecha_hasta: fields.fecha
});

const resumenPagos = Joi.object({
    mes_actual: Joi.boolean().default(true)
});

// ====================================================================
// SCHEMAS: CUPONES
// ====================================================================

const crearCupon = Joi.object({
    codigo: Joi.string().min(3).max(50).uppercase().trim().required(),
    nombre: fields.nombre.required(),
    descripcion: fields.descripcion,
    tipo_descuento: Joi.string().valid('porcentaje', 'monto').required(),
    porcentaje_descuento: Joi.when('tipo_descuento', {
        is: 'porcentaje',
        then: fields.porcentaje.min(1).max(100).required(),
        otherwise: Joi.forbidden()
    }),
    monto_descuento: Joi.when('tipo_descuento', {
        is: 'monto',
        then: fields.precio.positive().required(),
        otherwise: Joi.forbidden()
    }),
    moneda: fields.codigoMoneda.default('MXN'),
    duracion_descuento: Joi.string()
        .valid('una_vez', 'siempre', 'meses')
        .default('una_vez'),
    meses_duracion: Joi.when('duracion_descuento', {
        is: 'meses',
        then: Joi.number().integer().min(1).max(120).required(),
        otherwise: Joi.forbidden()
    }),
    fecha_inicio: fields.fecha.required(),
    fecha_expiracion: fields.fecha,
    usos_maximos: Joi.number().integer().positive(),
    planes_aplicables: Joi.array().items(Joi.string().max(50)),
    solo_primer_pago: Joi.boolean().default(false),
    activo: fields.activo.default(true)
});

const actualizarCupon = Joi.object({
    nombre: fields.nombre,
    descripcion: fields.descripcion,
    tipo_descuento: Joi.string().valid('porcentaje', 'monto'),
    porcentaje_descuento: fields.porcentaje.min(1).max(100),
    monto_descuento: fields.precio.positive(),
    duracion_descuento: Joi.string().valid('una_vez', 'siempre', 'meses'),
    meses_duracion: Joi.number().integer().min(1).max(120),
    fecha_inicio: fields.fecha,
    fecha_expiracion: fields.fecha,
    usos_maximos: Joi.number().integer().positive(),
    planes_aplicables: Joi.array().items(Joi.string().max(50)),
    solo_primer_pago: Joi.boolean(),
    activo: fields.activo
}).min(1);

const validarCupon = Joi.object({
    codigo: Joi.string().max(50).uppercase().trim().required(),
    plan_id: Joi.number().integer().positive()
});

const listarCupones = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    activo: Joi.boolean(),
    tipo_descuento: Joi.string().valid('porcentaje', 'monto'),
    busqueda: Joi.string().max(200).trim()
});

// ====================================================================
// SCHEMAS: MÉTRICAS
// ====================================================================

const metricasPorFecha = Joi.object({
    fecha: fields.fecha
});

const metricasPorMes = Joi.object({
    mes: fields.fecha
});

const metricasEvolucion = Joi.object({
    meses: Joi.number().integer().min(1).max(24).default(12)
});

const metricasTopPlanes = Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(10)
});

// ====================================================================
// EXPORTAR SCHEMAS
// ====================================================================

module.exports = {
    // Planes
    crearPlan,
    actualizarPlan,
    listarPlanes,

    // Suscripciones
    crearSuscripcion,
    actualizarSuscripcion,
    cambiarEstado,
    cambiarPlan,
    cancelarSuscripcion,
    pausarSuscripcion,
    actualizarProximoCobro,
    listarSuscripciones,

    // Customer Billing (Admin → Cliente)
    crearParaCliente,
    listarCheckoutTokens,

    // Pagos
    crearPago,
    actualizarEstadoPago,
    procesarReembolso,
    listarPagos,
    resumenPagos,

    // Cupones
    crearCupon,
    actualizarCupon,
    validarCupon,
    listarCupones,

    // Métricas
    metricasPorFecha,
    metricasPorMes,
    metricasEvolucion,
    metricasTopPlanes
};
