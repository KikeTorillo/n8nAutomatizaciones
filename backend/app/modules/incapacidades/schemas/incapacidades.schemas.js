/**
 * Schemas Joi para Módulo de Incapacidades
 * Enero 2026
 */

const Joi = require('joi');
const { withPagination } = require('../../../schemas/shared');
const {
    TIPOS_INCAPACIDAD,
    ESTADOS_INCAPACIDAD,
} = require('../constants/incapacidades.constants');

// ==================== CREAR INCAPACIDAD ====================

const crear = {
    params: Joi.object({}),
    body: Joi.object({
        profesional_id: Joi.number().integer().positive().required()
            .messages({ 'any.required': 'El profesional es obligatorio' }),

        folio_imss: Joi.string().max(50).required()
            .messages({ 'any.required': 'El folio IMSS es obligatorio' }),

        tipo_incapacidad: Joi.string()
            .valid(...Object.values(TIPOS_INCAPACIDAD))
            .required()
            .messages({
                'any.required': 'El tipo de incapacidad es obligatorio',
                'any.only': 'Tipo de incapacidad no válido',
            }),

        fecha_inicio: Joi.date().iso().required()
            .messages({ 'any.required': 'La fecha de inicio es obligatoria' }),

        fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).required()
            .messages({
                'any.required': 'La fecha de fin es obligatoria',
                'date.min': 'La fecha de fin debe ser igual o posterior a la fecha de inicio',
            }),

        dias_autorizados: Joi.number().integer().min(1).required()
            .messages({
                'any.required': 'Los días autorizados son obligatorios',
                'number.min': 'Los días autorizados deben ser al menos 1',
            }),

        // Documento (opcional al crear, se puede subir después)
        documento_url: Joi.string().uri().allow('', null),
        documento_nombre: Joi.string().max(255).allow('', null),

        // Información médica (opcional)
        medico_nombre: Joi.string().max(150).allow('', null),
        unidad_medica: Joi.string().max(200).allow('', null),
        diagnostico: Joi.string().max(1000).allow('', null),

        // Prórroga (opcional)
        incapacidad_origen_id: Joi.number().integer().positive().allow(null),
        es_prorroga: Joi.boolean().default(false),

        // Observaciones
        notas_internas: Joi.string().max(2000).allow('', null),
    }),
};

// ==================== LISTAR INCAPACIDADES ====================

const listar = {
    params: Joi.object({}),
    query: withPagination({
        profesional_id: Joi.number().integer().positive(),
        estado: Joi.string().valid(...Object.values(ESTADOS_INCAPACIDAD)),
        tipo_incapacidad: Joi.string().valid(...Object.values(TIPOS_INCAPACIDAD)),
        fecha_inicio: Joi.date().iso(),
        fecha_fin: Joi.date().iso(),
        es_prorroga: Joi.boolean(),
    }),
};

// ==================== LISTAR MIS INCAPACIDADES ====================

const listarMis = {
    params: Joi.object({}),
    query: withPagination({
        estado: Joi.string().valid(...Object.values(ESTADOS_INCAPACIDAD)),
        anio: Joi.number().integer().min(2000).max(2100),
    }),
};

// ==================== OBTENER POR ID ====================

const obtener = {
    params: Joi.object({
        id: Joi.number().integer().positive().required(),
    }),
    query: Joi.object({}),
};

// ==================== ACTUALIZAR INCAPACIDAD ====================

const actualizar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
        // Solo campos editables después de crear
        documento_url: Joi.string().uri().allow('', null),
        documento_nombre: Joi.string().max(255).allow('', null),
        medico_nombre: Joi.string().max(150).allow('', null),
        unidad_medica: Joi.string().max(200).allow('', null),
        diagnostico: Joi.string().max(1000).allow('', null),
        notas_internas: Joi.string().max(2000).allow('', null),
    }).min(1),
};

// ==================== FINALIZAR ANTICIPADAMENTE ====================

const finalizar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
        notas_internas: Joi.string().max(2000).allow('', null),
        fecha_fin_real: Joi.date().iso(), // Si termina antes de lo previsto
    }),
};

// ==================== CANCELAR ====================

const cancelar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required(),
    }),
    body: Joi.object({
        motivo_cancelacion: Joi.string().max(500).required()
            .messages({ 'any.required': 'El motivo de cancelación es obligatorio' }),
    }),
};

// ==================== CREAR PRÓRROGA ====================

const crearProrroga = {
    params: Joi.object({
        id: Joi.number().integer().positive().required(), // ID de incapacidad origen
    }),
    body: Joi.object({
        folio_imss: Joi.string().max(50).required()
            .messages({ 'any.required': 'El folio IMSS de la prórroga es obligatorio' }),

        fecha_inicio: Joi.date().iso().required(),
        fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).required(),
        dias_autorizados: Joi.number().integer().min(1).required(),

        // Documento
        documento_url: Joi.string().uri().allow('', null),
        documento_nombre: Joi.string().max(255).allow('', null),

        // Información médica
        medico_nombre: Joi.string().max(150).allow('', null),
        unidad_medica: Joi.string().max(200).allow('', null),
        diagnostico: Joi.string().max(1000).allow('', null),

        notas_internas: Joi.string().max(2000).allow('', null),
    }),
};

// ==================== ESTADÍSTICAS ====================

const estadisticas = {
    params: Joi.object({}),
    query: Joi.object({
        anio: Joi.number().integer().min(2000).max(2100),
        departamento_id: Joi.number().integer().positive(),
        tipo_incapacidad: Joi.string().valid(...Object.values(TIPOS_INCAPACIDAD)),
    }),
};

module.exports = {
    crear,
    listar,
    listarMis,
    obtener,
    actualizar,
    finalizar,
    cancelar,
    crearProrroga,
    estadisticas,
};
