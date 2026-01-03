/**
 * Schemas de validación Joi para Onboarding de Empleados
 * Fase 5 del Plan de Empleados Competitivo
 * Enero 2026
 */
const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

// Constantes para onboarding
const RESPONSABLES_TAREA = ['empleado', 'supervisor', 'rrhh'];

const LIMITES = {
    NOMBRE_PLANTILLA_MIN: 3,
    NOMBRE_PLANTILLA_MAX: 100,
    TITULO_TAREA_MIN: 3,
    TITULO_TAREA_MAX: 150,
    DESCRIPCION_MAX: 1000,
    URL_MAX: 500,
    DURACION_DIAS_MIN: 1,
    DURACION_DIAS_MAX: 365,
    DIAS_LIMITE_MAX: 365
};

// =====================================================
// SCHEMAS PLANTILLAS
// =====================================================

// POST /onboarding-empleados/plantillas
const crearPlantilla = {
    body: Joi.object({
        nombre: Joi.string()
            .min(LIMITES.NOMBRE_PLANTILLA_MIN)
            .max(LIMITES.NOMBRE_PLANTILLA_MAX)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre debe tener al menos {#limit} caracteres',
                'string.max': 'El nombre no puede exceder {#limit} caracteres',
                'any.required': 'El nombre de la plantilla es requerido'
            }),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .optional()
            .allow(null, '')
            .trim(),
        departamento_id: commonSchemas.id
            .optional()
            .allow(null),
        puesto_id: commonSchemas.id
            .optional()
            .allow(null),
        duracion_dias: Joi.number()
            .integer()
            .min(LIMITES.DURACION_DIAS_MIN)
            .max(LIMITES.DURACION_DIAS_MAX)
            .default(30)
            .messages({
                'number.min': 'La duración mínima es de {#limit} día',
                'number.max': 'La duración máxima es de {#limit} días'
            }),
        activo: Joi.boolean()
            .default(true)
    })
};

// PUT /onboarding-empleados/plantillas/:id
const actualizarPlantilla = {
    params: Joi.object({
        id: commonSchemas.id.required()
    }),
    body: Joi.object({
        nombre: Joi.string()
            .min(LIMITES.NOMBRE_PLANTILLA_MIN)
            .max(LIMITES.NOMBRE_PLANTILLA_MAX)
            .optional()
            .trim(),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .optional()
            .allow(null, '')
            .trim(),
        departamento_id: commonSchemas.id
            .optional()
            .allow(null),
        puesto_id: commonSchemas.id
            .optional()
            .allow(null),
        duracion_dias: Joi.number()
            .integer()
            .min(LIMITES.DURACION_DIAS_MIN)
            .max(LIMITES.DURACION_DIAS_MAX)
            .optional(),
        activo: Joi.boolean()
            .optional()
    }).min(1).messages({
        'object.min': 'Debe proporcionar al menos un campo para actualizar'
    })
};

