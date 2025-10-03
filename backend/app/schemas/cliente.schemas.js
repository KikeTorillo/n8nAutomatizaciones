/**
 * Schemas de Validación Joi para Clientes
 * Valida todos los endpoints del módulo de clientes
 */

const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

/**
 * Límites y validaciones de clientes
 */
const LIMITES = {
    NOMBRE_MIN: 2,
    NOMBRE_MAX: 150,
    TELEFONO_MIN: 7,
    TELEFONO_MAX: 20,
    DIRECCION_MAX: 500,
    NOTAS_MAX: 1000,
    ALERGIAS_MAX: 1000,
    COMO_CONOCIO_MAX: 100,
    EDAD_MIN: 5,
    EDAD_MAX: 120
};

/**
 * Schema para crear cliente
 * POST /clientes
 */
const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin lo envía
        nombre: Joi.string()
            .min(LIMITES.NOMBRE_MIN)
            .max(LIMITES.NOMBRE_MAX)
            .required()
            .trim()
            .messages({
                'string.min': `Nombre debe tener al menos ${LIMITES.NOMBRE_MIN} caracteres`,
                'string.max': `Nombre no puede exceder ${LIMITES.NOMBRE_MAX} caracteres`,
                'any.required': 'Nombre es requerido'
            }),
        email: Joi.string()
            .email()
            .max(LIMITES.NOMBRE_MAX)
            .optional()
            .allow(null)
            .lowercase()
            .messages({
                'string.email': 'Email no válido'
            }),
        telefono: Joi.string()
            .pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/)
            .required()
            .messages({
                'string.pattern.base': 'Teléfono debe ser un número válido (7-20 dígitos, formato: +123 456-789)',
                'any.required': 'Teléfono es requerido'
            }),
        fecha_nacimiento: Joi.date()
            .iso()
            .max('now')
            .optional()
            .allow(null)
            .custom((value, helpers) => {
                if (value) {
                    const fecha = new Date(value);
                    const hoy = new Date();
                    const edad = hoy.getFullYear() - fecha.getFullYear();
                    if (edad < LIMITES.EDAD_MIN || edad > LIMITES.EDAD_MAX) {
                        return helpers.error('any.invalid');
                    }
                }
                return value;
            })
            .messages({
                'date.max': 'Fecha de nacimiento no puede ser en el futuro',
                'any.invalid': `Edad debe estar entre ${LIMITES.EDAD_MIN} y ${LIMITES.EDAD_MAX} años`
            }),
        direccion: Joi.string()
            .max(LIMITES.DIRECCION_MAX)
            .optional()
            .allow(null)
            .trim()
            .messages({
                'string.max': `Dirección no puede exceder ${LIMITES.DIRECCION_MAX} caracteres`
            }),
        notas_especiales: Joi.string()
            .max(LIMITES.NOTAS_MAX)
            .optional()
            .allow(null)
            .trim()
            .messages({
                'string.max': `Notas especiales no pueden exceder ${LIMITES.NOTAS_MAX} caracteres`
            }),
        alergias: Joi.string()
            .max(LIMITES.ALERGIAS_MAX)
            .optional()
            .allow(null)
            .trim()
            .messages({
                'string.max': `Alergias no pueden exceder ${LIMITES.ALERGIAS_MAX} caracteres`
            }),
        como_conocio: Joi.string()
            .max(LIMITES.COMO_CONOCIO_MAX)
            .optional()
            .allow(null)
            .trim()
            .messages({
                'string.max': `Cómo conoció no puede exceder ${LIMITES.COMO_CONOCIO_MAX} caracteres`
            }),
        marketing_permitido: Joi.boolean()
            .optional()
            .default(true),
        profesional_preferido_id: commonSchemas.id.optional(),
        activo: Joi.boolean()
            .optional()
            .default(true)
    })
};

/**
 * Schema para actualizar cliente
 * PUT /clientes/:id
 */
