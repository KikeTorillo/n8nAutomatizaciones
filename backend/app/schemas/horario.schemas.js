const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        profesional_id: commonSchemas.id,
        servicio_id: commonSchemas.id.optional().allow(null),
        tipo_horario: Joi.string()
            .valid('regular', 'excepcion', 'bloqueo', 'franja_especifica')
            .default('franja_especifica'),
        fecha: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .required()
            .messages({ 'string.pattern.base': 'La fecha debe estar en formato YYYY-MM-DD' }),
        hora_inicio: commonSchemas.time.required(),
        hora_fin: commonSchemas.time.required()
            .custom((value, helpers) => {
                const hora_inicio = helpers.state.ancestors[0].hora_inicio;
                if (hora_inicio && value <= hora_inicio) {
                    return helpers.error('custom.hora_fin_posterior');
                }
                return value;
            })
            .messages({ 'custom.hora_fin_posterior': 'hora_fin debe ser posterior a hora_inicio' }),
        duracion_slot: Joi.number().integer().min(5).max(240).default(15),
        dia_semana: Joi.number().integer().min(0).max(6).optional().allow(null),
        es_recurrente: Joi.boolean().default(false),
        fecha_fin_recurrencia: Joi.string()
            .pattern(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .allow(null),
        precio_base: commonSchemas.price.optional().allow(null),
        es_horario_premium: Joi.boolean().default(false),
        zona_horaria: Joi.string().max(50).default('America/Mexico_City'),
        capacidad_maxima: Joi.number().integer().min(1).max(50).default(1)
    })
};

const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        tipo_horario: Joi.string().valid('regular', 'excepcion', 'bloqueo', 'franja_especifica'),
        fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/),
        hora_inicio: commonSchemas.time,
        hora_fin: commonSchemas.time,
        zona_horaria: Joi.string().max(50),
        dia_semana: Joi.number().integer().min(0).max(6).allow(null),
        es_recurrente: Joi.boolean(),
        fecha_fin_recurrencia: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).allow(null),
        estado: Joi.string().valid('disponible', 'ocupado', 'reservado_temporal', 'bloqueado'),
        duracion_slot: Joi.number().integer().min(5).max(240),
        capacidad_maxima: Joi.number().integer().min(1).max(50),
        precio_base: commonSchemas.price.allow(null),
        precio_dinamico: commonSchemas.price.allow(null),
        es_horario_premium: Joi.boolean(),
        descuento_porcentaje: Joi.number().min(0).max(100)
    }).min(1)
        .custom((value, helpers) => {
            if (value.hora_inicio && value.hora_fin && value.hora_fin <= value.hora_inicio) {
                return helpers.error('custom.hora_fin_posterior');
            }
            return value;
        })
        .messages({ 'custom.hora_fin_posterior': 'hora_fin debe ser posterior a hora_inicio' }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

const obtener = {
    params: Joi.object({
        id: commonSchemas.id.optional()
    }).optional(),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        id: commonSchemas.id.optional(),
        profesional_id: commonSchemas.id.optional(),
        fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        estado: Joi.string().valid('disponible', 'ocupado', 'reservado_temporal', 'bloqueado').optional(),
        limite: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

const consultarDisponibilidad = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.required(),
        profesional_id: commonSchemas.id.optional(),
        servicio_id: commonSchemas.id.optional(),
        fecha_inicio: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        fecha_fin: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        dias_semana: Joi.string()
            .pattern(/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(,(lunes|martes|miercoles|jueves|viernes|sabado|domingo))*$/)
            .optional()
            .messages({ 'string.pattern.base': 'dias_semana debe ser una lista separada por comas: lunes,martes,miercoles...' }),
        hora_inicio: commonSchemas.time.optional(),
        hora_fin: commonSchemas.time.optional(),
        duracion_servicio: Joi.number().integer().min(5).max(480).default(30),
        limite: Joi.number().integer().min(1).max(100).default(50)
    })
};

const consultarDisponibilidadInteligente = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.required(),
        fecha_texto: Joi.string()
            .max(100)
            .optional()
            .messages({ 'string.max': 'fecha_texto no puede exceder 100 caracteres' }),
        turno: Joi.string()
            .valid('mañana', 'tarde', 'noche')
            .optional(),
        servicio: Joi.alternatives().try(
            commonSchemas.id,
            Joi.string().max(100)
        ).optional(),
        profesional_preferido: Joi.alternatives().try(
            commonSchemas.id,
            Joi.string().max(100)
        ).optional()
    })
};

const reservarTemporal = {
    body: Joi.object({
        horario_id: commonSchemas.id.required(),
        organizacion_id: commonSchemas.id.required(),
        duracion_minutos: Joi.number().integer().min(5).max(60).default(15),
        motivo_reserva: Joi.string().max(200).default('Reserva IA')
    })
};

const liberarReservaTemporal = {
    body: Joi.object({
        horario_id: commonSchemas.id.required(),
        organizacion_id: commonSchemas.id.required()
    })
};

const limpiarReservasExpiradas = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.required()
    })
};

module.exports = {
    crear,
    actualizar,
    obtener,
    eliminar,
    consultarDisponibilidad,
    consultarDisponibilidadInteligente,
    reservarTemporal,
    liberarReservaTemporal,
    limpiarReservasExpiradas
};
