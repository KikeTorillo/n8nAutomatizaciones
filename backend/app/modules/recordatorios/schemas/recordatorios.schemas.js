/**
 * ====================================================================
 * SCHEMAS: RECORDATORIOS
 * ====================================================================
 *
 * Schemas de validación Joi para el módulo de recordatorios.
 *
 * @module modules/recordatorios/schemas/recordatorios.schemas
 */

const Joi = require('joi');

/**
 * Schema para actualizar configuración de recordatorios
 */
const actualizarConfiguracionSchema = Joi.object({
  habilitado: Joi.boolean()
    .messages({
      'boolean.base': 'habilitado debe ser un booleano'
    }),

  recordatorio_1_horas: Joi.number()
    .integer()
    .min(1)
    .max(168) // Máximo 1 semana
    .messages({
      'number.base': 'recordatorio_1_horas debe ser un número',
      'number.min': 'recordatorio_1_horas debe ser al menos 1 hora',
      'number.max': 'recordatorio_1_horas no puede ser más de 168 horas (1 semana)'
    }),

  recordatorio_1_activo: Joi.boolean()
    .messages({
      'boolean.base': 'recordatorio_1_activo debe ser un booleano'
    }),

  recordatorio_2_horas: Joi.number()
    .integer()
    .min(1)
    .max(24)
    .messages({
      'number.base': 'recordatorio_2_horas debe ser un número',
      'number.min': 'recordatorio_2_horas debe ser al menos 1 hora',
      'number.max': 'recordatorio_2_horas no puede ser más de 24 horas'
    }),

  recordatorio_2_activo: Joi.boolean()
    .messages({
      'boolean.base': 'recordatorio_2_activo debe ser un booleano'
    }),

  plantilla_mensaje: Joi.string()
    .min(10)
    .max(2000)
    .messages({
      'string.base': 'plantilla_mensaje debe ser texto',
      'string.min': 'plantilla_mensaje debe tener al menos 10 caracteres',
      'string.max': 'plantilla_mensaje no puede tener más de 2000 caracteres'
    }),

  hora_inicio: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      'string.pattern.base': 'hora_inicio debe tener formato HH:MM (24 horas)'
    }),

  hora_fin: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      'string.pattern.base': 'hora_fin debe tener formato HH:MM (24 horas)'
    }),

  max_reintentos: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      'number.base': 'max_reintentos debe ser un número',
      'number.min': 'max_reintentos debe ser al menos 1',
      'number.max': 'max_reintentos no puede ser más de 5'
    }),

  config_avanzada: Joi.object()
    .messages({
      'object.base': 'config_avanzada debe ser un objeto JSON'
    })
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

/**
 * Schema para enviar recordatorio de prueba
 */
const enviarPruebaSchema = Joi.object({
  telefono: Joi.string()
    .required()
    .pattern(/^[\d\s\-+()]+$/)
    .min(10)
    .max(20)
    .messages({
      'string.base': 'telefono debe ser texto',
      'string.pattern.base': 'telefono debe contener solo dígitos y caracteres válidos',
      'string.min': 'telefono debe tener al menos 10 dígitos',
      'string.max': 'telefono no puede tener más de 20 caracteres',
      'any.required': 'telefono es requerido'
    }),

  mensaje: Joi.string()
    .min(1)
    .max(2000)
    .messages({
      'string.base': 'mensaje debe ser texto',
      'string.max': 'mensaje no puede tener más de 2000 caracteres'
    })
});

/**
 * Schema para filtros de estadísticas
 */
const estadisticasFiltrosSchema = Joi.object({
  fecha_desde: Joi.date()
    .iso()
    .messages({
      'date.base': 'fecha_desde debe ser una fecha válida',
      'date.format': 'fecha_desde debe estar en formato ISO'
    }),

  fecha_hasta: Joi.date()
    .iso()
    .min(Joi.ref('fecha_desde'))
    .messages({
      'date.base': 'fecha_hasta debe ser una fecha válida',
      'date.format': 'fecha_hasta debe estar en formato ISO',
      'date.min': 'fecha_hasta debe ser posterior a fecha_desde'
    })
});

/**
 * Schema para procesar batch (interno)
 */
const procesarBatchSchema = Joi.object({
  limite: Joi.number()
    .integer()
    .min(1)
    .max(500)
    .default(100)
    .messages({
      'number.base': 'limite debe ser un número',
      'number.min': 'limite debe ser al menos 1',
      'number.max': 'limite no puede ser más de 500'
    })
});

/**
 * Schema para filtros de historial de recordatorios
 * GET /api/v1/recordatorios/historial
 */
const historialFiltrosSchema = Joi.object({
  cita_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'cita_id debe ser un número',
      'number.integer': 'cita_id debe ser un número entero',
      'number.positive': 'cita_id debe ser un número positivo',
      'any.required': 'cita_id es requerido'
    })
});

module.exports = {
  actualizarConfiguracionSchema,
  enviarPruebaSchema,
  estadisticasFiltrosSchema,
  procesarBatchSchema,
  historialFiltrosSchema
};
