/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - RUTAS PÚBLICAS
 * ====================================================================
 * Schemas Joi para validación de requests públicos (sin autenticación).
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const publicSchemas = {
    // ========================================================================
    // EVENTO PÚBLICO
    // ========================================================================

    /**
     * Obtener evento público por slug
     * GET /api/v1/public/evento/:slug
     */
    obtenerEventoPublico: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required().messages({
                'any.required': 'El slug es requerido',
                'string.min': 'Slug inválido'
            })
        })
    },

    /**
     * Obtener invitación personalizada
     * GET /api/v1/public/evento/:slug/:token
     */
    obtenerInvitacion: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required(),
            token: Joi.string().length(64).required().messages({
                'string.length': 'Token inválido'
            })
        })
    },

    /**
     * Confirmar RSVP
     * POST /api/v1/public/evento/:slug/:token/rsvp
     */
    confirmarRSVP: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required(),
            token: Joi.string().length(64).required()
        }),
        body: Joi.object({
            asistira: Joi.boolean().required().messages({
                'any.required': 'Debe indicar si asistirá o no'
            }),

            num_asistentes: Joi.number().integer().min(1).max(21).optional().default(1).messages({
                'number.min': 'Mínimo 1 asistente',
                'number.max': 'Máximo 21 asistentes'
            }),

            nombres_acompanantes: Joi.array()
                .items(Joi.string().max(100))
                .max(20)
                .optional(),

            mensaje: Joi.string().max(500).optional().allow(null, ''),

            restricciones_dieteticas: Joi.string().max(500).optional().allow(null, ''),

            via: Joi.string().valid('web', 'whatsapp', 'qr').optional().default('web')
        })
    },

    // ========================================================================
    // MESA DE REGALOS PÚBLICA
    // ========================================================================

    /**
     * Obtener mesa de regalos
     * GET /api/v1/public/evento/:slug/mesa-regalos
     */
    obtenerMesaRegalos: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required()
        })
    },

    /**
     * Marcar regalo como comprado
     * POST /api/v1/public/evento/:slug/mesa-regalos/:regaloId/comprar
     */
    comprarRegalo: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required(),
            regaloId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            comprado_por: Joi.string().max(200).required().messages({
                'any.required': 'Debe indicar quién compra el regalo'
            }),
            mensaje: Joi.string().max(500).optional().allow(null, '')
        })
    },

    // ========================================================================
    // FELICITACIONES PÚBLICAS
    // ========================================================================

    /**
     * Obtener felicitaciones del evento
     * GET /api/v1/public/evento/:slug/felicitaciones
     */
    obtenerFelicitaciones: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required()
        }),
        query: Joi.object({
            pagina: Joi.number().integer().min(1).optional().default(1),
            limite: Joi.number().integer().min(1).max(50).optional().default(20)
        })
    },

    /**
     * Crear felicitación
     * POST /api/v1/public/evento/:slug/:token/felicitacion
     */
    crearFelicitacion: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required(),
            token: Joi.string().length(64).required()
        }),
        body: Joi.object({
            mensaje: Joi.string().min(5).max(1000).required().messages({
                'any.required': 'El mensaje es requerido',
                'string.min': 'El mensaje debe tener al menos 5 caracteres',
                'string.max': 'El mensaje no puede exceder 1000 caracteres'
            })
        })
    }
};

module.exports = publicSchemas;
