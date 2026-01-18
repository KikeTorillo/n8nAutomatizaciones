/**
 * Helper para manejo de errores
 * Centraliza errores PostgreSQL y métodos throw para controllers
 *
 * @module utils/helpers/ErrorHelper
 *
 * @example
 * const { ErrorHelper } = require('../utils/helpers');
 *
 * // Manejo de errores de BD
 * const { message, statusCode } = ErrorHelper.handleDatabaseError(error);
 *
 * // Métodos throw (lanzan excepción que asyncHandler captura)
 * ErrorHelper.throwIfNotFound(recurso, 'Producto');
 * ErrorHelper.throwValidation('Campo requerido', 'nombre');
 * ErrorHelper.throwConflict('El SKU ya existe');
 */

const logger = require('../../utils/logger');

/**
 * Códigos de error PostgreSQL con mensajes descriptivos
 * Ref: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_CODES = {
  // Clase 23: Integrity Constraint Violation
  '23502': { message: 'Campo requerido no puede ser nulo', statusCode: 400 },
  '23503': { message: 'Referencia inválida', statusCode: 400 },
  '23505': { message: 'El registro ya existe', statusCode: 409 },
  '23514': { message: 'Datos inválidos', statusCode: 400 },

  // Clase 40: Transaction Rollback
  '40001': { message: 'Conflicto de transacción, intente nuevamente', statusCode: 409 },
  '40P01': { message: 'Deadlock detectado, intente nuevamente', statusCode: 409 },

  // Clase 53: Insufficient Resources
  '53300': { message: 'Demasiadas conexiones', statusCode: 503 },

  // Clase 57: Operator Intervention
  '57014': { message: 'Query cancelada por timeout', statusCode: 408 }
};

/**
 * Error custom para API responses
 * Permite lanzar errores con statusCode específico
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, field = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.field = field;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHelper {
  /**
   * Maneja errores de base de datos
   * @param {Error} error - Error de PostgreSQL
   * @returns {{ message: string, statusCode: number, details?: string }}
   */
  static handleDatabaseError(error) {
    logger.error('Error de base de datos', {
      error: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });

    // Buscar en códigos conocidos
    const known = PG_ERROR_CODES[error.code];
    if (known) {
      return {
        ...known,
        details: error.detail || null
      };
    }

    // Error genérico
    return { message: 'Error interno del servidor', statusCode: 500 };
  }

  /**
   * Maneja errores de validación Joi
   * @param {Error} error - Error de Joi validation
   * @returns {{ message: string, errors: Object, statusCode: number }}
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

  /**
   * Lanza 404 si el recurso no existe
   * @param {*} resource - Recurso a verificar
   * @param {string} resourceName - Nombre del recurso para el mensaje
   * @throws {ApiError} 404 si resource es falsy
   *
   * @example
   * const producto = await ProductoModel.buscarPorId(id);
   * ErrorHelper.throwIfNotFound(producto, 'Producto');
   */
  static throwIfNotFound(resource, resourceName = 'Recurso') {
    if (!resource) {
      throw new ApiError(`${resourceName} no encontrado`, 404);
    }
    return resource;
  }

  /**
   * Lanza error de validación (400)
   * @param {string} message - Mensaje de error
   * @param {string} [field] - Campo que causó el error
   * @throws {ApiError} 400
   *
   * @example
   * ErrorHelper.throwValidation('El nombre es requerido', 'nombre');
   */
  static throwValidation(message, field = null) {
    throw new ApiError(message, 400, field);
  }

  /**
   * Lanza error de conflicto (409)
   * Para registros duplicados o conflictos de estado
   * @param {string} message - Mensaje de error
   * @throws {ApiError} 409
   *
   * @example
   * ErrorHelper.throwConflict('El SKU ya está registrado');
   */
  static throwConflict(message) {
    throw new ApiError(message, 409);
  }

  /**
   * Lanza error de autorización (403)
   * @param {string} [message] - Mensaje de error
   * @throws {ApiError} 403
   */
  static throwForbidden(message = 'No tiene permisos para esta acción') {
    throw new ApiError(message, 403);
  }

  /**
   * Lanza error no autorizado (401)
   * @param {string} [message] - Mensaje de error
   * @throws {ApiError} 401
   */
  static throwUnauthorized(message = 'No autenticado') {
    throw new ApiError(message, 401);
  }

  /**
   * Lanza error de servidor (500)
   * @param {string} [message] - Mensaje de error
   * @throws {ApiError} 500
   */
  static throwInternal(message = 'Error interno del servidor') {
    throw new ApiError(message, 500);
  }

  /**
   * Verifica si un error es de tipo ApiError
   * @param {Error} error
   * @returns {boolean}
   */
  static isApiError(error) {
    return error instanceof ApiError;
  }

  /**
   * Extrae info de error para response
   * @param {Error} error
   * @returns {{ message: string, statusCode: number, field?: string }}
   */
  static toResponse(error) {
    if (error instanceof ApiError) {
      return {
        message: error.message,
        statusCode: error.statusCode,
        ...(error.field && { field: error.field }),
        ...(error.details && { details: error.details })
      };
    }

    // Error de PostgreSQL
    if (error.code && typeof error.code === 'string' && error.code.match(/^\d{5}$/)) {
      return this.handleDatabaseError(error);
    }

    // Error genérico
    return { message: error.message || 'Error interno', statusCode: 500 };
  }
}

// Exportar también ApiError para uso directo
ErrorHelper.ApiError = ApiError;
ErrorHelper.PG_ERROR_CODES = PG_ERROR_CODES;

module.exports = ErrorHelper;
