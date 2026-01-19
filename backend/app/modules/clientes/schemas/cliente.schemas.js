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
const { withPagination, fields } = require('../../../schemas/shared');

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
        email: fields.email
            .optional()
            .allow(null)
            .messages({
                'string.email': 'Email no válido'
            }),
        telefono: fields.telefono
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
        rfc: fields.rfc
            .optional()
            .when('tipo', {
                is: 'persona',
                then: Joi.forbidden().messages({
                    'any.unknown': 'RFC solo aplica para clientes tipo empresa'
                })
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
        activo: fields.activo,
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
        email: fields.email
            .allow(null),
        telefono: fields.telefono
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
        rfc: fields.rfc,
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
    query: withPagination({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        activo: fields.activoQuery,
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
            .optional()
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

/**
 * Schema para importacion masiva de clientes desde CSV
 */
const importarCSV = {
    body: Joi.object({
        clientes: Joi.array()
            .items(
                Joi.object({
                    nombre: Joi.string()
                        .min(LIMITES.NOMBRE_MIN)
                        .max(LIMITES.NOMBRE_MAX)
                        .required()
                        .trim(),
                    email: fields.email
                        .optional()
                        .allow(null, ''),
                    telefono: Joi.string()
                        .min(LIMITES.TELEFONO_MIN)
                        .max(LIMITES.TELEFONO_MAX)
                        .optional()
                        .allow(null, ''),
                    direccion: Joi.string()
                        .max(500)
                        .optional()
                        .allow(null, ''),
                    notas: Joi.string()
                        .max(LIMITES.NOTAS_MAX)
                        .optional()
                        .allow(null, ''),
                    marketing_permitido: Joi.boolean()
                        .optional()
                        .default(true)
                })
            )
            .min(1)
            .max(500)
            .required()
            .messages({
                'array.min': 'Se requiere al menos un cliente para importar',
                'array.max': 'Maximo 500 clientes por importacion',
                'any.required': 'El campo clientes es requerido'
            })
    })
};

// =========================================================================
// CRÉDITO / FIADO (Ene 2026)
// =========================================================================

/**
 * Obtener estado de crédito de un cliente
 * GET /api/v1/clientes/:id/credito
 */
const obtenerEstadoCredito = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

/**
 * Actualizar configuración de crédito de un cliente
 * PATCH /api/v1/clientes/:id/credito
 */
const actualizarCredito = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        permite_credito: Joi.boolean()
            .required()
            .messages({
                'any.required': 'Debe indicar si permite crédito'
            }),
        limite_credito: Joi.number()
            .min(0)
            .max(9999999999.99)
            .optional()
            .default(0)
            .messages({
                'number.min': 'Límite de crédito no puede ser negativo',
                'number.max': 'Límite de crédito excede el máximo permitido'
            }),
        dias_credito: Joi.number()
            .integer()
            .min(1)
            .max(365)
            .optional()
            .default(30)
            .messages({
                'number.min': 'Días de crédito debe ser al menos 1',
                'number.max': 'Días de crédito no puede exceder 365'
            })
    })
};

/**
 * Suspender crédito de un cliente
 * POST /api/v1/clientes/:id/credito/suspender
 */
const suspenderCredito = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        motivo: Joi.string()
            .max(500)
            .optional()
            .trim()
            .messages({
                'string.max': 'Motivo no puede exceder 500 caracteres'
            })
    })
};

/**
 * Registrar abono a cuenta de cliente
 * POST /api/v1/clientes/:id/credito/abono
 */
const registrarAbono = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        monto: Joi.number()
            .positive()
            .max(9999999999.99)
            .required()
            .messages({
                'number.positive': 'Monto debe ser positivo',
                'number.max': 'Monto excede el máximo permitido',
                'any.required': 'Monto es requerido'
            }),
        descripcion: Joi.string()
            .max(500)
            .optional()
            .trim()
            .messages({
                'string.max': 'Descripción no puede exceder 500 caracteres'
            })
    })
};

/**
 * Listar movimientos de crédito de un cliente
 * GET /api/v1/clientes/:id/credito/movimientos
 */
const listarMovimientosCredito = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: withPagination({})
};

/**
 * Listar clientes con saldo pendiente
 * GET /api/v1/clientes/credito/con-saldo
 */
const listarClientesConSaldo = {
    query: Joi.object({
        solo_vencidos: Joi.string()
            .valid('true', 'false')
            .optional()
            .default('false')
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
    importarCSV,
    // Crédito / Fiado (Ene 2026)
    obtenerEstadoCredito,
    actualizarCredito,
    suspenderCredito,
    registrarAbono,
    listarMovimientosCredito,
    listarClientesConSaldo,
    LIMITES
};
