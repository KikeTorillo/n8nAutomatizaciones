/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - CLIENTES (MÓDULO CORE)
 * ====================================================================
 *
 * Schemas Joi para validación de endpoints de Clientes.
 * Ubicado en schemas/ centralizado (patrón Odoo/Salesforce).
 *
 * Migrado desde modules/agendamiento/schemas (Nov 2025)
 * ====================================================================
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

const LIMITES = {
    NOMBRE_MIN: 2,
    NOMBRE_MAX: 150,
    TELEFONO_MIN: 7,
    TELEFONO_MAX: 20,
    NOTAS_MAX: 1000,
    ALERGIAS_MAX: 1000,
    COMO_CONOCIO_MAX: 100,
    EDAD_MIN: 5,
    EDAD_MAX: 120,
    // Nuevos límites - Dirección estructurada (Ene 2026)
    CALLE_MAX: 200,
    COLONIA_MAX: 100,
    CIUDAD_MAX: 100,
    CP_MAX: 10,
    RFC_MAX: 13,
    RAZON_SOCIAL_MAX: 200
};

// Patrón RFC mexicano: 3-4 letras + 6 números + 3 caracteres alfanuméricos
const RFC_PATTERN = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;

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
        telefono: commonSchemas.mexicanPhone
            .optional()
            .allow(null)
            .messages({
                'string.pattern.base': 'Teléfono debe ser válido'
            }),
        telegram_chat_id: Joi.string()
            .min(5)
            .max(50)
            .optional()
            .allow(null)
            .trim()
            .messages({
                'string.min': 'Telegram chat_id debe tener al menos 5 caracteres',
                'string.max': 'Telegram chat_id no puede exceder 50 caracteres'
            }),
        whatsapp_phone: Joi.string()
            .min(10)
            .max(50)
            .optional()
            .allow(null)
            .trim()
            .messages({
                'string.min': 'WhatsApp phone debe tener al menos 10 caracteres',
                'string.max': 'WhatsApp phone no puede exceder 50 caracteres'
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

        // ====================================================================
        // Tipo de cliente y datos fiscales (Ene 2026)
        // ====================================================================
        tipo: Joi.string()
            .valid('persona', 'empresa')
            .optional()
            .default('persona')
            .messages({
                'any.only': 'Tipo debe ser "persona" o "empresa"'
            }),
        rfc: Joi.string()
            .max(LIMITES.RFC_MAX)
            .pattern(RFC_PATTERN)
            .uppercase()
            .optional()
            .allow(null, '')
            .when('tipo', {
                is: 'persona',
                then: Joi.forbidden().messages({
                    'any.unknown': 'RFC solo aplica para clientes tipo empresa'
                })
            })
            .messages({
                'string.pattern.base': 'RFC no válido (formato: XXXX000000XXX)',
                'string.max': `RFC no puede exceder ${LIMITES.RFC_MAX} caracteres`
            }),
        razon_social: Joi.string()
            .max(LIMITES.RAZON_SOCIAL_MAX)
            .trim()
            .optional()
            .allow(null, '')
            .when('tipo', {
                is: 'persona',
                then: Joi.forbidden().messages({
                    'any.unknown': 'Razón social solo aplica para clientes tipo empresa'
                })
            })
            .messages({
                'string.max': `Razón social no puede exceder ${LIMITES.RAZON_SOCIAL_MAX} caracteres`
            }),

        // ====================================================================
        // Dirección estructurada (Ene 2026)
        // ====================================================================
        calle: Joi.string()
            .max(LIMITES.CALLE_MAX)
            .optional()
            .allow(null, '')
            .trim()
            .messages({
                'string.max': `Calle no puede exceder ${LIMITES.CALLE_MAX} caracteres`
            }),
        colonia: Joi.string()
            .max(LIMITES.COLONIA_MAX)
            .optional()
            .allow(null, '')
            .trim()
            .messages({
                'string.max': `Colonia no puede exceder ${LIMITES.COLONIA_MAX} caracteres`
            }),
        ciudad: Joi.string()
            .max(LIMITES.CIUDAD_MAX)
            .optional()
            .allow(null, '')
            .trim()
            .messages({
                'string.max': `Ciudad no puede exceder ${LIMITES.CIUDAD_MAX} caracteres`
            }),
        estado_id: commonSchemas.id
            .optional()
            .allow(null)
            .messages({
                'number.base': 'ID de estado debe ser un número'
            }),
        codigo_postal: Joi.string()
            .max(LIMITES.CP_MAX)
            .pattern(/^[0-9]{5}$/)
            .optional()
            .allow(null, '')
            .messages({
                'string.pattern.base': 'Código postal debe ser de 5 dígitos',
                'string.max': `Código postal no puede exceder ${LIMITES.CP_MAX} caracteres`
            }),
        pais_id: commonSchemas.id
            .optional()
            .allow(null)
            .default(1) // México
            .messages({
                'number.base': 'ID de país debe ser un número'
            }),

        // ====================================================================
        // Campos existentes
        // ====================================================================
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
        lista_precios_id: commonSchemas.id
            .optional()
            .allow(null)
            .messages({
                'number.base': 'ID de lista de precios debe ser un número'
            }),
        activo: Joi.boolean()
            .optional()
            .default(true),
        foto_url: Joi.string()
            .uri()
            .max(500)
            .optional()
            .allow(null, '')
    })
};

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
        telefono: commonSchemas.mexicanPhone
            .allow(null),
        telegram_chat_id: Joi.string()
            .min(5)
            .max(50)
            .trim()
            .allow(null),
        whatsapp_phone: Joi.string()
            .min(10)
            .max(50)
            .trim()
            .allow(null),
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

        // ====================================================================
        // Tipo de cliente y datos fiscales (Ene 2026)
        // ====================================================================
        tipo: Joi.string()
            .valid('persona', 'empresa')
            .messages({
                'any.only': 'Tipo debe ser "persona" o "empresa"'
            }),
        rfc: Joi.string()
            .max(LIMITES.RFC_MAX)
            .pattern(RFC_PATTERN)
            .uppercase()
            .allow(null, '')
            .messages({
                'string.pattern.base': 'RFC no válido (formato: XXXX000000XXX)',
                'string.max': `RFC no puede exceder ${LIMITES.RFC_MAX} caracteres`
            }),
        razon_social: Joi.string()
            .max(LIMITES.RAZON_SOCIAL_MAX)
            .trim()
            .allow(null, '')
            .messages({
                'string.max': `Razón social no puede exceder ${LIMITES.RAZON_SOCIAL_MAX} caracteres`
            }),

        // ====================================================================
        // Dirección estructurada (Ene 2026)
        // ====================================================================
        calle: Joi.string()
            .max(LIMITES.CALLE_MAX)
            .trim()
            .allow(null, ''),
        colonia: Joi.string()
            .max(LIMITES.COLONIA_MAX)
            .trim()
            .allow(null, ''),
        ciudad: Joi.string()
            .max(LIMITES.CIUDAD_MAX)
            .trim()
            .allow(null, ''),
        estado_id: commonSchemas.id
            .allow(null),
        codigo_postal: Joi.string()
            .max(LIMITES.CP_MAX)
            .pattern(/^[0-9]{5}$/)
            .allow(null, '')
            .messages({
                'string.pattern.base': 'Código postal debe ser de 5 dígitos'
            }),
        pais_id: commonSchemas.id
            .allow(null),

        // ====================================================================
        // Campos existentes
        // ====================================================================
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
        lista_precios_id: commonSchemas.id
            .optional()
            .allow(null),
        activo: Joi.boolean(),
        foto_url: Joi.string()
            .uri()
            .max(500)
            .allow(null, '')
    }).min(1), // Al menos un campo debe estar presente
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const listar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        activo: Joi.string()
            .valid('true', 'false')
            .optional(),
        marketing_permitido: Joi.string()
            .valid('true', 'false')
            .optional(),
        // Filtro por tipo (Ene 2026)
        tipo: Joi.string()
            .valid('persona', 'empresa')
            .optional()
            .messages({
                'any.only': 'Tipo debe ser "persona" o "empresa"'
            }),
        // Filtro por etiquetas (Ene 2026 - Fase 2)
        etiqueta_ids: Joi.alternatives()
            .try(
                Joi.string().pattern(/^[\d,\s]+$/),  // String con IDs separados por coma
                Joi.array().items(Joi.number().integer().positive())  // Array de números
            )
            .optional()
            .messages({
                'alternatives.match': 'etiqueta_ids debe ser una lista de IDs separados por coma o un array de números'
            }),
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
            .valid('nombre', 'email', 'telefono', 'tipo', 'creado_en', 'actualizado_en')
            .default('nombre'),
        orden: Joi.string()
            .valid('ASC', 'DESC', 'asc', 'desc')
            .default('ASC')
    })
};

const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

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
        tipo: Joi.string()
            .valid('nombre', 'telefono', 'email', 'telegram_chat_id', 'whatsapp_phone')
            .default('nombre')
            .messages({
                'any.only': 'Tipo de búsqueda debe ser: nombre, telefono, email, telegram_chat_id o whatsapp_phone'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .default(10)
    })
};

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

const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const obtenerEstadisticas = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const obtenerEstadisticasCliente = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

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
    obtenerEstadisticasCliente,
    buscarPorTelefono,
    buscarPorNombre,
    LIMITES
};
