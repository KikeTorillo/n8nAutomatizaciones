/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * Validación Joi para oportunidades y etapas
 *
 * ====================================================================
 */

const Joi = require('joi');
const { withPagination, idOptional, prioridad, fields } = require('../../../schemas/shared');

// ====================================================================
// SCHEMAS DE ETAPAS
// ====================================================================

const etapaSchema = Joi.object({
    nombre: Joi.string().min(1).max(50).required()
        .messages({
            'string.empty': 'El nombre de la etapa es requerido',
            'string.max': 'El nombre no puede exceder 50 caracteres'
        }),
    descripcion: Joi.string().max(200).allow('', null),
    probabilidad_default: Joi.number().integer().min(0).max(100).default(10),
    color: fields.colorHex.default('#6366F1'),
    orden: Joi.number().integer().min(0),
    es_ganada: Joi.boolean().default(false),
    es_perdida: Joi.boolean().default(false)
}).custom((value, helpers) => {
    // Validar que no sea ganada y perdida al mismo tiempo
    if (value.es_ganada && value.es_perdida) {
        return helpers.error('any.custom', { message: 'Una etapa no puede ser ganada y perdida al mismo tiempo' });
    }
    return value;
});

const actualizarEtapaSchema = Joi.object({
    nombre: Joi.string().min(1).max(50),
    descripcion: Joi.string().max(200).allow('', null),
    probabilidad_default: Joi.number().integer().min(0).max(100),
    color: fields.colorHex,
    orden: Joi.number().integer().min(0),
    es_ganada: Joi.boolean(),
    es_perdida: Joi.boolean(),
    activo: Joi.boolean()
}).min(1);

const reordenarEtapasSchema = Joi.object({
    orden: Joi.array().items(Joi.number().integer().positive()).min(1).required()
        .messages({
            'array.min': 'Se requiere al menos una etapa',
            'any.required': 'El array de orden es requerido'
        })
});

// ====================================================================
// SCHEMAS DE OPORTUNIDADES
// ====================================================================

const oportunidadSchema = Joi.object({
    cliente_id: Joi.number().integer().positive()
        .messages({
            'number.positive': 'cliente_id debe ser un número positivo'
        }),
    etapa_id: Joi.number().integer().positive().allow(null),
    nombre: Joi.string().min(1).max(200).required()
        .messages({
            'string.empty': 'El nombre de la oportunidad es requerido',
            'string.max': 'El nombre no puede exceder 200 caracteres'
        }),
    descripcion: Joi.string().max(2000).allow('', null),
    probabilidad: Joi.number().integer().min(0).max(100).default(10),
    fecha_cierre_esperada: Joi.date().iso().allow(null),
    ingreso_esperado: Joi.number().min(0).default(0),
    moneda: Joi.string().length(3).uppercase().default('MXN'),
    vendedor_id: Joi.number().integer().positive().allow(null),
    prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente').default('normal'),
    fuente: Joi.string().max(50).allow('', null)
});

const actualizarOportunidadSchema = Joi.object({
    etapa_id: Joi.number().integer().positive().allow(null),
    nombre: Joi.string().min(1).max(200),
    descripcion: Joi.string().max(2000).allow('', null),
    probabilidad: Joi.number().integer().min(0).max(100),
    fecha_cierre_esperada: Joi.date().iso().allow(null),
    ingreso_esperado: Joi.number().min(0),
    moneda: Joi.string().length(3).uppercase(),
    vendedor_id: Joi.number().integer().positive().allow(null),
    prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente'),
    fuente: Joi.string().max(50).allow('', null),
    estado: Joi.string().valid('abierta', 'ganada', 'perdida'),
    motivo_perdida: Joi.string().max(200).allow('', null)
}).min(1);

const moverOportunidadSchema = Joi.object({
    etapa_id: Joi.number().integer().positive().required()
        .messages({
            'any.required': 'Se requiere la etapa de destino'
        })
});

const marcarPerdidaSchema = Joi.object({
    motivo_perdida: Joi.string().max(200).allow('', null)
});

// ====================================================================
// SCHEMAS DE QUERY PARAMS
// ====================================================================

const listarOportunidadesQuerySchema = withPagination({
    cliente_id: idOptional,
    etapa_id: idOptional,
    vendedor_id: idOptional,
    estado: Joi.string().valid('abierta', 'ganada', 'perdida'),
    prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente'),
    fecha_desde: Joi.date().iso(),
    fecha_hasta: Joi.date().iso(),
    busqueda: Joi.string().max(100)
});

const pronosticoQuerySchema = Joi.object({
    fecha_inicio: Joi.date().iso(),
    fecha_fin: Joi.date().iso()
});

module.exports = {
    // Etapas
    etapaSchema,
    actualizarEtapaSchema,
    reordenarEtapasSchema,

    // Oportunidades
    oportunidadSchema,
    actualizarOportunidadSchema,
    moverOportunidadSchema,
    marcarPerdidaSchema,

    // Query params
    listarOportunidadesQuerySchema,
    pronosticoQuerySchema
};
