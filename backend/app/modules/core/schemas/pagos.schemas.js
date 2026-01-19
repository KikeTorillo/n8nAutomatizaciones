/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - PAGOS
 * ====================================================================
 *
 * Schemas Joi para validar requests de pagos y webhooks.
 *
 * @module schemas/pagos.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

module.exports = {
  /**
   * Schema para crear suscripción
   * POST /api/v1/pagos/crear-suscripcion
   */
  crearSuscripcion: Joi.object({
    body: Joi.object({
      plan_codigo: Joi.string()
        .valid('basico', 'profesional', 'custom')
        .required()
        .messages({
          'any.required': 'El código del plan es requerido',
          'any.only': 'El plan debe ser: basico, profesional o custom'
        }),

      // ✅ FIX v2.1: Usar fields.email con lowercase
      payer_email: fields.email
        .optional()
        .messages({
          'string.email': 'El email del pagador debe ser válido'
        })
    })
  }),

  /**
   * Schema para obtener historial
   * GET /api/v1/pagos/historial
   */
  obtenerHistorial: Joi.object({
    query: Joi.object({
      limite: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .optional(),

      pagina: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional()
    })
  })
};
