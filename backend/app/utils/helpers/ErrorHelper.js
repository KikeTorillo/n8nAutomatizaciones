/**
 * Helper para manejo de errores
 * @module utils/helpers/ErrorHelper
 */

const logger = require('../../utils/logger');

class ErrorHelper {
  /**
   * Maneja errores de base de datos
   */
  static handleDatabaseError(error) {
    logger.error('Error de base de datos', { error: error.message, stack: error.stack });

    if (error.code === '23505') { // Duplicate key
      return { message: 'El registro ya existe', statusCode: 409 };
    }
    if (error.code === '23503') { // Foreign key violation
      return { message: 'Referencia inválida', statusCode: 400 };
    }
    if (error.code === '23514') { // Check violation
      return { message: 'Datos inválidos', statusCode: 400 };
    }

    return { message: 'Error interno del servidor', statusCode: 500 };
  }

  /**
   * Maneja errores de validación
   */
  static handleValidationError(error) {
    const errors = {};

    if (error.details) {
      error.details.forEach(detail => {
        const field = detail.path.join('.');
        errors[field] = detail.message;
      });
    }

    return { message: 'Errores de validación', errors, statusCode: 400 };
  }
}

module.exports = ErrorHelper;
