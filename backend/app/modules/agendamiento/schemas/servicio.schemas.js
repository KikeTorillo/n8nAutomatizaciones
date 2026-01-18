// Schemas de Validación Joi para Servicios

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { withPagination } = require('../../../schemas/shared');

// ========== Schemas CRUD Estándar ==========

const crear = {
    body: Joi.object({
        nombre: Joi.string().trim().min(1).max(100).required()
            .messages({
                'string.empty': 'Nombre es requerido',
                'string.max': 'Nombre no puede exceder 100 caracteres'
            }),
        descripcion: Joi.string().trim().max(1000).optional().allow(null, ''),
        categoria: Joi.string().trim().max(50).optional().allow(null, ''),
        subcategoria: Joi.string().trim().max(50).optional().allow(null, ''),
        duracion_minutos: Joi.number().integer().min(1).max(480).required()
            .messages({
                'number.base': 'Duración debe ser un número',
                'number.min': 'Duración debe ser entre 1 y 480 minutos',
                'number.max': 'Duración debe ser entre 1 y 480 minutos'
            }),
        precio: commonSchemas.price.required()
            .messages({'any.required': 'Precio es requerido'}),
        precio_minimo: commonSchemas.price.optional().allow(null),
        precio_maximo: commonSchemas.price.optional().allow(null)
            .custom((value, helpers) => {
                const precio = helpers.state.ancestors[0].precio;
                if (value && precio && value < precio) {
                    return helpers.error('custom.precio_maximo_menor');
                }
                return value;
            })
            .messages({'custom.precio_maximo_menor': 'precio_maximo debe ser mayor o igual al precio base'}),
        requiere_preparacion_minutos: Joi.number().integer().min(0).max(120).optional().default(0),
        tiempo_limpieza_minutos: Joi.number().integer().min(0).max(60).optional().default(5),
        max_clientes_simultaneos: Joi.number().integer().min(1).max(20).optional().default(1),
        color_servicio: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional()
            .messages({'string.pattern.base': 'Color debe ser hexadecimal válido (ej: #e74c3c)'}),
        tags: Joi.array().items(
            Joi.string().trim().min(1).max(30)
        ).optional().allow(null),
        configuracion_especifica: Joi.object().optional().allow(null),
        profesionales_ids: Joi.array().items(
            Joi.number().integer().positive() // Sin .required() para permitir array vacío
        ).optional().default([])
            .messages({
                'array.base': 'profesionales_ids debe ser un array de IDs'
            }),
        activo: Joi.boolean().optional().default(true),
        imagen_url: Joi.string().uri().max(500).optional().allow(null, ''),
        // Precios multi-moneda (Fase 4)
        precios_moneda: Joi.array().items(
            Joi.object({
                moneda: Joi.string().length(3).required(),
                precio: Joi.number().positive().required(),
                precio_minimo: Joi.number().positive().optional().allow(null),
                precio_maximo: Joi.number().positive().optional().allow(null)
            })
        ).optional()
    })
};

const listar = {
    query: withPagination({
        activo: Joi.boolean().optional(),
        categoria: Joi.string().trim().min(1).max(50).optional(),
        busqueda: Joi.string().trim().min(1).max(100).optional(),
        precio_min: commonSchemas.price.optional(),
        precio_max: commonSchemas.price.optional()
    })
};

const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().trim().min(1).max(100).optional(),
        descripcion: Joi.string().trim().max(1000).optional().allow(null, ''),
        categoria: Joi.string().trim().max(50).optional().allow(null, ''),
        subcategoria: Joi.string().trim().max(50).optional().allow(null, ''),
        duracion_minutos: Joi.number().integer().min(1).max(480).optional(),
        precio: commonSchemas.price.optional(),
        precio_minimo: commonSchemas.price.optional().allow(null),
        precio_maximo: commonSchemas.price.optional().allow(null),
        requiere_preparacion_minutos: Joi.number().integer().min(0).max(120).optional(),
        tiempo_limpieza_minutos: Joi.number().integer().min(0).max(60).optional(),
        max_clientes_simultaneos: Joi.number().integer().min(1).max(20).optional(),
        color_servicio: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
        tags: Joi.array().items(Joi.string().trim().min(1).max(30)).optional().allow(null),
        configuracion_especifica: Joi.object().optional().allow(null),
        activo: Joi.boolean().optional(),
        imagen_url: Joi.string().uri().max(500).optional().allow(null, ''),
        // Precios multi-moneda (Fase 4)
        precios_moneda: Joi.array().items(
            Joi.object({
                moneda: Joi.string().length(3).required(),
                precio: Joi.number().positive().required(),
                precio_minimo: Joi.number().positive().optional().allow(null),
                precio_maximo: Joi.number().positive().optional().allow(null)
            })
        ).optional()
    }).min(1)
};

const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

const eliminarPermanente = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// ========== Schemas de Búsqueda y Estadísticas ==========

const buscar = {
    query: Joi.object({
        termino: Joi.string().trim().min(1).max(100).required()
            .messages({'any.required': 'Término de búsqueda es requerido'}),
        limite: Joi.number().integer().min(1).max(50).default(10),
        solo_activos: Joi.boolean().default(true)
    })
};

const obtenerEstadisticas = {
    query: Joi.object({})
};

// ========== Schemas de Plantillas ==========

