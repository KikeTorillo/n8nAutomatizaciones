/**
 * ====================================================================
 * SCHEMAS - WORKFLOWS
 * ====================================================================
 *
 * Esquemas de validación Joi para el módulo de workflows de aprobación.
 */

const Joi = require('joi');

// ===================================================================
// SCHEMAS DE CONSULTA
// ===================================================================

/**
 * Listar aprobaciones pendientes
 */
const listarPendientes = {
    query: Joi.object({
        entidad_tipo: Joi.string()
            .valid('orden_compra', 'venta_pos')
            .optional(),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(20),
        offset: Joi.number()
            .integer()
            .min(0)
            .default(0)
    })
};

/**
 * Listar historial de aprobaciones
 */
const listarHistorial = {
    query: Joi.object({
        entidad_tipo: Joi.string()
            .valid('orden_compra', 'venta_pos')
            .optional(),
        estado: Joi.string()
            .valid('aprobado', 'rechazado', 'cancelado', 'expirado')
            .optional(),
        fecha_desde: Joi.date().iso().optional(),
        fecha_hasta: Joi.date().iso().optional(),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(50),
        offset: Joi.number()
            .integer()
            .min(0)
            .default(0)
    })
};

// ===================================================================
// SCHEMAS DE ACCIONES
// ===================================================================

/**
 * Obtener instancia por ID
 */
const obtenerPorId = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

/**
 * Aprobar instancia de workflow
 */
const aprobar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        comentario: Joi.string()
            .max(500)
            .allow('', null)
            .optional()
    })
};

/**
 * Rechazar instancia de workflow
 */
const rechazar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        motivo: Joi.string()
            .min(10)
            .max(500)
            .required()
            .messages({
                'string.min': 'El motivo debe tener al menos 10 caracteres',
                'string.max': 'El motivo no puede exceder 500 caracteres',
                'any.required': 'El motivo de rechazo es requerido'
            })
    })
};

// ===================================================================
// SCHEMAS DE DELEGACIONES
// ===================================================================

/**
 * Crear delegación
 */
const crearDelegacion = {
    body: Joi.object({
        usuario_delegado_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'any.required': 'Debes seleccionar un usuario delegado'
            }),
        workflow_id: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .optional(),
        fecha_inicio: Joi.date()
            .iso()
            .required()
            .messages({
                'any.required': 'La fecha de inicio es requerida'
            }),
        fecha_fin: Joi.date()
            .iso()
            .greater(Joi.ref('fecha_inicio'))
            .required()
            .messages({
                'any.required': 'La fecha de fin es requerida',
                'date.greater': 'La fecha de fin debe ser posterior a la fecha de inicio'
            }),
        motivo: Joi.string()
            .max(500)
            .allow('', null)
            .optional()
    })
};

/**
 * Actualizar delegación
 */
const actualizarDelegacion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        fecha_fin: Joi.date()
            .iso()
            .optional(),
        activo: Joi.boolean()
            .optional(),
        motivo: Joi.string()
            .max(500)
            .allow('', null)
            .optional()
    }).min(1)
};

/**
 * Eliminar delegación
 */
const eliminarDelegacion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

/**
 * Listar delegaciones
 */
const listarDelegaciones = {
    query: Joi.object({
        activas: Joi.boolean()
            .optional(),
        como_delegado: Joi.boolean()
            .optional()
    })
};

// ===================================================================
// SCHEMAS DE DEFINICIONES (ADMIN)
// ===================================================================

/**
 * Listar definiciones de workflows
 */
const listarDefiniciones = {
    query: Joi.object({
        entidad_tipo: Joi.string()
            .valid('orden_compra', 'venta_pos')
            .optional(),
        activo: Joi.boolean()
            .optional()
    })
};

/**
 * Obtener definición por ID
 */
const obtenerDefinicion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = {
    // Consultas
    listarPendientes,
    listarHistorial,
    obtenerPorId,

    // Acciones
    aprobar,
    rechazar,

    // Delegaciones
    crearDelegacion,
    actualizarDelegacion,
    eliminarDelegacion,
    listarDelegaciones,

    // Definiciones
    listarDefiniciones,
    obtenerDefinicion
};
