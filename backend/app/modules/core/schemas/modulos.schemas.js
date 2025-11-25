/**
 * @fileoverview Schemas de validación para Módulos
 * @description Validación Joi para endpoints de módulos
 */

const Joi = require('joi');

// Módulos válidos del sistema
const MODULOS_VALIDOS = [
  'core',
  'agendamiento',
  'inventario',
  'pos',
  'marketplace',
  'comisiones',
  'chatbots'
];

const modulosSchemas = {

  /**
   * Schema para activar/desactivar módulo
   */
  cambiarEstadoModulo: Joi.object({
    modulo: Joi.string()
      .valid(...MODULOS_VALIDOS)
      .required()
      .messages({
        'any.only': `Módulo inválido. Opciones: ${MODULOS_VALIDOS.join(', ')}`,
        'any.required': 'El campo "modulo" es requerido'
      })
  }),

  /**
   * Schema para verificar módulo (param)
   */
  verificarModuloParam: Joi.object({
    modulo: Joi.string()
      .valid(...MODULOS_VALIDOS)
      .required()
      .messages({
        'any.only': `Módulo inválido. Opciones: ${MODULOS_VALIDOS.join(', ')}`,
        'any.required': 'El parámetro "modulo" es requerido'
      })
  })

};

module.exports = modulosSchemas;
