/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - ACTIVIDADES CLIENTE
 * ====================================================================
 *
 * Fase 4A - Timeline de Actividad (Ene 2026)
 * Schemas Joi para validación de endpoints de actividades
 *
 * ====================================================================
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { withPagination } = require('../../../schemas/shared');

// ====================================================================
// CONSTANTES
// ====================================================================

const TIPOS_ACTIVIDAD = ['nota', 'llamada', 'email', 'tarea', 'sistema'];
const ESTADOS_ACTIVIDAD = ['pendiente', 'completada', 'cancelada'];
const PRIORIDADES = ['baja', 'normal', 'alta', 'urgente'];
const FUENTES = ['manual', 'cita', 'venta', 'chatbot', 'recordatorio', 'sistema'];
const REFERENCIAS_TIPO = ['cita', 'venta_pos', 'oportunidad', 'recordatorio'];

const LIMITES = {
    TITULO_MIN: 2,
    TITULO_MAX: 200,
    DESCRIPCION_MAX: 5000
};

// ====================================================================
// CREAR ACTIVIDAD
// ====================================================================

const crear = {
    params: Joi.object({
        clienteId: commonSchemas.id
    }),
    body: Joi.object({
        tipo: Joi.string()
            .valid(...TIPOS_ACTIVIDAD)
            .required()
            .messages({
                'any.only': `Tipo debe ser uno de: ${TIPOS_ACTIVIDAD.join(', ')}`,
                'any.required': 'Tipo es requerido'
            }),
        fuente: Joi.string()
            .valid(...FUENTES)
            .default('manual'),
        referencia_tipo: Joi.string()
            .valid(...REFERENCIAS_TIPO)
            .allow(null),
        referencia_id: Joi.number()
            .integer()
            .positive()
            .allow(null),
        titulo: Joi.string()
            .min(LIMITES.TITULO_MIN)
            .max(LIMITES.TITULO_MAX)
            .required()
            .trim()
            .messages({
                'string.min': `Título debe tener al menos ${LIMITES.TITULO_MIN} caracteres`,
                'string.max': `Título no puede exceder ${LIMITES.TITULO_MAX} caracteres`,
                'any.required': 'Título es requerido'
            }),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .trim()
            .allow(null, '')
            .messages({
                'string.max': `Descripción no puede exceder ${LIMITES.DESCRIPCION_MAX} caracteres`
            }),
        // Campos para tareas
        estado: Joi.string()
            .valid(...ESTADOS_ACTIVIDAD)
            .default('pendiente')
            .when('tipo', {
                is: 'tarea',
                then: Joi.string().default('pendiente'),
                otherwise: Joi.string().default('completada')
            }),
        fecha_vencimiento: Joi.date()
            .iso()
            .allow(null)
            .when('tipo', {
                is: 'tarea',
                then: Joi.date().iso().allow(null),
                otherwise: Joi.forbidden()
            }),
        prioridad: Joi.string()
            .valid(...PRIORIDADES)
            .default('normal'),
        asignado_a: Joi.number()
            .integer()
            .positive()
            .allow(null)
    })
};

// ====================================================================
// LISTAR ACTIVIDADES
// ====================================================================

const listar = {
    params: Joi.object({
        clienteId: commonSchemas.id
    }),
    query: withPagination({
        tipo: Joi.string().valid(...TIPOS_ACTIVIDAD),
        estado: Joi.string().valid(...ESTADOS_ACTIVIDAD),
        soloTareas: Joi.string().valid('true', 'false')
    })
};

// ====================================================================
// TIMELINE
// ====================================================================

const timeline = {
    params: Joi.object({
        clienteId: commonSchemas.id
    }),
    query: withPagination({})
};

// ====================================================================
// OBTENER/ELIMINAR POR ID
// ====================================================================

const obtenerPorId = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        actividadId: commonSchemas.id
    })
};

const eliminar = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        actividadId: commonSchemas.id
    })
};

// ====================================================================
// ACTUALIZAR ACTIVIDAD
// ====================================================================

const actualizar = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        actividadId: commonSchemas.id
    }),
    body: Joi.object({
        titulo: Joi.string()
            .min(LIMITES.TITULO_MIN)
            .max(LIMITES.TITULO_MAX)
            .trim()
            .messages({
                'string.min': `Título debe tener al menos ${LIMITES.TITULO_MIN} caracteres`,
                'string.max': `Título no puede exceder ${LIMITES.TITULO_MAX} caracteres`
            }),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .trim()
            .allow(null, ''),
        estado: Joi.string()
            .valid(...ESTADOS_ACTIVIDAD),
        fecha_vencimiento: Joi.date()
            .iso()
            .allow(null),
        prioridad: Joi.string()
            .valid(...PRIORIDADES),
        asignado_a: Joi.number()
            .integer()
            .positive()
            .allow(null)
    }).min(1) // Al menos un campo
};

// ====================================================================
// MARCAR COMPLETADA
// ====================================================================

const marcarCompletada = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        actividadId: commonSchemas.id
    })
};

// ====================================================================
// CONTEO
// ====================================================================

const conteo = {
    params: Joi.object({
        clienteId: commonSchemas.id
    })
};

// ====================================================================
// MIS TAREAS
// ====================================================================

const misTareas = {
    query: Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(50)
    })
};

// ====================================================================
// EXPORTS
// ====================================================================

module.exports = {
    crear,
    listar,
    timeline,
    obtenerPorId,
    actualizar,
    eliminar,
    marcarCompletada,
    conteo,
    misTareas,
    // Constantes exportadas
    TIPOS_ACTIVIDAD,
    ESTADOS_ACTIVIDAD,
    PRIORIDADES,
    FUENTES,
    LIMITES
};
