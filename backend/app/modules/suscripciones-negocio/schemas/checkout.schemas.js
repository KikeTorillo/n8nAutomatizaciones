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
    }).optional()
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

module.exports = {
    iniciarCheckout,
    validarCupon,
    obtenerResultado
};
