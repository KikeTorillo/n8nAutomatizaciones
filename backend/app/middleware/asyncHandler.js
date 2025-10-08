/**
 * @fileoverview Middleware AsyncHandler para manejo automático de errores
 * @description Elimina la necesidad de try/catch en cada controller
 * @version 1.0.0
 */

const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

/**
 * Wrapper para funciones async que maneja automáticamente errores
 * @param {Function} fn - Función async del controller
 * @returns {Function} - Express middleware
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch((error) => {
                // Log del error
                logger.error('Error en controller', {
                    error: error.message,
                    stack: error.stack,
                    method: req.method,
                    path: req.path,
                    userId: req.user?.id
                });

                // Determinar código de estado
                let statusCode = 500;
                let message = error.message || 'Error interno del servidor';

                // Errores de validación y contraseña
                if (error.name === 'ValidationError' ||
                    error.message.includes('Contraseña anterior incorrecta') ||
                    error.message.includes('contraseña débil') ||
                    error.message.includes('contraseña debe') ||
                    error.message.includes('token de recuperación') ||
                    error.message.includes('Código de recuperación')
                ) {
                    statusCode = 400;
                }
                // Errores de autenticación
                else if (
                    error.message.includes('no autorizado') ||
                    error.message.includes('Credenciales inválidas') ||
                    error.message.includes('Token de refresco inválido') ||
                    error.message.toLowerCase().includes('token')
                ) {
                    statusCode = 401;
                }
                // Errores de permisos
                else if (error.message.includes('permisos') || error.message.includes('Forbidden')) {
                    statusCode = 403;
                }
                // Recursos no encontrados
                else if (error.message.includes('no encontrado') || error.message.includes('no encontrada')) {
                    statusCode = 404;
                }
                // Conflictos (duplicados, lock conflicts, etc)
                else if (
                    error.message.includes('ya existe') ||
                    error.message.includes('duplicado') ||
                    error.message.includes('reservado') ||
                    error.message.includes('en uso por otro') ||
                    error.code === '23505' ||  // Unique violation
                    error.code === '55P03'     // Lock not available (NOWAIT)
                ) {
                    statusCode = 409;
                }
                // Usuario bloqueado
                else if (error.message.includes('bloqueado')) {
                    statusCode = 423;
                }

                return ResponseHelper.error(res, message, statusCode);
            });
    };
};

module.exports = asyncHandler;
