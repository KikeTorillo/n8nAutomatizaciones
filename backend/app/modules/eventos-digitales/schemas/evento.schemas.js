/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - EVENTOS DIGITALES
 * ====================================================================
 * Schemas Joi para validación de requests del módulo eventos-digitales.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const eventosSchemas = {
    // ========================================================================
    // EVENTOS
    // ========================================================================

    /**
     * Crear evento
     * POST /api/v1/eventos-digitales/eventos
     */
    crearEvento: {
        body: Joi.object({
            plantilla_id: Joi.number().integer().positive().optional().allow(null),

            nombre: Joi.string().min(3).max(200).required().messages({
                'any.required': 'El nombre del evento es requerido',
                'string.min': 'El nombre debe tener al menos 3 caracteres',
                'string.max': 'El nombre no puede exceder 200 caracteres'
            }),

            tipo: Joi.string()
                .valid('boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'otro')
                .required()
                .messages({
                    'any.required': 'El tipo de evento es requerido',
                    'any.only': 'Tipo inválido. Valores permitidos: boda, xv_anos, bautizo, cumpleanos, corporativo, otro'
                }),

            descripcion: Joi.string().max(2000).optional().allow(null, ''),

            fecha_evento: Joi.date().iso().greater('now').required().messages({
                'any.required': 'La fecha del evento es requerida',
                'date.greater': 'La fecha del evento debe ser futura'
            }),

            hora_evento: Joi.string()
                .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
                .optional()
                .allow(null)
                .messages({
                    'string.pattern.base': 'Formato de hora inválido (HH:mm)'
                }),

            fecha_fin_evento: Joi.date().iso().min(Joi.ref('fecha_evento')).optional().allow(null),

            fecha_limite_rsvp: Joi.date().iso().max(Joi.ref('fecha_evento')).optional().allow(null),

            protagonistas: Joi.array().items(
                Joi.object({
                    nombre: Joi.string().max(100).required(),
                    rol: Joi.string().max(50).optional()
                })
            ).max(10).optional(),

            portada_url: Joi.string().uri().max(500).optional().allow(null, ''),

            galeria_urls: Joi.array().items(Joi.string().uri()).max(50).optional(),

            configuracion: Joi.object({
                mostrar_contador: Joi.boolean().optional(),
                mostrar_mapa: Joi.boolean().optional(),
                mostrar_ubicaciones: Joi.boolean().optional(),
                mostrar_mesa_regalos: Joi.boolean().optional(),
                mostrar_felicitaciones: Joi.boolean().optional(),
                permitir_felicitaciones: Joi.boolean().optional(),
                permitir_acompanantes: Joi.boolean().optional(),
                mostrar_qr_invitado: Joi.boolean().optional(),
                habilitar_seating_chart: Joi.boolean().optional(),
                mensaje_bienvenida: Joi.string().max(500).optional().allow(null, ''),
                mensaje_confirmacion: Joi.string().max(500).optional().allow(null, '')
            }).optional()
        })
    },

    /**
     * Actualizar evento
     * PUT /api/v1/eventos-digitales/eventos/:id
     */
    actualizarEvento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            plantilla_id: Joi.number().integer().positive().optional().allow(null),
            nombre: Joi.string().min(3).max(200).optional(),
            descripcion: Joi.string().max(2000).optional().allow(null, ''),
            fecha_evento: Joi.date().iso().optional(),
            hora_evento: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(null),
            fecha_fin_evento: Joi.date().iso().optional().allow(null),
            fecha_limite_rsvp: Joi.date().iso().optional().allow(null),
            protagonistas: Joi.array().items(Joi.object({
                nombre: Joi.string().max(100).required(),
                rol: Joi.string().max(50).optional()
            })).max(10).optional(),
            portada_url: Joi.string().uri().max(500).optional().allow(null, ''),
            galeria_urls: Joi.array().items(Joi.string().uri()).max(50).optional(),
            configuracion: Joi.object().optional()
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    /**
     * Obtener evento por ID
     * GET /api/v1/eventos-digitales/eventos/:id
     */
    obtenerEvento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Listar eventos
     * GET /api/v1/eventos-digitales/eventos
     */
    listarEventos: {
        query: Joi.object({
            tipo: Joi.string().valid('boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'otro').optional(),
            estado: Joi.string().valid('borrador', 'publicado', 'finalizado', 'cancelado').optional(),
            fecha_desde: Joi.date().iso().optional(),
            fecha_hasta: Joi.date().iso().optional(),
            pagina: Joi.number().integer().min(1).optional().default(1),
            limite: Joi.number().integer().min(1).max(100).optional().default(20)
        })
    },

    /**
     * Publicar evento
     * POST /api/v1/eventos-digitales/eventos/:id/publicar
     */
    publicarEvento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Eliminar evento
     * DELETE /api/v1/eventos-digitales/eventos/:id
     */
    eliminarEvento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Estadísticas del evento
     * GET /api/v1/eventos-digitales/eventos/:id/estadisticas
     */
    estadisticasEvento: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    }
};

module.exports = eventosSchemas;
