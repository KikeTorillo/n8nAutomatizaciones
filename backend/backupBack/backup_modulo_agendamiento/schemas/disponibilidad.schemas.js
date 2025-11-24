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
      // ========== PÚBLICO (MARKETPLACE) ==========
      // organizacion_id: Requerido solo para peticiones públicas (sin auth)
      organizacion_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'organizacion_id debe ser un número',
        'number.positive': 'organizacion_id debe ser positivo',
      }),

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

      // Soportar tanto servicio_id (single) como servicios_ids (array)
      servicio_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'servicio_id debe ser un número',
        'number.positive': 'servicio_id debe ser positivo',
      }),

      servicios_ids: Joi.alternatives()
        .try(
          Joi.array().items(Joi.number().integer().positive()).min(1).max(10),
          Joi.number().integer().positive() // También acepta un solo número
        )
        .optional()
        .messages({
          'array.min': 'Debe proporcionar al menos un servicio',
          'array.max': 'Máximo 10 servicios por cita',
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

      // Excluir una cita específica de la validación (útil para reagendamiento)
      excluir_cita_id: Joi.number().integer().positive().optional().messages({
        'number.base': 'excluir_cita_id debe ser un número',
        'number.positive': 'excluir_cita_id debe ser positivo',
      }),
    }),
  },
};

module.exports = disponibilidadSchemas;