const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string()
            .min(LIMITES.NOMBRE_MIN)
            .max(LIMITES.NOMBRE_MAX)
            .trim(),
        email: Joi.string()
            .email()
            .max(LIMITES.NOMBRE_MAX)
            .lowercase()
            .allow(null),
        telefono: Joi.string()
            .pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/),
        fecha_nacimiento: Joi.date()
            .iso()
            .max('now')
            .allow(null)
            .custom((value, helpers) => {
                if (value) {
                    const fecha = new Date(value);
                    const hoy = new Date();
                    const edad = hoy.getFullYear() - fecha.getFullYear();
                    if (edad < LIMITES.EDAD_MIN || edad > LIMITES.EDAD_MAX) {
                        return helpers.error('any.invalid');
                    }
                }
                return value;
            }),
        direccion: Joi.string()
            .max(LIMITES.DIRECCION_MAX)
            .trim()
            .allow(null),
        notas_especiales: Joi.string()
            .max(LIMITES.NOTAS_MAX)
            .trim()
            .allow(null),
        alergias: Joi.string()
            .max(LIMITES.ALERGIAS_MAX)
            .trim()
            .allow(null),
        como_conocio: Joi.string()
            .max(LIMITES.COMO_CONOCIO_MAX)
            .trim()
            .allow(null),
        marketing_permitido: Joi.boolean(),
        profesional_preferido_id: commonSchemas.id.optional(),
        activo: Joi.boolean()
    }).min(1), // Al menos un campo debe estar presente
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para listar clientes
 * GET /clientes
 */
const listar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        activo: Joi.string()
            .valid('true', 'false')
            .optional(),
        marketing_permitido: Joi.string()
            .valid('true', 'false')
            .optional(),
        busqueda: Joi.string()
            .min(2)
            .max(100)
            .trim()
            .optional(),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(20),
        ordenPor: Joi.string()
            .valid('nombre', 'email', 'telefono', 'creado_en', 'actualizado_en')
            .default('nombre'),
        orden: Joi.string()
            .valid('ASC', 'DESC', 'asc', 'desc')
            .default('ASC')
    })
};

/**
 * Schema para obtener cliente por ID
 * GET /clientes/:id
 */
const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para buscar clientes
 * GET /clientes/buscar
 */
const buscar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        q: Joi.string()
            .min(2)
            .max(100)
            .required()
            .trim()
            .messages({
                'string.min': 'Query de búsqueda debe tener al menos 2 caracteres',
                'any.required': 'Query de búsqueda es requerido'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .default(10)
    })
};

/**
 * Schema para cambiar estado de cliente
 * PATCH /clientes/:id/estado
 */
const cambiarEstado = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        activo: Joi.boolean()
            .required()
            .messages({
                'any.required': 'Campo activo es requerido'
            })
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para eliminar cliente
 * DELETE /clientes/:id
 */
const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para obtener estadísticas
 * GET /clientes/estadisticas
 */
const obtenerEstadisticas = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

/**
 * Schema para buscar por teléfono (CRÍTICO PARA IA)
 * GET /clientes/buscar-telefono
 */
const buscarPorTelefono = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        telefono: Joi.string()
            .required()
            .trim()
            .messages({
                'any.required': 'Teléfono es requerido'
            }),
        exacto: Joi.boolean()
            .default(false),
        incluir_inactivos: Joi.boolean()
            .default(false),
        crear_si_no_existe: Joi.boolean()
            .default(false)
    })
};

/**
 * Schema para buscar por nombre (COMPLEMENTARIO PARA IA)
 * GET /clientes/buscar-nombre
 */
const buscarPorNombre = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
        nombre: Joi.string()
            .min(2)
            .required()
            .trim()
            .messages({
                'string.min': 'Nombre debe tener al menos 2 caracteres',
                'any.required': 'Nombre es requerido'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .default(10)
    })
};

module.exports = {
    crear,
    actualizar,
    listar,
    obtenerPorId,
    buscar,
    cambiarEstado,
    eliminar,
    obtenerEstadisticas,
    buscarPorTelefono,
    buscarPorNombre,
    LIMITES
};
