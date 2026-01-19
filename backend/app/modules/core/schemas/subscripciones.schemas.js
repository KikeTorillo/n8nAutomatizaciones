/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - SUSCRIPCIONES
 * ====================================================================
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const subscripcionesSchemas = {
  /**
   * Schema para crear suscripción
   */
  crearSuscripcion: Joi.object({
    plan_id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'El ID del plan debe ser un número',
        'number.integer': 'El ID del plan debe ser un entero',
        'number.positive': 'El ID del plan debe ser positivo',
        'any.required': 'El ID del plan es requerido'
      }),

    // ✅ FIX v2.1: Usar fields.email con lowercase
    email: fields.email.required()
      .messages({
        'string.email': 'El email no es válido',
        'any.required': 'El email es requerido'
      }),

    card_token_id: Joi.string().min(10).required()
      .messages({
        'string.base': 'El token de tarjeta debe ser un string',
        'string.min': 'El token de tarjeta es inválido',
        'any.required': 'El token de tarjeta es requerido para crear la suscripción'
      })
  }),

  /**
   * Schema para activar pago (después del trial) - Con init_point
   * No requiere body - el endpoint genera el init_point automáticamente
   */
  activarPago: Joi.object({
    // Vacío - no requiere datos del body
  })
};

module.exports = subscripcionesSchemas;
