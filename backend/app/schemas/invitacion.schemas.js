/**
 * @fileoverview Schemas Joi para Invitaciones
 * @description Validación de datos para endpoints de invitaciones
 * @version 1.0.0
 * Nov 2025 - Sistema de Invitaciones Profesional-Usuario
 */

const Joi = require('joi');

const invitacionSchemas = {

    /**
     * POST /invitaciones - Crear invitación
     */
    crear: Joi.object({
        body: Joi.object({
            profesional_id: Joi.number()
                .integer()
                .positive()
                .required()
                .messages({
                    'number.base': 'profesional_id debe ser un número',
                    'any.required': 'profesional_id es requerido'
                }),

            email: Joi.string()
                .email()
                .max(150)
                .required()
                .messages({
                    'string.email': 'Email inválido',
                    'any.required': 'Email es requerido'
                }),

            nombre_sugerido: Joi.string()
                .min(2)
                .max(150)
                .optional()
                .messages({
                    'string.min': 'Nombre debe tener al menos 2 caracteres'
                }),

            // Dic 2025: Rol a asignar al usuario
            rol: Joi.string()
                .valid('empleado', 'propietario', 'admin')
                .default('empleado')
                .optional()
                .messages({
                    'any.only': 'Rol inválido. Valores permitidos: empleado, propietario, admin'
                })
        }),
        query: Joi.object(),
        params: Joi.object()
    }),

    /**
     * GET /invitaciones/validar/:token - Validar token
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
                    'string.length': 'Token inválido',
                    'string.hex': 'Token inválido',
                    'any.required': 'Token es requerido'
                })
        })
    }),

    /**
     * POST /invitaciones/aceptar/:token - Aceptar invitación
     */
    aceptar: Joi.object({
        body: Joi.object({
            nombre: Joi.string()
                .min(2)
                .max(150)
                .required()
                .messages({
                    'string.min': 'Nombre debe tener al menos 2 caracteres',
                    'any.required': 'Nombre es requerido'
                }),

            apellidos: Joi.string()
                .min(2)
                .max(150)
                .optional()
                .allow('', null),

            password: Joi.string()
                .min(8)
                .max(100)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .required()
                .messages({
                    'string.min': 'La contraseña debe tener al menos 8 caracteres',
                    'string.pattern.base': 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
                    'any.required': 'Contraseña es requerida'
                })
        }),
        query: Joi.object(),
        params: Joi.object({
            token: Joi.string()
                .length(64)
                .hex()
                .required()
        })
    }),

    /**
     * POST /invitaciones/:id/reenviar - Reenviar invitación
     */
    reenviar: Joi.object({
        body: Joi.object(),
        query: Joi.object(),
        params: Joi.object({
            id: Joi.number()
                .integer()
                .positive()
                .required()
        })
    }),

    /**
     * DELETE /invitaciones/:id - Cancelar invitación
     */
    cancelar: Joi.object({
        body: Joi.object(),
        query: Joi.object(),
        params: Joi.object({
            id: Joi.number()
                .integer()
                .positive()
                .required()
        })
    }),

    /**
     * GET /invitaciones - Listar invitaciones
     */
    listar: Joi.object({
        body: Joi.object(),
        query: Joi.object({
            estado: Joi.string()
                .valid('pendiente', 'aceptada', 'expirada', 'cancelada', 'reenviada')
                .optional()
        }),
        params: Joi.object()
    }),

    /**
     * GET /invitaciones/profesional/:profesionalId
     */
    obtenerPorProfesional: Joi.object({
        body: Joi.object(),
        query: Joi.object(),
        params: Joi.object({
            profesionalId: Joi.number()
                .integer()
                .positive()
                .required()
        })
    })
};

module.exports = invitacionSchemas;
