/**
 * Middleware de Correlation ID para trazabilidad de requests
 *
 * Genera un ID único para cada request que puede usarse para rastrear
 * una solicitud a través de todos los logs y servicios.
 *
 * @module middleware/correlationId
 */

const { v4: uuidv4 } = require('uuid');
const { AsyncLocalStorage } = require('async_hooks');

/**
 * Almacenamiento de contexto asíncrono para el correlationId
 * Permite acceder al correlationId desde cualquier parte del código
 * sin necesidad de pasar el request como parámetro
 */
const correlationStorage = new AsyncLocalStorage();

/**
 * Obtiene el correlationId del contexto actual
 * @returns {string|undefined} El correlationId si existe
 */
const getCorrelationId = () => {
  const store = correlationStorage.getStore();
  return store?.correlationId;
};

/**
 * Middleware que genera y propaga el correlationId
 *
 * - Si el request incluye 'x-correlation-id', lo usa
 * - Si no, genera uno nuevo con uuid v4
 * - Lo añade al response header para que el cliente lo pueda usar
 * - Lo almacena en AsyncLocalStorage para acceso global
 *
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 * @param {import('express').NextFunction} next - Función next
 */
const correlationMiddleware = (req, res, next) => {
  // Obtener o generar correlationId
  const correlationId = req.headers['x-correlation-id'] || uuidv4();

  // Añadir al response header
  res.setHeader('x-correlation-id', correlationId);

  // Añadir al request para acceso directo
  req.correlationId = correlationId;

  // Ejecutar el resto del request dentro del contexto del correlationId
  correlationStorage.run({ correlationId }, () => {
    next();
  });
};

module.exports = {
  correlationMiddleware,
  correlationStorage,
  getCorrelationId
};
