/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - MARKETPLACE
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo marketplace.
 *
 * ENDPOINTS (15 total):
 * • Perfiles (7): crear, actualizar, obtener, listar, buscar, activar, estadísticas
 * • Reseñas (4): crear, responder, moderar, listar
 * • Analytics (4): registrar, obtener, estadísticas, limpiar
 *
 * Fecha creación: 17 Noviembre 2025
 */

const Joi = require('joi');

const marketplaceSchemas = {
    // ========================================================================
    // PERFILES PÚBLICOS
    // ========================================================================

    /**
     * Schema para crear perfil de marketplace
     * POST /api/v1/marketplace/perfiles
     */
    crearPerfil: {
        body: Joi.object({
            // ========== OBLIGATORIOS ==========
            ciudad_id: Joi.number().integer().positive().required().messages({
                'any.required': 'La ciudad es requerida',
                'number.positive': 'El ID de ciudad debe ser positivo'
            }),

            descripcion_corta: Joi.string().max(200).required().messages({
                'any.required': 'La descripción corta es requerida',
                'string.max': 'La descripción corta no puede exceder 200 caracteres'
            }),

            // ========== OPCIONALES ==========
            estado_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.positive': 'El ID de estado debe ser positivo'
            }),

            pais_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.positive': 'El ID de país debe ser positivo'
            }),

            meta_titulo: Joi.string().max(70).optional().allow(null, '').messages({
                'string.max': 'El meta título no puede exceder 70 caracteres'
            }),

            meta_descripcion: Joi.string().max(160).optional().allow(null, '').messages({
                'string.max': 'La meta descripción no puede exceder 160 caracteres'
            }),

            descripcion_larga: Joi.string().optional().allow(null, ''),

            // Ubicación adicional
            codigo_postal: Joi.string().max(10).optional().allow(null, ''),
            direccion_completa: Joi.string().optional().allow(null, ''),
            latitud: Joi.number().min(-90).max(90).optional().allow(null),
            longitud: Joi.number().min(-180).max(180).optional().allow(null),

            // Contacto público
            telefono_publico: Joi.string().max(20).optional().allow(null, ''),
            email_publico: Joi.string().email().max(150).optional().allow(null, '').messages({
                'string.email': 'El email público debe ser válido'
            }),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, '').messages({
                'string.uri': 'El sitio web debe ser una URL válida'
            }),

            // Redes sociales
            instagram: Joi.string().max(100).optional().allow(null, ''),
            facebook: Joi.string().max(255).optional().allow(null, ''),
            tiktok: Joi.string().max(100).optional().allow(null, ''),

            // Galería
            logo_url: Joi.string().uri().max(500).optional().allow(null, '').messages({
                'string.uri': 'La URL del logo debe ser válida'
            }),
            portada_url: Joi.string().uri().max(500).optional().allow(null, '').messages({
                'string.uri': 'La URL de la portada debe ser válida'
            }),
            galeria_urls: Joi.array().items(Joi.string().uri()).max(10).optional().messages({
                'array.max': 'La galería no puede tener más de 10 imágenes'
            }),

            // Horarios de atención (JSONB)
            horarios_atencion: Joi.object().optional().allow(null)
        })
    },

    /**
     * Schema para actualizar perfil
     * PUT /api/v1/marketplace/perfiles/:id
     */
    actualizarPerfil: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID del perfil es requerido',
                'number.positive': 'El ID debe ser positivo'
            })
        }),
        body: Joi.object({
            ciudad_id: Joi.number().integer().positive().optional().allow(null),
            estado_id: Joi.number().integer().positive().optional().allow(null),
            pais_id: Joi.number().integer().positive().optional().allow(null),
            descripcion_corta: Joi.string().max(200).optional(),
            meta_titulo: Joi.string().max(70).optional().allow(null, ''),
            meta_descripcion: Joi.string().max(160).optional().allow(null, ''),
            descripcion_larga: Joi.string().optional().allow(null, ''),
            codigo_postal: Joi.string().max(10).optional().allow(null, ''),
            direccion_completa: Joi.string().optional().allow(null, ''),
            latitud: Joi.number().min(-90).max(90).optional().allow(null),
            longitud: Joi.number().min(-180).max(180).optional().allow(null),
            telefono_publico: Joi.string().max(20).optional().allow(null, ''),
            email_publico: Joi.string().email().max(150).optional().allow(null, ''),
            sitio_web: Joi.string().uri().max(255).optional().allow(null, ''),
            instagram: Joi.string().max(100).optional().allow(null, ''),
            facebook: Joi.string().max(255).optional().allow(null, ''),
            tiktok: Joi.string().max(100).optional().allow(null, ''),
            logo_url: Joi.string().uri().max(500).optional().allow(null, ''),
            portada_url: Joi.string().uri().max(500).optional().allow(null, ''),
            galeria_urls: Joi.array().items(Joi.string().uri()).max(10).optional(),
            horarios_atencion: Joi.object().optional().allow(null),
            visible_en_directorio: Joi.boolean().optional()
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    /**
     * Schema para activar/desactivar perfil (solo super_admin)
     * PATCH /api/v1/marketplace/perfiles/:id/activar
     */
    activarPerfil: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            activo: Joi.boolean().required().messages({
                'any.required': 'El campo activo es requerido'
            })
        })
    },

    /**
     * Schema para búsqueda pública de perfiles
     * GET /api/v1/marketplace/perfiles/buscar
     */
    buscarPerfiles: {
        query: Joi.object({
            // Búsqueda full-text
            q: Joi.string().min(2).max(200).optional().messages({
                'string.min': 'La búsqueda debe tener al menos 2 caracteres'
            }),

            // Filtros geográficos
            ciudad: Joi.string().max(100).optional(),
            estado: Joi.string().max(100).optional(),
            pais: Joi.string().max(50).optional(),

            // Filtros de calidad
            rating_minimo: Joi.number().min(0).max(5).optional().messages({
                'number.min': 'El rating mínimo debe ser 0',
                'number.max': 'El rating máximo debe ser 5'
            }),

            // Ordenamiento
            orden: Joi.string()
                .valid('rating', 'reseñas', 'reciente', 'alfabetico')
                .optional()
                .default('rating')
                .messages({
                    'any.only': 'Orden debe ser: rating, reseñas, reciente o alfabetico'
                }),

            // Paginación
            pagina: Joi.number().integer().min(1).optional().default(1),
            limite: Joi.number().integer().min(1).max(50).optional().default(12).messages({
                'number.max': 'El límite máximo es 50 perfiles por página'
            })
        })
    },

    /**
     * Schema para obtener perfil por slug (público)
     * GET /api/v1/marketplace/perfiles/slug/:slug
     */
    obtenerPerfilPorSlug: {
        params: Joi.object({
            slug: Joi.string().min(3).max(100).required().messages({
                'any.required': 'El slug es requerido',
                'string.min': 'El slug debe tener al menos 3 caracteres'
            })
        })
    },

    /**
     * Schema para obtener perfil por ID
     * GET /api/v1/marketplace/perfiles/:id
     */
    obtenerPerfil: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para estadísticas de perfil
     * GET /api/v1/marketplace/perfiles/:id/estadisticas
     */
    estadisticasPerfil: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            fecha_inicio: Joi.date().iso().optional().messages({
                'date.format': 'fecha_inicio debe estar en formato ISO'
            }),
            fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional().messages({
                'date.min': 'fecha_fin debe ser posterior a fecha_inicio'
            })
        })
    },

    /**
     * Schema para listar TODOS los perfiles (solo super_admin)
     * GET /api/v1/superadmin/marketplace/perfiles
     */
    listarPerfilesAdmin: {
        query: Joi.object({
            // Filtro por estado activo (opcional)
            activo: Joi.string().valid('true', 'false').optional().messages({
                'any.only': 'activo debe ser "true" o "false"'
            }),

            // Filtro por ciudad (opcional)
            ciudad: Joi.string().max(100).optional(),

            // Filtro de rating mínimo (opcional)
            rating_min: Joi.number().min(0).max(5).optional().messages({
                'number.min': 'El rating mínimo debe ser 0',
                'number.max': 'El rating máximo debe ser 5'
            }),

            // Paginación
            pagina: Joi.number().integer().min(1).optional().default(1),
            limite: Joi.number().integer().min(1).max(100).optional().default(20).messages({
                'number.max': 'El límite máximo es 100 perfiles por página'
            })
        })
    },

    // ========================================================================
    // RESEÑAS
    // ========================================================================

    /**
     * Schema para crear reseña
     * POST /api/v1/marketplace/reseñas
     */
    crearReseña: {
        body: Joi.object({
            // ========== OBLIGATORIOS ==========
            cita_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El cita_id es requerido',
                'number.positive': 'El cita_id debe ser positivo'
            }),

            fecha_cita: Joi.date().iso().required().messages({
                'any.required': 'La fecha_cita es requerida',
                'date.format': 'fecha_cita debe estar en formato ISO (YYYY-MM-DD)'
            }),

            rating: Joi.number().integer().min(1).max(5).required().messages({
                'any.required': 'El rating es requerido',
                'number.min': 'El rating mínimo es 1',
                'number.max': 'El rating máximo es 5'
            }),

            // ========== OPCIONALES ==========
            titulo: Joi.string().max(100).optional().allow(null, '').messages({
                'string.max': 'El título no puede exceder 100 caracteres'
            }),

            comentario: Joi.string().max(1000).optional().allow(null, '').messages({
                'string.max': 'El comentario no puede exceder 1000 caracteres'
            }),

            profesional_id: Joi.number().integer().positive().optional().allow(null).messages({
                'number.positive': 'El profesional_id debe ser positivo'
            })
        })
    },

    /**
     * Schema para responder a una reseña (negocio)
     * POST /api/v1/marketplace/reseñas/:id/responder
     */
    responderReseña: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            respuesta_negocio: Joi.string().max(500).required().messages({
                'any.required': 'La respuesta es requerida',
                'string.max': 'La respuesta no puede exceder 500 caracteres'
            })
        })
    },

    /**
     * Schema para moderar reseña (cambiar estado)
     * PATCH /api/v1/marketplace/reseñas/:id/moderar
     */
    moderarReseña: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            estado: Joi.string()
                .valid('pendiente', 'publicada', 'reportada', 'oculta')
                .required()
                .messages({
                    'any.required': 'El estado es requerido',
                    'any.only': 'Estado debe ser: pendiente, publicada, reportada u oculta'
                }),

            motivo_reporte: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'El motivo no puede exceder 500 caracteres'
            })
        })
    },

    /**
     * Schema para listar reseñas de un negocio (público)
     * GET /api/v1/marketplace/reseñas/negocio/:organizacion_id
     */
    listarReseñas: {
        params: Joi.object({
            organizacion_id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            estado: Joi.string()
                .valid('pendiente', 'publicada', 'reportada', 'oculta')
                .optional()
                .default('publicada'),

            rating_minimo: Joi.number().integer().min(1).max(5).optional(),

            // Paginación
            pagina: Joi.number().integer().min(1).optional().default(1),
            limite: Joi.number().integer().min(1).max(50).optional().default(10)
        })
    },

    // ========================================================================
    // ANALYTICS
    // ========================================================================

    /**
     * Schema para registrar evento de analytics (público)
     * POST /api/v1/marketplace/analytics
     */
    registrarEvento: {
        body: Joi.object({
            // ========== OBLIGATORIOS ==========
            organizacion_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El organizacion_id es requerido'
            }),

            evento_tipo: Joi.string()
                .valid(
                    'vista_perfil',
                    'clic_agendar',
                    'clic_telefono',
                    'clic_sitio_web',
                    'clic_instagram',
                    'clic_facebook'
                )
                .required()
                .messages({
                    'any.required': 'El tipo de evento es requerido',
                    'any.only': 'Tipo de evento inválido'
                }),

            // ========== OPCIONALES ==========
            fuente: Joi.string().max(50).optional().allow(null, ''),
            pais_visitante: Joi.string().max(50).optional().allow(null, ''),
            ciudad_visitante: Joi.string().max(100).optional().allow(null, '')
        })
    },

    /**
     * Schema para obtener analytics de perfil
     * GET /api/v1/marketplace/analytics/:organizacion_id
     */
    obtenerAnalytics: {
        params: Joi.object({
            organizacion_id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            fecha_inicio: Joi.date().iso().optional(),
            fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).optional(),

            evento_tipo: Joi.string()
                .valid(
                    'vista_perfil',
                    'clic_agendar',
                    'clic_telefono',
                    'clic_sitio_web',
                    'clic_instagram',
                    'clic_facebook'
                )
                .optional(),

            agrupar_por: Joi.string()
                .valid('dia', 'semana', 'mes', 'evento')
                .optional()
                .default('dia')
        })
    },

    /**
     * Schema para estadísticas generales de analytics
     * GET /api/v1/marketplace/analytics/:organizacion_id/estadisticas
     */
    estadisticasAnalytics: {
        params: Joi.object({
            organizacion_id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            periodo: Joi.string()
                .valid('7dias', '30dias', '90dias', 'año')
                .optional()
                .default('30dias')
        })
    },

    /**
     * Schema para limpiar datos antiguos de analytics (admin)
     * DELETE /api/v1/marketplace/analytics/limpiar
     */
    limpiarAnalytics: {
        query: Joi.object({
            dias_antiguedad: Joi.number().integer().min(90).required().messages({
                'any.required': 'Debe especificar días de antigüedad',
                'number.min': 'Mínimo 90 días de antigüedad'
            })
        })
    }
};

module.exports = marketplaceSchemas;
