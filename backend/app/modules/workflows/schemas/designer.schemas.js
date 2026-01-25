/**
 * ====================================================================
 * SCHEMAS - WORKFLOW DESIGNER
 * ====================================================================
 *
 * Esquemas de validación Joi para el diseñador visual de workflows.
 * CRUD completo de definiciones con pasos y transiciones.
 */

const Joi = require('joi');

// ===================================================================
// TIPOS DE ENTIDAD SOPORTADAS
// ===================================================================
const ENTIDADES_VALIDAS = [
    'orden_compra',
    'venta_pos',
    'descuento_pos',
    'cita',
    'gasto',
    'requisicion'
];

// ===================================================================
// SCHEMAS AUXILIARES
// ===================================================================

/**
 * Schema para configuración de supervisor
 */
const supervisorConfigSchema = Joi.object({
    nivel: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .default(1)
        .messages({
            'number.min': 'El nivel mínimo es 1 (supervisor directo)',
            'number.max': 'El nivel máximo es 5'
        }),
    cualquier_nivel: Joi.boolean()
        .default(false),
    permitir_auto_aprobacion: Joi.boolean()
        .default(false),
    fallback_rol: Joi.string()
        .valid('admin')
        .allow(null)
        .optional()
});

/**
 * Schema para configuración de nodo de aprobación
 */
const configAprobacionSchema = Joi.object({
    aprobadores_tipo: Joi.string()
        .valid('rol', 'usuario', 'permiso', 'supervisor')
        .required(),
    aprobadores: Joi.array()
        .items(Joi.alternatives().try(
            Joi.string(),  // rol o permiso
            Joi.number().integer().positive()  // usuario_id
        ))
        .when('aprobadores_tipo', {
            is: 'supervisor',
            then: Joi.optional(),  // No requerido para supervisor
            otherwise: Joi.array().min(1).required()
        }),
    supervisor_config: supervisorConfigSchema
        .when('aprobadores_tipo', {
            is: 'supervisor',
            then: Joi.required(),
            otherwise: Joi.forbidden()
        }),
    timeout_horas: Joi.number()
        .integer()
        .min(1)
        .max(720)  // max 30 días
        .optional(),
    accion_timeout: Joi.string()
        .valid('escalar', 'rechazar', 'aprobar_auto')
        .allow(null)
        .optional()
});

/**
 * Schema para configuración de nodo de condición
 */
const configCondicionSchema = Joi.object({
    campo: Joi.string().required(),
    operador: Joi.string()
        .valid('>', '>=', '<', '<=', '=', '!=', 'in', 'not_in', 'contains')
        .required(),
    valor: Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.array()
    ).optional(),
    valor_ref: Joi.string().optional()  // Referencia a campo del usuario/org
}).or('valor', 'valor_ref');

/**
 * Schema para configuración de nodo de acción
 */
