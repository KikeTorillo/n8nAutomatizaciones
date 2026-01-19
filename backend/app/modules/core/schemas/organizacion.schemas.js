const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { fields } = require('../../../schemas/shared');
const { PLANES } = require('../../../constants/organizacion.constants');
// ⚠️ Nov 2025: TIPOS_INDUSTRIA removido - ahora se usa tabla dinámica categorias_industria

// POST /organizaciones
const crear = {
    body: Joi.object({
        nombre_comercial: Joi.string()
            .min(2)
            .max(150)
            .required()
            .trim(),
        razon_social: Joi.string()
            .max(200)
            .optional()
            .allow(null)
            .trim(),
        rfc_nif: Joi.string()
            .max(20)
            .optional()
            .allow(null)
            .trim(),
        categoria_id: Joi.number()
            .integer()
            .positive()
            .required()
            .messages({
                'number.base': 'categoria_id debe ser un número',
                'number.positive': 'categoria_id debe ser mayor a 0',
                'any.required': 'categoria_id es requerido'
            }),
        configuracion_categoria: Joi.object()
            .optional()
            .default({}),
        email_admin: Joi.string()
            .email()
            .optional()
            .allow(null),
        telefono: fields.telefono
            .optional()
            .allow(null),
        sitio_web: Joi.string()
            .uri()
            .optional()
            .allow(null),
        logo_url: Joi.string()
            .uri()
            .optional()
            .allow(null),
        colores_marca: Joi.object()
            .optional()
            .default({}),
        configuracion_ui: Joi.object()
            .optional()
            .default({}),
        zona_horaria: Joi.string()
            .max(50)
            .default('America/Mexico_City'),
        idioma: Joi.string()
            .valid('es', 'en', 'fr', 'pt')
            .default('es'),
        moneda: Joi.string()
            .length(3)
            .uppercase()
            .default('MXN'),
        plan: Joi.string()
            .valid(...PLANES)
            .default('basico')
    })
};

// GET /organizaciones
const listar = {
    query: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .default(10),
        categoria_id: Joi.number()
            .integer()
            .positive()
            .optional(),
        incluir_inactivas: Joi.boolean()
            .optional()
            .default(false)
    })
};

// GET /organizaciones/:id
const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// PUT /organizaciones/:id
const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre_comercial: Joi.string()
            .min(2)
            .max(150)
            .trim(),
        razon_social: Joi.string()
            .max(200)
            .allow(null)
            .trim(),
        rfc_nif: Joi.string()
            .max(20)
            .allow(null)
            .trim(),
        categoria_id: Joi.number()
            .integer()
            .positive()
            .allow(null),
        configuracion_categoria: Joi.object(),
        email_admin: commonSchemas.email,
        telefono: fields.telefono
            .allow(null),
        sitio_web: Joi.string()
            .uri()
            .allow(null),
        logo_url: Joi.string()
            .uri()
            .allow(null),
        colores_marca: Joi.object(),
        configuracion_ui: Joi.object(),
        zona_horaria: Joi.string()
            .max(50),
        idioma: Joi.string()
            .valid('es', 'en', 'fr', 'pt'),
        moneda: Joi.string()
            .length(3)
            .uppercase(),
        metadata: Joi.object(),
        notas_internas: Joi.string()
            .allow(null),
        suspendido: Joi.boolean(),
        motivo_suspension: Joi.string()
            .allow(null),
        // Configuración POS (Dic 2025)
        pos_requiere_profesional: Joi.boolean()
    }).min(1)
};

// DELETE /organizaciones/:id
const desactivar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// POST /organizaciones/onboarding
// Modelo Free/Pro (Nov 2025):
// - plan: 'free', 'pro', 'trial' (default: trial)
// - app_seleccionada: requerido solo si plan = 'free'
const onboarding = {
    body: Joi.object({
        organizacion: Joi.object({
            nombre_comercial: Joi.string()
                .min(2)
                .max(150)
                .required()
                .trim(),
            categoria_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'categoria_id debe ser un número',
                    'number.positive': 'categoria_id debe ser mayor a 0',
                    'any.required': 'categoria_id es requerido'
                }),
            plan: Joi.string()
                .valid(...PLANES)
                .default('trial'),
            // App elegida para Plan Free (Nov 2025)
            // Requerido si plan = 'free', ignorado para otros planes
            app_seleccionada: Joi.string()
                .valid('agendamiento', 'inventario', 'pos')
                .when('plan', {
                    is: 'free',
                    then: Joi.required().messages({
                        'any.required': 'Debes elegir una app para el Plan Free (agendamiento, inventario o pos)'
                    }),
                    otherwise: Joi.optional().allow(null)
                }),
            razon_social: Joi.string()
                .max(200)
                .optional()
                .allow(null)
                .trim(),
            rfc: Joi.string()
                .max(20)
                .optional()
                .allow(null)
                .trim(),
            telefono_principal: fields.telefono
                .optional()
                .allow(null),
            email_contacto: commonSchemas.email
                .optional()
                .allow(null),
            // Ubicación geográfica (Nov 2025 - Catálogo normalizado México)
            estado_id: Joi.number()
                .integer()
                .positive()
                .optional()
                .messages({
                    'number.base': 'estado_id debe ser un número',
                    'number.positive': 'estado_id debe ser mayor a 0'
                }),
            ciudad_id: Joi.number()
                .integer()
                .positive()
                .optional()
                .messages({
                    'number.base': 'ciudad_id debe ser un número',
                    'number.positive': 'ciudad_id debe ser mayor a 0'
                })
        }).required(),
        admin: Joi.object({
            nombre: Joi.string()
                .min(2)
                .max(100)
                .required()
                .trim(),
            apellidos: Joi.string()
                .min(2)
                .max(100)
                .required()
                .trim(),
            email: commonSchemas.emailRequired,
            password: Joi.string()
                .min(8)
                .required(),
            telefono: fields.telefono
                .optional()
                .allow(null)
        }).required(),
        enviar_email_bienvenida: Joi.boolean()
            .default(false)
    })
};

// GET /organizaciones/:id/limites
const verificarLimites = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// GET /organizaciones/:id/estadisticas
const obtenerEstadisticas = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// GET /organizaciones/:id/setup-progress
const obtenerProgresoSetup = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// GET /organizaciones/:id/metricas
const obtenerMetricas = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        periodo: Joi.string()
            .valid('mes', 'semana', 'año')
            .default('mes')
    })
};

// PUT /organizaciones/:id/plan
const cambiarPlan = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nuevo_plan: Joi.string()
            .valid(...PLANES)
            .required(),
        configuracion_plan: Joi.object()
            .optional()
            .default({})
    })
};

// PUT /organizaciones/:id/suspender
const suspender = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        motivo_suspension: Joi.string()
            .required()
            .trim()
            .min(10)
            .max(500)
            .messages({
                'string.min': 'El motivo debe tener al menos 10 caracteres',
                'string.max': 'El motivo no puede exceder 500 caracteres'
            })
    })
};

// PUT /organizaciones/:id/reactivar
const reactivar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

module.exports = {
    crear,
    listar,
    obtenerPorId,
    actualizar,
    desactivar,
    onboarding,
    verificarLimites,
    obtenerEstadisticas,
    obtenerProgresoSetup,
    obtenerMetricas,
    cambiarPlan,
    suspender,
    reactivar
};