const crearDesdePlantilla = {
    body: Joi.object({
        plantilla_id: commonSchemas.id.required()
            .messages({'any.required': 'plantilla_id es requerido'}),
        configuracion_personalizada: Joi.object({
            nombre: Joi.string().trim().min(1).max(100).optional(),
            descripcion: Joi.string().trim().max(1000).optional(),
            categoria: Joi.string().trim().max(50).optional(),
            subcategoria: Joi.string().trim().max(50).optional(),
            precio: commonSchemas.price.optional(),
            precio_minimo: commonSchemas.price.optional(),
            precio_maximo: commonSchemas.price.optional(),
            duracion_minutos: Joi.number().integer().min(1).max(480).optional(),
            configuracion_especifica: Joi.object().optional(),
            tags: Joi.array().items(Joi.string().trim()).optional()
        }).optional().default({})
    })
};

// ========== Schemas Servicios-Profesionales ==========

const asignarProfesional = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        profesional_id: commonSchemas.id.required()
            .messages({'any.required': 'profesional_id es requerido'}),
        configuracion: Joi.object({
            precio_personalizado: commonSchemas.price.optional().allow(null),
            duracion_personalizada: Joi.number().integer().min(1).max(480).optional().allow(null),
            notas_especiales: Joi.string().trim().max(500).optional().allow(null, ''),
            activo: Joi.boolean().optional().default(true)
        }).optional().default({})
    })
};

const desasignarProfesional = {
    params: Joi.object({
        id: commonSchemas.id,
        profesional_id: commonSchemas.id
    })
};

const obtenerProfesionales = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        solo_activos: Joi.boolean().default(true)
    })
};

const obtenerServiciosPorProfesional = {
    params: Joi.object({
        profesional_id: commonSchemas.id
    }),
    query: Joi.object({
        solo_activos: Joi.boolean().default(true)
    })
};

// ========== Schemas Round-Robin (Ene 2026) ==========

/**
 * GET /api/v1/servicios/:id/profesionales/orden
 * Obtener profesionales con orden de rotación
 */
const obtenerProfesionalesConOrden = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

/**
 * PUT /api/v1/servicios/:id/profesionales/orden
 * Actualizar orden de rotación de profesionales
 */
const actualizarOrdenProfesionales = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        profesionales: Joi.array().items(
            Joi.object({
                profesional_id: commonSchemas.id.required(),
                orden_rotacion: Joi.number().integer().min(0).required()
            })
        ).min(1).required()
            .messages({
                'array.min': 'Debe incluir al menos un profesional',
                'any.required': 'El array de profesionales es requerido'
            })
    })
};

// POST /servicios/bulk-create
const bulkCrear = {
    body: Joi.object({
        servicios: Joi.array()
            .items(
                Joi.object({
                    nombre: Joi.string()
                        .trim()
                        .min(1)
                        .max(100)
                        .required()
                        .messages({
                            'string.empty': 'Nombre es requerido',
                            'string.max': 'Nombre no puede exceder 100 caracteres'
                        }),
                    descripcion: Joi.string()
                        .trim()
                        .max(1000)
                        .optional()
                        .allow(null, ''),
                    categoria: Joi.string()
                        .trim()
                        .max(50)
                        .optional()
                        .allow(null, ''),
                    subcategoria: Joi.string()
                        .trim()
                        .max(50)
                        .optional()
                        .allow(null, ''),
                    duracion_minutos: Joi.number()
                        .integer()
                        .min(1)
                        .max(480)
                        .required()
                        .messages({
                            'number.base': 'Duración debe ser un número',
                            'number.min': 'Duración debe ser entre 1 y 480 minutos',
                            'number.max': 'Duración debe ser entre 1 y 480 minutos'
                        }),
                    precio: commonSchemas.price
                        .required()
                        .messages({'any.required': 'Precio es requerido'}),
                    precio_minimo: commonSchemas.price
                        .optional()
                        .allow(null),
                    precio_maximo: commonSchemas.price
                        .optional()
                        .allow(null),
                    requiere_preparacion_minutos: Joi.number()
                        .integer()
                        .min(0)
                        .max(120)
                        .optional()
                        .default(0),
                    tiempo_limpieza_minutos: Joi.number()
                        .integer()
                        .min(0)
                        .max(60)
                        .optional()
                        .default(5),
                    max_clientes_simultaneos: Joi.number()
                        .integer()
                        .min(1)
                        .max(20)
                        .optional()
                        .default(1),
                    color_servicio: Joi.string()
                        .pattern(/^#[0-9A-Fa-f]{6}$/)
                        .optional()
                        .messages({'string.pattern.base': 'Color debe ser hexadecimal válido (ej: #e74c3c)'}),
                    tags: Joi.array()
                        .items(Joi.string().trim().min(1).max(30))
                        .optional()
                        .allow(null),
                    configuracion_especifica: Joi.object()
                        .optional()
                        .allow(null),
                    profesionales_asignados: Joi.array()
                        .items(Joi.number().integer().positive())
                        .optional()
                        .default([]),
                    activo: Joi.boolean()
                        .optional()
                        .default(true),
                    imagen_url: Joi.string()
                        .uri()
                        .max(500)
                        .optional()
                        .allow(null, '')
                })
            )
            .min(1)
            .max(50)
            .required()
            .messages({
                'array.min': 'Debe proporcionar al menos 1 servicio',
                'array.max': 'No se pueden crear más de 50 servicios a la vez'
            })
    })
};

module.exports = {
    // CRUD
    crear,
    bulkCrear,
    listar,
    obtenerPorId,
    actualizar,
    eliminar,
    eliminarPermanente,
    // Búsqueda y estadísticas
    buscar,
    obtenerEstadisticas,
    // Plantillas
    crearDesdePlantilla,
    // Relaciones profesionales
    asignarProfesional,
    desasignarProfesional,
    obtenerProfesionales,
    obtenerServiciosPorProfesional,
    // Round-Robin (Ene 2026)
    obtenerProfesionalesConOrden,
    actualizarOrdenProfesionales
};