const configAccionSchema = Joi.object({
    tipo_accion: Joi.string()
        .valid('cambiar_estado', 'notificar', 'webhook', 'asignar')
        .required(),
    estado_nuevo: Joi.string().when('tipo_accion', {
        is: 'cambiar_estado',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    destinatarios: Joi.array().items(Joi.string()).when('tipo_accion', {
        is: 'notificar',
        then: Joi.optional(),
        otherwise: Joi.optional()
    }),
    webhook_url: Joi.string().uri().when('tipo_accion', {
        is: 'webhook',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

/**
 * Schema para un paso del workflow
 */
const pasoSchema = Joi.object({
    id: Joi.string().optional(),  // ID temporal del frontend
    codigo: Joi.string()
        .pattern(/^[a-z0-9_]+$/)
        .max(100)
        .required()
        .messages({
            'string.pattern.base': 'El código del paso solo puede contener letras minúsculas, números y guiones bajos'
        }),
    nombre: Joi.string()
        .max(100)
        .required(),
    descripcion: Joi.string()
        .max(500)
        .allow('', null)
        .optional(),
    tipo: Joi.string()
        .valid('inicio', 'aprobacion', 'condicion', 'accion', 'fin')
        .required(),
    config: Joi.when('tipo', {
        switch: [
            { is: 'aprobacion', then: configAprobacionSchema },
            { is: 'condicion', then: configCondicionSchema },
            { is: 'accion', then: configAccionSchema },
            { is: 'inicio', then: Joi.object().optional() },
            { is: 'fin', then: Joi.object().optional() }
        ]
    }),
    orden: Joi.number().integer().min(0).required(),
    // Posición visual en el canvas (React Flow)
    posicion_x: Joi.number().optional(),
    posicion_y: Joi.number().optional()
});

/**
 * Schema para una transición entre pasos
 */
const transicionSchema = Joi.object({
    paso_origen_codigo: Joi.string().required(),  // Referencia por código
    paso_destino_codigo: Joi.string().required(),
    etiqueta: Joi.string()
        .valid('siguiente', 'aprobar', 'rechazar', 'si', 'no', 'timeout')
        .required(),
    condicion: Joi.object({
        decision: Joi.string().valid('aprobar', 'rechazar').optional(),
        resultado: Joi.boolean().optional()
    }).allow(null).optional(),
    orden: Joi.number().integer().min(0).required()
});

/**
 * Schema para condición de activación del workflow
 */
const condicionActivacionSchema = Joi.object({
    campo: Joi.string().required(),
    operador: Joi.string()
        .valid('>', '>=', '<', '<=', '=', '!=', 'existe', 'no_existe')
        .required(),
    valor: Joi.alternatives().try(
        Joi.string(),
        Joi.number()
    ).optional(),
    valor_ref: Joi.string().optional()
}).or('valor', 'valor_ref');

// ===================================================================
// SCHEMAS PRINCIPALES
// ===================================================================

/**
 * Crear definición de workflow
 */
const crearDefinicion = {
    body: Joi.object({
        codigo: Joi.string()
            .pattern(/^[a-z0-9_]+$/)
            .max(50)
            .required()
            .messages({
                'string.pattern.base': 'El código solo puede contener letras minúsculas, números y guiones bajos',
                'any.required': 'El código es requerido'
            }),
        nombre: Joi.string()
            .max(100)
            .required()
            .messages({
                'any.required': 'El nombre es requerido'
            }),
        descripcion: Joi.string()
            .max(500)
            .allow('', null)
            .optional(),
        entidad_tipo: Joi.string()
            .valid(...ENTIDADES_VALIDAS)
            .required()
            .messages({
                'any.only': `Tipo de entidad inválido. Valores válidos: ${ENTIDADES_VALIDAS.join(', ')}`
            }),
        condicion_activacion: condicionActivacionSchema.allow(null).optional(),
        prioridad: Joi.number()
            .integer()
            .min(0)
            .max(100)
            .default(0),
        activo: Joi.boolean().default(false),  // Empieza como borrador
        pasos: Joi.array()
            .items(pasoSchema)
            .min(2)  // Al menos inicio y fin
            .required()
            .messages({
                'array.min': 'El workflow debe tener al menos 2 pasos (inicio y fin)'
            }),
        transiciones: Joi.array()
            .items(transicionSchema)
            .min(1)
            .required()
            .messages({
                'array.min': 'El workflow debe tener al menos 1 transición'
            })
    })
};

/**
 * Actualizar definición de workflow
 */
const actualizarDefinicion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        nombre: Joi.string()
            .max(100)
            .optional(),
        descripcion: Joi.string()
            .max(500)
            .allow('', null)
            .optional(),
        condicion_activacion: condicionActivacionSchema.allow(null).optional(),
        prioridad: Joi.number()
            .integer()
            .min(0)
            .max(100)
            .optional(),
        pasos: Joi.array()
            .items(pasoSchema)
            .min(2)
            .optional(),
        transiciones: Joi.array()
            .items(transicionSchema)
            .min(1)
            .optional()
    }).min(1)
};

/**
 * Eliminar definición de workflow
 */
const eliminarDefinicion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

/**
 * Duplicar workflow
 */
const duplicarDefinicion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        nuevo_codigo: Joi.string()
            .pattern(/^[a-z0-9_]+$/)
            .max(50)
            .optional(),
        nuevo_nombre: Joi.string()
            .max(100)
            .optional()
    })
};

/**
 * Publicar/Despublicar workflow
 */
const cambiarEstadoPublicacion = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        activo: Joi.boolean().required()
    })
};

/**
 * Validar workflow (solo validación, no guarda)
 */
const validarWorkflow = {
    body: Joi.object({
        pasos: Joi.array()
            .items(pasoSchema)
            .min(2)
            .required(),
        transiciones: Joi.array()
            .items(transicionSchema)
            .min(1)
            .required()
    })
};

module.exports = {
    crearDefinicion,
    actualizarDefinicion,
    eliminarDefinicion,
    duplicarDefinicion,
    cambiarEstadoPublicacion,
    validarWorkflow,
    // Exportar constantes útiles
    ENTIDADES_VALIDAS
};