// GET /onboarding-empleados/plantillas
const listarPlantillas = {
    query: Joi.object({
        departamento_id: commonSchemas.id.optional(),
        puesto_id: commonSchemas.id.optional(),
        activo: Joi.boolean().optional(),
        limite: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// GET /onboarding-empleados/plantillas/:id
const obtenerPlantilla = {
    params: Joi.object({
        id: commonSchemas.id.required()
    })
};

// DELETE /onboarding-empleados/plantillas/:id
const eliminarPlantilla = {
    params: Joi.object({
        id: commonSchemas.id.required()
    })
};

// GET /onboarding-empleados/plantillas/sugeridas/:profesionalId
const plantillasSugeridas = {
    params: Joi.object({
        profesionalId: commonSchemas.id.required()
    })
};

// =====================================================
// SCHEMAS TAREAS
// =====================================================

// POST /onboarding-empleados/plantillas/:id/tareas
const crearTarea = {
    params: Joi.object({
        id: commonSchemas.id.required()
    }),
    body: Joi.object({
        titulo: Joi.string()
            .min(LIMITES.TITULO_TAREA_MIN)
            .max(LIMITES.TITULO_TAREA_MAX)
            .required()
            .trim()
            .messages({
                'string.min': 'El título debe tener al menos {#limit} caracteres',
                'string.max': 'El título no puede exceder {#limit} caracteres',
                'any.required': 'El título de la tarea es requerido'
            }),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .optional()
            .allow(null, '')
            .trim(),
        responsable_tipo: Joi.string()
            .valid(...RESPONSABLES_TAREA)
            .default('empleado')
            .messages({
                'any.only': 'El tipo de responsable debe ser: empleado, supervisor o rrhh'
            }),
        dias_limite: Joi.number()
            .integer()
            .min(0)
            .max(LIMITES.DIAS_LIMITE_MAX)
            .optional()
            .allow(null)
            .messages({
                'number.max': 'El límite de días no puede exceder {#limit}'
            }),
        orden: Joi.number()
            .integer()
            .min(0)
            .optional(),
        es_obligatoria: Joi.boolean()
            .default(true),
        url_recurso: Joi.string()
            .uri()
            .max(LIMITES.URL_MAX)
            .optional()
            .allow(null, '')
            .messages({
                'string.uri': 'La URL del recurso debe ser una URL válida'
            })
    })
};

// PUT /onboarding-empleados/tareas/:tareaId
const actualizarTarea = {
    params: Joi.object({
        tareaId: commonSchemas.id.required()
    }),
    body: Joi.object({
        titulo: Joi.string()
            .min(LIMITES.TITULO_TAREA_MIN)
            .max(LIMITES.TITULO_TAREA_MAX)
            .optional()
            .trim(),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .optional()
            .allow(null, '')
            .trim(),
        responsable_tipo: Joi.string()
            .valid(...RESPONSABLES_TAREA)
            .optional(),
        dias_limite: Joi.number()
            .integer()
            .min(0)
            .max(LIMITES.DIAS_LIMITE_MAX)
            .optional()
            .allow(null),
        orden: Joi.number()
            .integer()
            .min(0)
            .optional(),
        es_obligatoria: Joi.boolean()
            .optional(),
        url_recurso: Joi.string()
            .uri()
            .max(LIMITES.URL_MAX)
            .optional()
            .allow(null, '')
    }).min(1).messages({
        'object.min': 'Debe proporcionar al menos un campo para actualizar'
    })
};

// DELETE /onboarding-empleados/tareas/:tareaId
const eliminarTarea = {
    params: Joi.object({
        tareaId: commonSchemas.id.required()
    })
};

// PATCH /onboarding-empleados/plantillas/:id/tareas/reordenar
const reordenarTareas = {
    params: Joi.object({
        id: commonSchemas.id.required()
    }),
    body: Joi.object({
        items: Joi.array()
            .items(Joi.object({
                id: commonSchemas.id.required(),
                orden: Joi.number().integer().min(0).required()
            }))
            .min(1)
            .required()
            .messages({
                'array.min': 'Debe proporcionar al menos un elemento para reordenar'
            })
    })
};

// =====================================================
// SCHEMAS PROGRESO
// =====================================================

// POST /profesionales/:profId/onboarding/aplicar
const aplicarPlantilla = {
    params: Joi.object({
        id: commonSchemas.id.required()
    }),
    body: Joi.object({
        plantilla_id: commonSchemas.id.required()
            .messages({
                'any.required': 'Debe especificar la plantilla a aplicar'
            })
    })
};

// GET /profesionales/:id/onboarding/progreso
const obtenerProgreso = {
    params: Joi.object({
        id: commonSchemas.id.required()
    }),
    query: Joi.object({
        solo_pendientes: Joi.boolean().default(false)
    })
};

// PATCH /profesionales/:id/onboarding/progreso/:tareaId
const marcarTarea = {
    params: Joi.object({
        id: commonSchemas.id.required(),
        tareaId: commonSchemas.id.required()
    }),
    body: Joi.object({
        completado: Joi.boolean()
            .default(true),
        notas: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .optional()
            .allow(null, '')
            .trim()
    })
};

// DELETE /profesionales/:id/onboarding
const eliminarProgreso = {
    params: Joi.object({
        id: commonSchemas.id.required()
    })
};

// =====================================================
// SCHEMAS DASHBOARD
// =====================================================

// GET /onboarding-empleados/dashboard
const obtenerDashboard = {
    query: Joi.object({
        departamento_id: commonSchemas.id.optional(),
        estado_empleado: Joi.string()
            .valid('activo', 'periodo_prueba', 'incapacidad', 'vacaciones', 'baja', 'suspendido')
            .optional(),
        limite: Joi.number().integer().min(1).max(100).default(50),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// GET /onboarding-empleados/vencidas
const obtenerTareasVencidas = {
    query: Joi.object({
        solo_obligatorias: Joi.boolean().default(false),
        limite: Joi.number().integer().min(1).max(200).default(100),
        offset: Joi.number().integer().min(0).default(0)
    })
};

module.exports = {
    // Plantillas
    crearPlantilla,
    actualizarPlantilla,
    listarPlantillas,
    obtenerPlantilla,
    eliminarPlantilla,
    plantillasSugeridas,

    // Tareas
    crearTarea,
    actualizarTarea,
    eliminarTarea,
    reordenarTareas,

    // Progreso
    aplicarPlantilla,
    obtenerProgreso,
    marcarTarea,
    eliminarProgreso,

    // Dashboard
    obtenerDashboard,
    obtenerTareasVencidas,

    // Constantes exportadas
    RESPONSABLES_TAREA,
    LIMITES
};
