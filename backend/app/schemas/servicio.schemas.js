// Schemas de Validación Joi para Servicios

const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

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
        tipos_profesional_autorizados: Joi.array().optional().allow(null),
        profesionales_ids: Joi.array().items(
            Joi.number().integer().positive() // Sin .required() para permitir array vacío
        ).optional().default([])
            .messages({
                'array.base': 'profesionales_ids debe ser un array de IDs'
            }),
        activo: Joi.boolean().optional().default(true)
    })
};

const listar = {
    query: Joi.object({
        pagina: Joi.number().integer().min(1).default(1),
        limite: Joi.number().integer().min(1).max(100).default(20),
        orden: Joi.string().valid('nombre', 'categoria', 'precio', 'duracion_minutos', 'creado_en').default('nombre'),
        direccion: Joi.string().valid('ASC', 'DESC').default('ASC'),
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
        tipos_profesional_autorizados: Joi.array().optional().allow(null),
        activo: Joi.boolean().optional()
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
            tags: Joi.array().items(Joi.string().trim()).optional(),
            tipos_profesional_autorizados: Joi.array().optional()
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

module.exports = {
    // CRUD
    crear,
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
    obtenerServiciosPorProfesional
};
