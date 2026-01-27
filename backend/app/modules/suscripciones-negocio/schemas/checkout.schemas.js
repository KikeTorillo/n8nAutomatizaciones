/**
 * ====================================================================
 * SCHEMAS: CHECKOUT
 * ====================================================================
 * Validación de datos para el flujo de checkout con MercadoPago.
 *
 * @module schemas/checkout
 */

const Joi = require('joi');
const { PERIODOS_FACTURACION } = require('../../../config/constants');

/**
 * Schema para iniciar checkout
 *
 * Soporta dos modos de billing:
 * - Platform Billing (default): Nexo Team vende a organizaciones
 * - Customer Billing: Organizaciones venden a sus clientes (es_venta_propia=true)
 */
const iniciarCheckout = Joi.object({
    plan_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID del plan debe ser un número',
            'any.required': 'El ID del plan es requerido'
        }),

    periodo: Joi.string()
        .valid(...PERIODOS_FACTURACION)
        .default('mensual')
        .messages({
            'any.only': `El período debe ser uno de: ${PERIODOS_FACTURACION.join(', ')}`
        }),

    cupon_codigo: Joi.string()
        .trim()
        .uppercase()
        .max(50)
        .optional()
        .allow(null, '')
        .messages({
            'string.max': 'El código del cupón no puede exceder 50 caracteres'
        }),

    // Datos del suscriptor (si no es cliente existente)
    suscriptor_externo: Joi.object({
        nombre: Joi.string().trim().max(200).required(),
        email: Joi.string().email().lowercase().required(),
        telefono: Joi.string().trim().max(20).optional(),
        empresa: Joi.string().trim().max(200).optional()
    }).optional(),

    // ═══════════════════════════════════════════════════════════════
    // CUSTOMER BILLING: Organizaciones venden a sus clientes
    // ═══════════════════════════════════════════════════════════════

    /**
     * Si true, la org del usuario es el vendor (venta propia)
     * Si false (default), usa Platform Billing (Nexo Team es vendor)
     */
    es_venta_propia: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'es_venta_propia debe ser booleano'
        }),

    /**
     * ID del cliente al que se vende la suscripción
     * Requerido cuando es_venta_propia=true
     */
    cliente_id: Joi.number()
        .integer()
        .positive()
        .when('es_venta_propia', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'number.base': 'El ID del cliente debe ser un número',
            'any.required': 'cliente_id es requerido para Customer Billing (venta propia)'
        })
});

/**
 * Schema para validar cupón
 */
const validarCupon = Joi.object({
    codigo: Joi.string()
        .trim()
        .uppercase()
        .max(50)
        .required()
        .messages({
            'string.empty': 'El código del cupón es requerido',
            'any.required': 'El código del cupón es requerido'
        }),

    plan_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID del plan debe ser un número',
            'any.required': 'El ID del plan es requerido'
        }),

    precio_base: Joi.number()
        .positive()
        .optional()
        .messages({
            'number.base': 'El precio base debe ser un número'
        })
});

/**
 * Schema para obtener resultado de pago
 */
const obtenerResultado = Joi.object({
    suscripcion_id: Joi.number()
        .integer()
        .positive()
        .optional(),

    external_reference: Joi.string()
        .trim()
        .max(100)
        .optional(),

    // Para suscripciones recurrentes, MercadoPago retorna preapproval_id
    preapproval_id: Joi.string()
        .trim()
        .max(100)
        .optional(),

    collection_status: Joi.string()
        .valid('approved', 'pending', 'rejected', 'cancelled', 'refunded', 'charged_back')
        .optional(),

    payment_id: Joi.string()
        .trim()
        .max(100)
        .optional()
});

/**
 * Schema para iniciar trial (sin pago)
 */
const iniciarTrial = Joi.object({
    plan_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'El ID del plan debe ser un número',
            'any.required': 'El ID del plan es requerido'
        }),

    periodo: Joi.string()
        .valid(...PERIODOS_FACTURACION)
        .default('mensual')
        .messages({
            'any.only': `El período debe ser uno de: ${PERIODOS_FACTURACION.join(', ')}`
        })
});

module.exports = {
    iniciarCheckout,
    validarCupon,
    obtenerResultado,
    iniciarTrial
};
