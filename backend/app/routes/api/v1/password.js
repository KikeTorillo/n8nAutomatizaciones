/**
 * @fileoverview Rutas de Gestión de Contraseñas para API SaaS
 * @description Define endpoints para recuperación y gestión de contraseñas
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const express = require('express');
const Joi = require('joi');
const AuthController = require('../../../controllers/auth.controller');
const middleware = require('../../../middleware');
const { validate, commonSchemas } = require('../../../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /api/v1/password/reset:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un token de recuperación al email del usuario
 *     tags: [Password]
 */
router.post('/reset',
    // Rate limiting estricto para prevenir spam
    middleware.rateLimiting.heavyOperationRateLimit,

    // Validaciones
    validate({
        body: Joi.object({
            email: commonSchemas.emailRequired,
            organizacion_id: commonSchemas.id.optional()
                .messages({
                    'number.base': 'ID de organización debe ser un número',
                    'number.positive': 'ID de organización debe ser positivo'
                })
        })
    }),

    AuthController.recuperarPassword
);

/**
 * @swagger
 * /api/v1/password/reset/{token}:
 *   post:
 *     summary: Confirmar reset de contraseña con token
 *     description: Establece nueva contraseña usando token de recuperación
 *     tags: [Password]
 */
router.post('/reset/:token',
    middleware.rateLimiting.heavyOperationRateLimit,

    validate({
        params: Joi.object({
            token: Joi.string().alphanum().length(64).required()
                .messages({
                    'string.alphanum': 'Token debe contener solo caracteres alfanuméricos',
                    'string.length': 'Token debe tener exactamente 64 caracteres'
                })
        }),
        body: Joi.object({
            passwordNueva: commonSchemas.password.required()
                .messages({
                    'any.required': 'Nueva contraseña es requerida'
                }),
            confirmarPassword: Joi.string().valid(Joi.ref('passwordNueva')).required()
                .messages({
                    'any.only': 'La confirmación debe coincidir con la nueva contraseña',
                    'any.required': 'Confirmación de contraseña es requerida'
                })
        })
    }),

    AuthController.confirmarResetPassword
);

/**
 * @swagger
 * /api/v1/password/validate-token/{token}:
 *   get:
 *     summary: Validar token de recuperación
 *     description: Verifica si un token de recuperación es válido y no ha expirado
 *     tags: [Password]
 */
router.get('/validate-token/:token',
    middleware.rateLimiting.apiRateLimit,

    validate({
        params: Joi.object({
            token: Joi.string().alphanum().length(64).required()
                .messages({
                    'string.alphanum': 'Token debe contener solo caracteres alfanuméricos',
                    'string.length': 'Token debe tener exactamente 64 caracteres'
                })
        })
    }),

    AuthController.validarTokenReset
);

/**
 * @swagger
 * /api/v1/password/strength:
 *   post:
 *     summary: Evaluar fortaleza de contraseña
 *     description: Analiza y puntúa la fortaleza de una contraseña
 *     tags: [Password]
 */
router.post('/strength',
    middleware.rateLimiting.apiRateLimit,

    validate({
        body: Joi.object({
            password: Joi.string().required().min(1).max(128)
                .messages({
                    'any.required': 'Contraseña es requerida para evaluar',
                    'string.max': 'Contraseña demasiado larga para evaluar'
                })
        })
    }),

    AuthController.evaluarFortalezaPassword
);

module.exports = router;