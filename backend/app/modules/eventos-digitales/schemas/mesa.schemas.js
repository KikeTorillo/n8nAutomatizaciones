/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - MESAS (Seating Chart)
 * ====================================================================
 * Schemas Joi para validación de requests de mesas.
 *
 * Fecha creación: 8 Diciembre 2025
 */

const Joi = require('joi');

const mesasSchemas = {

    /**
     * Crear mesa
     * POST /api/v1/eventos-digitales/eventos/:eventoId/mesas
     */
    crearMesa: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            nombre: Joi.string().min(1).max(50).required().messages({
                'any.required': 'El nombre de la mesa es requerido',
                'string.max': 'El nombre no puede exceder 50 caracteres'
            }),

            numero: Joi.number().integer().min(1).optional().allow(null),

            tipo: Joi.string().valid('redonda', 'cuadrada', 'rectangular').default('redonda').messages({
                'any.only': 'Tipo de mesa inválido. Valores permitidos: redonda, cuadrada, rectangular'
            }),

            posicion_x: Joi.number().min(0).max(100).default(50).messages({
                'number.min': 'Posición X debe ser entre 0 y 100',
                'number.max': 'Posición X debe ser entre 0 y 100'
            }),

            posicion_y: Joi.number().min(0).max(100).default(50).messages({
                'number.min': 'Posición Y debe ser entre 0 y 100',
                'number.max': 'Posición Y debe ser entre 0 y 100'
            }),

            rotacion: Joi.number().integer().min(0).max(360).default(0),

            capacidad: Joi.number().integer().min(1).max(50).default(8).messages({
                'number.min': 'La capacidad mínima es 1',
                'number.max': 'La capacidad máxima es 50'
            })
        })
    },

    /**
     * Actualizar mesa
     * PUT /api/v1/eventos-digitales/eventos/:eventoId/mesas/:mesaId
     */
    actualizarMesa: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required(),
            mesaId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            nombre: Joi.string().min(1).max(50).optional(),
            numero: Joi.number().integer().min(1).optional().allow(null),
            tipo: Joi.string().valid('redonda', 'cuadrada', 'rectangular').optional(),
            posicion_x: Joi.number().min(0).max(100).optional(),
            posicion_y: Joi.number().min(0).max(100).optional(),
            rotacion: Joi.number().integer().min(0).max(360).optional(),
            capacidad: Joi.number().integer().min(1).max(50).optional()
        }).min(1).messages({
            'object.min': 'Se requiere al menos un campo para actualizar'
        })
    },

    /**
     * Actualizar posiciones de múltiples mesas (batch)
     * PATCH /api/v1/eventos-digitales/eventos/:eventoId/mesas/posiciones
     */
    actualizarPosiciones: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            posiciones: Joi.array().items(
                Joi.object({
                    id: Joi.number().integer().positive().required(),
                    posicion_x: Joi.number().min(0).max(100).required(),
                    posicion_y: Joi.number().min(0).max(100).required(),
                    rotacion: Joi.number().integer().min(0).max(360).optional()
                })
            ).min(1).max(100).required().messages({
                'array.min': 'Se requiere al menos una posición',
                'array.max': 'Máximo 100 posiciones por request'
            })
        })
    },

    /**
     * Obtener mesa por ID
     * GET /api/v1/eventos-digitales/mesas/:mesaId
     */
    obtenerMesa: {
        params: Joi.object({
            mesaId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Listar mesas del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/mesas
     */
    listarMesas: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Eliminar mesa
     * DELETE /api/v1/eventos-digitales/mesas/:mesaId
     */
    eliminarMesa: {
        params: Joi.object({
            mesaId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Asignar invitado a mesa
     * POST /api/v1/eventos-digitales/eventos/:eventoId/mesas/:mesaId/asignar
     */
    asignarInvitado: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required(),
            mesaId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            invitado_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID del invitado es requerido'
            })
        })
    },

    /**
     * Desasignar invitado de mesa
     * DELETE /api/v1/eventos-digitales/invitados/:invitadoId/mesa
     */
    desasignarInvitado: {
        params: Joi.object({
            invitadoId: Joi.number().integer().positive().required()
        })
    },

    /**
     * Obtener estadísticas de ocupación
     * GET /api/v1/eventos-digitales/eventos/:eventoId/mesas/estadisticas
     */
    obtenerEstadisticas: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        })
    }
};

module.exports = mesasSchemas;
