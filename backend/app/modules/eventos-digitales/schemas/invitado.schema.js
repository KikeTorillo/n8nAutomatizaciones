/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - INVITADOS
 * ====================================================================
 * Schemas Joi para validación de requests de invitados.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const invitadosSchemas = {
    // ========================================================================
    // INVITADOS
    // ========================================================================

    /**
     * Crear invitado
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    crearInvitado: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            nombre: Joi.string().min(2).max(200).required().messages({
                'any.required': 'El nombre es requerido',
                'string.min': 'El nombre debe tener al menos 2 caracteres'
            }),

            email: Joi.string().email().max(255).optional().allow(null, '').messages({
                'string.email': 'Email inválido'
            }),

            telefono: Joi.string().max(20).optional().allow(null, ''),

            grupo_familiar: Joi.string().max(100).optional().allow(null, ''),

            etiquetas: Joi.array().items(Joi.string().max(50)).max(10).optional(),

            max_acompanantes: Joi.number().integer().min(0).max(20).optional().default(0).messages({
                'number.max': 'Máximo 20 acompañantes permitidos'
            })
        })
    },

    /**
     * Importar invitados (CSV)
     * POST /api/v1/eventos-digitales/eventos/:eventoId/invitados/importar
     */
    importarInvitados: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            invitados: Joi.array().items(
                Joi.object({
                    nombre: Joi.string().min(2).max(200).required(),
                    email: Joi.string().email().max(255).optional().allow(null, ''),
                    telefono: Joi.string().max(20).optional().allow(null, ''),
                    grupo_familiar: Joi.string().max(100).optional().allow(null, ''),
                    etiquetas: Joi.array().items(Joi.string().max(50)).optional(),
                    max_acompanantes: Joi.number().integer().min(0).max(20).optional()
                })
            ).min(1).max(500).required().messages({
                'array.min': 'Debe incluir al menos un invitado',
                'array.max': 'Máximo 500 invitados por importación'
            })
        })
    },

    /**
     * Actualizar invitado
     * PUT /api/v1/eventos-digitales/invitados/:id
     */
    actualizarInvitado: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            nombre: Joi.string().min(2).max(200).optional(),
            email: Joi.string().email().max(255).optional().allow(null, ''),
            telefono: Joi.string().max(20).optional().allow(null, ''),
            grupo_familiar: Joi.string().max(100).optional().allow(null, ''),
            etiquetas: Joi.array().items(Joi.string().max(50)).max(10).optional(),
            max_acompanantes: Joi.number().integer().min(0).max(20).optional()
        }).min(1)
    },

    /**
     * Listar invitados del evento
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados
     */
    listarInvitados: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            estado_rsvp: Joi.string().valid('pendiente', 'confirmado', 'declinado').optional(),
            grupo_familiar: Joi.string().max(100).optional(),
            etiqueta: Joi.string().max(50).optional(),
            buscar: Joi.string().max(100).optional(),
            pagina: Joi.number().integer().min(1).optional().default(1),
            limite: Joi.number().integer().min(1).max(200).optional().default(50)
        })
    },

    /**
     * Eliminar invitado
     * DELETE /api/v1/eventos-digitales/invitados/:id
     */
    eliminarInvitado: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Exportar invitados
     * GET /api/v1/eventos-digitales/eventos/:eventoId/invitados/exportar
     */
    exportarInvitados: {
        params: Joi.object({
            eventoId: Joi.number().integer().positive().required()
        })
    }
};

module.exports = invitadosSchemas;
