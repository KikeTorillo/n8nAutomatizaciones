/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - PERMISOS
 * ====================================================================
 *
 * Schemas Joi para validación de endpoints del sistema de permisos.
 *
 * @version 1.0.0
 * @date Diciembre 2025
 * ====================================================================
 */

const Joi = require('joi');

/**
 * Schema para asignar un permiso a un rol
 */
const asignarPermisoRolSchema = {
    body: Joi.object({
        permisoId: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'El ID del permiso debe ser un número',
                'number.positive': 'El ID del permiso debe ser positivo',
                'any.required': 'El ID del permiso es requerido'
            }),
        valor: Joi.alternatives().try(
            Joi.boolean(),
            Joi.number(),
            Joi.string(),
            Joi.array()
        ).required()
            .messages({
                'any.required': 'El valor del permiso es requerido'
            })
    }),
    params: Joi.object({
        rol: Joi.string().valid('admin', 'propietario', 'empleado', 'bot', 'recepcionista').required()
            .messages({
                'any.only': 'Rol no válido',
                'any.required': 'El rol es requerido'
            })
    })
};

/**
 * Schema para actualizar múltiples permisos de un rol
 */
const actualizarPermisosRolSchema = {
    body: Joi.object({
        permisos: Joi.array().items(
            Joi.object({
                permisoId: Joi.number().integer().positive().required(),
                valor: Joi.alternatives().try(
                    Joi.boolean(),
                    Joi.number(),
                    Joi.string(),
                    Joi.array()
                ).required()
            })
        ).min(1).required()
            .messages({
                'array.min': 'Debe incluir al menos un permiso',
                'any.required': 'El array de permisos es requerido'
            })
    }),
    params: Joi.object({
        rol: Joi.string().valid('admin', 'propietario', 'empleado', 'bot', 'recepcionista').required()
            .messages({
                'any.only': 'Rol no válido',
                'any.required': 'El rol es requerido'
            })
    })
};

/**
 * Schema para asignar override de permiso a usuario/sucursal
 */
const asignarPermisoUsuarioSucursalSchema = {
    body: Joi.object({
        permisoId: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'El ID del permiso debe ser un número',
                'number.positive': 'El ID del permiso debe ser positivo',
                'any.required': 'El ID del permiso es requerido'
            }),
        valor: Joi.alternatives().try(
            Joi.boolean(),
            Joi.number(),
            Joi.string(),
            Joi.array()
        ).required()
            .messages({
                'any.required': 'El valor del permiso es requerido'
            }),
        motivo: Joi.string().max(500).allow(null, '')
            .messages({
                'string.max': 'El motivo no puede exceder 500 caracteres'
            }),
        fechaInicio: Joi.date().iso().allow(null)
            .messages({
                'date.format': 'La fecha de inicio debe estar en formato ISO'
            }),
        fechaFin: Joi.date().iso().min(Joi.ref('fechaInicio')).allow(null)
            .messages({
                'date.format': 'La fecha de fin debe estar en formato ISO',
                'date.min': 'La fecha de fin debe ser posterior a la fecha de inicio'
            })
    }),
    params: Joi.object({
        usuarioId: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'El ID del usuario debe ser un número',
                'number.positive': 'El ID del usuario debe ser positivo',
                'any.required': 'El ID del usuario es requerido'
            }),
        sucursalId: Joi.number().integer().positive().required()
            .messages({
                'number.base': 'El ID de la sucursal debe ser un número',
                'number.positive': 'El ID de la sucursal debe ser positivo',
                'any.required': 'El ID de la sucursal es requerido'
            })
    })
};

module.exports = {
    asignarPermisoRolSchema,
    actualizarPermisosRolSchema,
    asignarPermisoUsuarioSucursalSchema
};
