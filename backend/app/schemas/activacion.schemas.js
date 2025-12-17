/**
 * @fileoverview Schemas Joi para Activación de Cuentas
 * @description Validación de datos para endpoints de registro y activación
 * @version 1.0.0
 * Nov 2025 - Fase 2: Onboarding Simplificado
 *
 * Basado en: invitacion.schemas.js
 */

const Joi = require('joi');

const activacionSchemas = {

    /**
     * POST /auth/registrar - Registro simplificado (solo nombre + email)
     * Dic 2025 - Flujo unificado: igual que Google OAuth
     * Crea activación pendiente + envía email (sin crear organización)
     */
    registrar: Joi.object({
        body: Joi.object({
            nombre: Joi.string()
                .min(2)
                .max(150)
                .required()
                .messages({
                    'string.min': 'El nombre debe tener al menos 2 caracteres',
                    'string.max': 'El nombre no puede exceder 150 caracteres',
                    'any.required': 'El nombre es requerido'
                }),

            email: Joi.string()
                .email()
                .max(150)
                .required()
                .messages({
                    'string.email': 'El email no es válido',
                    'string.max': 'El email no puede exceder 150 caracteres',
                    'any.required': 'El email es requerido'
                })
        }),
        query: Joi.object(),
        params: Joi.object()
    }),

    /**
     * GET /auth/activar/:token - Validar token de activación
     */
    validarToken: Joi.object({
        body: Joi.object(),
        query: Joi.object(),
        params: Joi.object({
            token: Joi.string()
                .length(64)
                .hex()
                .required()
                .messages({
                    'string.length': 'Enlace de activación inválido',
                    'string.hex': 'Enlace de activación inválido',
                    'any.required': 'Token es requerido'
                })
        })
    }),

    /**
     * POST /auth/activar/:token - Activar cuenta con password
     */
    activar: Joi.object({
        body: Joi.object({
            password: Joi.string()
                .min(8)
                .max(100)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .required()
                .messages({
                    'string.min': 'La contraseña debe tener al menos 8 caracteres',
                    'string.max': 'La contraseña no puede exceder 100 caracteres',
                    'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
                    'any.required': 'La contraseña es requerida'
                }),

            password_confirm: Joi.string()
                .valid(Joi.ref('password'))
                .required()
                .messages({
                    'any.only': 'Las contraseñas no coinciden',
                    'any.required': 'Debe confirmar la contraseña'
                })
        }),
        query: Joi.object(),
        params: Joi.object({
            token: Joi.string()
                .length(64)
                .hex()
                .required()
                .messages({
                    'string.length': 'Enlace de activación inválido',
                    'string.hex': 'Enlace de activación inválido'
                })
        })
    }),

    /**
     * POST /auth/reenviar-activacion - Reenviar email de activación
     */
    reenviar: Joi.object({
        body: Joi.object({
            email: Joi.string()
                .email()
                .max(150)
                .required()
                .messages({
                    'string.email': 'El email no es válido',
                    'any.required': 'El email es requerido'
                })
        }),
        query: Joi.object(),
        params: Joi.object()
    }),

    // ====================================================================
    // MAGIC LINKS - Dic 2025
    // ====================================================================

    /**
     * POST /auth/magic-link - Solicitar magic link
     */
    solicitarMagicLink: Joi.object({
        body: Joi.object({
            email: Joi.string()
                .email()
                .max(150)
                .required()
                .messages({
                    'string.email': 'El email no es válido',
                    'any.required': 'El email es requerido'
                })
        }),
        query: Joi.object(),
        params: Joi.object()
    }),

    /**
     * GET /auth/magic-link/verify/:token - Verificar magic link
     */
    verificarMagicLink: Joi.object({
        body: Joi.object(),
        query: Joi.object(),
        params: Joi.object({
            token: Joi.string()
                .length(64)
                .hex()
                .required()
                .messages({
                    'string.length': 'Enlace inválido',
                    'string.hex': 'Enlace inválido',
                    'any.required': 'Token es requerido'
                })
        })
    }),

    // ====================================================================
    // OAUTH GOOGLE - Dic 2025
    // ====================================================================

    /**
     * POST /auth/oauth/google - Login con Google
     */
    oauthGoogle: Joi.object({
        body: Joi.object({
            credential: Joi.string()
                .required()
                .messages({
                    'any.required': 'Token de Google es requerido'
                })
        }),
        query: Joi.object(),
        params: Joi.object()
    }),

    // ====================================================================
    // ONBOARDING - Dic 2025
    // ====================================================================

    /**
     * POST /auth/onboarding/complete - Completar onboarding
     */
    onboardingComplete: Joi.object({
        body: Joi.object({
            nombre_negocio: Joi.string()
                .min(2)
                .max(150)
                .required()
                .messages({
                    'string.min': 'El nombre del negocio debe tener al menos 2 caracteres',
                    'string.max': 'El nombre del negocio no puede exceder 150 caracteres',
                    'any.required': 'El nombre del negocio es requerido'
                }),

            industria: Joi.string()
                .valid('barberia', 'salon_belleza', 'spa', 'consultorio_medico', 'clinica_dental', 'otro')
                .required()
                .messages({
                    'any.only': 'Debe seleccionar una industria válida',
                    'any.required': 'La industria es requerida'
                }),

            estado_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'Debe seleccionar un estado',
                    'any.required': 'El estado es requerido'
                }),

            ciudad_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'Debe seleccionar una ciudad',
                    'any.required': 'La ciudad es requerida'
                }),

            soy_profesional: Joi.boolean()
                .default(true),

            // Módulos seleccionados por el usuario (Dic 2025 - estilo Odoo)
            modulos: Joi.object().pattern(
                Joi.string().valid(
                    'agendamiento', 'inventario', 'pos', 'comisiones',
                    'contabilidad', 'marketplace', 'chatbots', 'eventos-digitales', 'website'
                ),
                Joi.boolean()
            ).default({})
        }),
        query: Joi.object(),
        params: Joi.object()
    })
};

module.exports = activacionSchemas;
