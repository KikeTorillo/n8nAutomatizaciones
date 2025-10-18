const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');
const { TIPOS_INDUSTRIA, PLANES } = require('../constants/organizacion.constants');

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
        tipo_industria: Joi.string()
            .valid(...TIPOS_INDUSTRIA)
            .required(),
        configuracion_industria: Joi.object()
            .optional()
            .default({}),
        email_admin: Joi.string()
            .email()
            .optional()
            .allow(null),
        telefono: commonSchemas.mexicanPhone
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
        tipo_industria: Joi.string()
            .valid(...TIPOS_INDUSTRIA)
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
        tipo_industria: Joi.string()
            .valid(...TIPOS_INDUSTRIA),
        configuracion_industria: Joi.object(),
        email_admin: commonSchemas.email,
        telefono: commonSchemas.mexicanPhone
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
            .allow(null)
    }).min(1)
};

// DELETE /organizaciones/:id
const desactivar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

// POST /organizaciones/onboarding
const onboarding = {
    body: Joi.object({
        organizacion: Joi.object({
            nombre_comercial: Joi.string()
                .min(2)
                .max(150)
                .required()
                .trim(),
            tipo_industria: Joi.string()
                .valid(...TIPOS_INDUSTRIA)
                .required(),
            plan: Joi.string()
                .valid(...PLANES)
                .default('basico'),
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
            telefono_principal: commonSchemas.mexicanPhone
                .optional()
                .allow(null),
            email_contacto: commonSchemas.email
                .optional()
                .allow(null)
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
            telefono: commonSchemas.mexicanPhone
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
    obtenerMetricas,
    cambiarPlan,
    suspender,
    reactivar
};
