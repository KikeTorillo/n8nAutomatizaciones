/**
 * ====================================================================
 * ENTITLEMENTS SCHEMAS
 * ====================================================================
 * Validación Joi para endpoints de entitlements de plataforma.
 * Solo SuperAdmin puede acceder a estos endpoints.
 *
 * @module suscripciones-negocio/schemas/entitlements
 */

const Joi = require('joi');

/**
 * Schema para actualizar entitlements de un plan
 */
const actualizarEntitlements = {
    params: Joi.object({
        id: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'ID debe ser un número',
                'number.positive': 'ID debe ser positivo',
                'any.required': 'ID es requerido'
            })
    }),
    body: Joi.object({
        limites: Joi.object().pattern(
            Joi.string(),
            Joi.number().integer()
        ).default({})
            .messages({
                'object.base': 'Límites debe ser un objeto'
            }),
        features: Joi.array().items(Joi.string()).default([])
            .messages({
                'array.base': 'Features debe ser un array'
            }),
        usuarios_incluidos: Joi.number().integer().min(1).required()
            .messages({
                'number.base': 'Usuarios incluidos debe ser un número',
                'number.min': 'Mínimo 1 usuario incluido',
                'any.required': 'Usuarios incluidos es requerido'
            }),
        precio_usuario_adicional: Joi.number().min(0).allow(null)
            .messages({
                'number.base': 'Precio usuario adicional debe ser un número',
                'number.min': 'Precio no puede ser negativo'
            }),
        max_usuarios_hard: Joi.number().integer().min(1).allow(null)
            .messages({
                'number.base': 'Máximo usuarios debe ser un número',
                'number.min': 'Mínimo 1 usuario'
            })
    })
};

module.exports = {
    actualizarEntitlements
};
