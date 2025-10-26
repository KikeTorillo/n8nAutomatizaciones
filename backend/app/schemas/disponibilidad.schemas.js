/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - DISPONIBILIDAD
 * ====================================================================
 *
 * Schemas Joi para validación de requests del endpoint de disponibilidad.
 */

const Joi = require('joi');

const disponibilidadSchemas = {
  /**
   * Schema para consultar disponibilidad
   * GET /api/v1/disponibilidad
   */
  consultar: {
    query: Joi.object({
      // ========== OBLIGATORIOS ==========
      fecha: Joi.alternatives()
        .try(
          Joi.string().isoDate(), // YYYY-MM-DD o ISO completo
          Joi.string().valid('hoy', 'mañana') // Aliases especiales
        )
        .required()
        .messages({
          'any.required': 'La fecha es requerida',
          'alternatives.match':
            'Formato de fecha inválido. Use YYYY-MM-DD, ISO, "hoy" o "mañana"',
        }),

      servicio_id: Joi.number().integer().positive().required().messages({
        'any.required': 'El servicio_id es requerido',
        'number.base': 'servicio_id debe ser un número',
        'number.positive': 'servicio_id debe ser positivo',
      }),

      // ========== OPCIONALES ==========
      profesional_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'profesional_id debe ser un número',
        'number.positive': 'profesional_id debe ser positivo',
      }),

      hora: Joi.string()
        .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .optional()
        .messages({
          'string.pattern.base': 'Formato de hora inválido. Use HH:MM (24 horas)',
        }),

      duracion: Joi.number().integer().min(10).max(480).optional().messages({
        'number.min': 'La duración mínima es 10 minutos',
        'number.max': 'La duración máxima es 480 minutos (8 horas)',
      }),

      rango_dias: Joi.number().integer().min(1).max(90).optional().default(1).messages({
        'number.min': 'El rango mínimo es 1 día',
        'number.max': 'El rango máximo es 90 días',
      }),

      intervalo_minutos: Joi.number()
        .valid(15, 30, 60)
        .optional()
        .default(30)
        .messages({
          'any.only': 'intervalo_minutos debe ser 15, 30 o 60',
        }),

      solo_disponibles: Joi.boolean().optional().default(true),
    }),
  },
};

module.exports = disponibilidadSchemas;
