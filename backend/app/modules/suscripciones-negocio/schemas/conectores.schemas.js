/**
 * ====================================================================
 * SCHEMAS: CONECTORES DE PAGO
 * ====================================================================
 * Validaciones Joi para endpoints de conectores de pago.
 *
 * @module suscripciones-negocio/schemas/conectores
 * @version 1.0.0
 * @date Enero 2026
 */

const Joi = require('joi');

/**
 * Credenciales por gateway
 */
const credencialesMercadoPago = Joi.object({
    access_token: Joi.string().required()
        .messages({
            'any.required': 'El access_token de MercadoPago es requerido'
        }),
    public_key: Joi.string().optional()
}).unknown(true); // Permite campos adicionales

const credencialesStripe = Joi.object({
    secret_key: Joi.string().required()
        .messages({
            'any.required': 'La secret_key de Stripe es requerida'
        }),
    publishable_key: Joi.string().optional()
}).unknown(true);

const credencialesPayPal = Joi.object({
    client_id: Joi.string().required(),
    client_secret: Joi.string().required()
}).unknown(true);

const credencialesConekta = Joi.object({
    private_key: Joi.string().required()
}).unknown(true);

/**
 * Schema de credenciales dinámico según gateway
 */
const credencialesPorGateway = Joi.alternatives().conditional(Joi.ref('...gateway'), {
    is: 'mercadopago',
    then: credencialesMercadoPago,
    otherwise: Joi.alternatives().conditional(Joi.ref('...gateway'), {
        is: 'stripe',
        then: credencialesStripe,
        otherwise: Joi.alternatives().conditional(Joi.ref('...gateway'), {
            is: 'paypal',
            then: credencialesPayPal,
            otherwise: credencialesConekta
        })
    })
});

/**
 * POST /conectores - Crear conector
 */
const crear = {
    body: Joi.object({
        gateway: Joi.string()
            .valid('mercadopago', 'stripe', 'paypal', 'conekta')
            .required()
            .messages({
                'any.only': 'Gateway debe ser: mercadopago, stripe, paypal o conekta',
                'any.required': 'El gateway es requerido'
            }),
        entorno: Joi.string()
            .valid('sandbox', 'production')
            .default('sandbox')
            .messages({
                'any.only': 'Entorno debe ser: sandbox o production'
            }),
        credenciales: Joi.object()
            .required()
            .messages({
                'any.required': 'Las credenciales son requeridas'
            }),
        nombre_display: Joi.string()
            .max(100)
            .optional()
            .messages({
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),
        webhook_url: Joi.string()
            .uri()
            .optional()
            .messages({
                'string.uri': 'El webhook_url debe ser una URL válida'
            }),
        webhook_secret: Joi.string()
            .optional(),
        es_principal: Joi.boolean()
            .default(false)
    })
};

/**
 * PUT /conectores/:id - Actualizar conector
 */
const actualizar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    }),
    body: Joi.object({
        nombre_display: Joi.string()
            .max(100)
            .optional(),
        entorno: Joi.string()
            .valid('sandbox', 'production')
            .optional(),
        credenciales: Joi.object()
            .optional(),
        webhook_url: Joi.string()
            .uri()
            .allow(null, '')
            .optional(),
        webhook_secret: Joi.string()
            .allow(null, '')
            .optional(),
        activo: Joi.boolean()
            .optional(),
        es_principal: Joi.boolean()
            .optional()
    }).min(1).messages({
        'object.min': 'Debe proporcionar al menos un campo para actualizar'
    })
};

/**
 * GET /conectores - Listar conectores
 */
const listar = {
    query: Joi.object({
        gateway: Joi.string()
            .valid('mercadopago', 'stripe', 'paypal', 'conekta')
            .optional(),
        entorno: Joi.string()
            .valid('sandbox', 'production')
            .optional(),
        activo: Joi.string()
            .valid('true', 'false')
            .optional()
    })
};

/**
 * GET/DELETE /conectores/:id - Obtener/Eliminar conector
 */
const porId = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

/**
 * POST /conectores/:id/verificar - Verificar conectividad
 */
const verificar = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
    })
};

module.exports = {
    crear,
    actualizar,
    listar,
    porId,
    verificar
};
