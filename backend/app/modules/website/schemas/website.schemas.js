/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - WEBSITE
 * ====================================================================
 *
 * Schemas Joi para validación de requests del módulo website.
 *
 * ENDPOINTS:
 * • Config (6): crear, obtener, actualizar, publicar, verificarSlug, eliminar
 * • Páginas (6): crear, listar, obtener, actualizar, reordenar, eliminar
 * • Bloques (9): crear, listar, obtener, actualizar, reordenar, duplicar, eliminar, tipos, default
 * • Públicos (3): obtenerSitio, obtenerPagina, enviarContacto
 *
 * Fecha creación: 6 Diciembre 2025
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');
const { BLOCK_TYPES } = require('../constants');

// Tipos de bloques válidos (importado desde constants)
const TIPOS_BLOQUE = BLOCK_TYPES;

// Regex para slug válido (letras, números, guiones)
const slugRegex = /^[a-z0-9-]+$/;

// ====================================================================
// VALIDADOR CUSTOM: Tamaño máximo de JSONB
// ====================================================================
// Limita el tamaño de los objetos JSONB para evitar degradación de performance
// y consumo excesivo de almacenamiento. Máximo 1MB por campo.

const MAX_JSONB_SIZE_BYTES = 1024 * 1024; // 1MB

/**
 * Validador Joi custom para limitar tamaño de objetos JSONB
 * @param {number} maxBytes - Tamaño máximo en bytes
 * @returns {Joi.ObjectSchema}
 */
const jsonbWithMaxSize = (maxBytes = MAX_JSONB_SIZE_BYTES) => {
    return Joi.object().custom((value, helpers) => {
        if (value === null || value === undefined) {
            return value;
        }

        // Calcular tamaño aproximado del JSON serializado
        const jsonString = JSON.stringify(value);
        const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

        if (sizeBytes > maxBytes) {
            const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
            const maxMB = (maxBytes / (1024 * 1024)).toFixed(2);
            return helpers.error('object.maxSize', {
                currentSize: sizeMB,
                maxSize: maxMB
            });
        }

        return value;
    }).messages({
        'object.maxSize': 'El contenido es demasiado grande ({{#currentSize}}MB). Máximo permitido: {{#maxSize}}MB'
    });
};

const websiteSchemas = {
    // ========================================================================
    // CONFIGURACIÓN DEL SITIO
    // ========================================================================

    /**
     * Schema para crear configuración del sitio
     * POST /api/v1/website/config
     */
    crearConfig: {
        body: Joi.object({
            // ========== OBLIGATORIOS ==========
            slug: Joi.string()
                .min(3)
                .max(100)
                .pattern(slugRegex)
                .required()
                .messages({
                    'any.required': 'El slug es requerido',
                    'string.min': 'El slug debe tener al menos 3 caracteres',
                    'string.max': 'El slug no puede exceder 100 caracteres',
                    'string.pattern.base': 'El slug solo puede contener letras minúsculas, números y guiones'
                }),

            // ========== OPCIONALES ==========
            nombre_sitio: Joi.string().max(255).optional().allow(null, ''),
            descripcion_seo: Joi.string().max(160).optional().allow(null, '').messages({
                'string.max': 'La descripción SEO no puede exceder 160 caracteres'
            }),
            keywords_seo: Joi.string().optional().allow(null, ''),

            // Branding
            favicon_url: Joi.string().uri().max(500).optional().allow(null, ''),
            logo_url: Joi.string().uri().max(500).optional().allow(null, ''),
            logo_alt: Joi.string().max(100).optional().allow(null, ''),

            // Colores (formato hex #RRGGBB)
            color_primario: fields.colorHex.optional(),
            color_secundario: fields.colorHex.optional(),
            color_acento: fields.colorHex.optional(),
            color_texto: fields.colorHex.optional(),
            color_fondo: fields.colorHex.optional(),

            // Fuentes
            fuente_titulos: Joi.string().max(100).optional().allow(null, ''),
            fuente_cuerpo: Joi.string().max(100).optional().allow(null, ''),

            // Redes sociales (objeto JSONB)
            redes_sociales: Joi.object().optional().allow(null)
        })
    },

    /**
     * Schema para actualizar configuración
     * PUT /api/v1/website/config/:id
     */
    actualizarConfig: {
        params: Joi.object({
            id: Joi.string().uuid().required().messages({
                'string.guid': 'El ID debe ser un UUID válido'
            })
        }),
        body: Joi.object({
            // Bloqueo optimista - requerido para actualizaciones
            version: Joi.number().integer().min(1).required().messages({
                'any.required': 'Se requiere version para actualizar (bloqueo optimista)',
                'number.min': 'La version debe ser mayor a 0'
            }),
            slug: Joi.string()
                .min(3)
                .max(100)
                .pattern(slugRegex)
                .optional()
                .messages({
                    'string.min': 'El slug debe tener al menos 3 caracteres',
                    'string.max': 'El slug no puede exceder 100 caracteres',
                    'string.pattern.base': 'El slug solo puede contener letras minúsculas, números y guiones'
                }),
            nombre_sitio: Joi.string().max(255).optional().allow(null, ''),
            descripcion_seo: Joi.string().max(160).optional().allow(null, ''),
            keywords_seo: Joi.string().optional().allow(null, ''),
            favicon_url: Joi.string().uri().max(500).optional().allow(null, ''),
            logo_url: Joi.string().uri().max(500).optional().allow(null, ''),
            logo_alt: Joi.string().max(100).optional().allow(null, ''),
            color_primario: fields.colorHex.optional(),
            color_secundario: fields.colorHex.optional(),
            color_acento: fields.colorHex.optional(),
            color_texto: fields.colorHex.optional(),
            color_fondo: fields.colorHex.optional(),
            fuente_titulos: Joi.string().max(100).optional().allow(null, ''),
            fuente_cuerpo: Joi.string().max(100).optional().allow(null, ''),
            redes_sociales: Joi.object().optional().allow(null)
        })
    },

    /**
     * Schema para publicar/despublicar sitio
     * POST /api/v1/website/config/:id/publicar
     */
    publicarConfig: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        }),
        body: Joi.object({
            publicar: Joi.boolean().required().messages({
                'any.required': 'El campo publicar es requerido'
            })
        })
    },

    /**
     * Schema para verificar disponibilidad de slug
     * GET /api/v1/website/config/slug/:slug/disponible
     */
    verificarSlug: {
        params: Joi.object({
            slug: Joi.string()
                .min(3)
                .max(100)
                .pattern(slugRegex)
                .required()
        }),
        query: Joi.object({
            exclude: Joi.string().uuid().optional()
        })
    },

    /**
     * Schema para eliminar configuración
     * DELETE /api/v1/website/config/:id
     */
    eliminarConfig: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        })
    },

    // ========================================================================
    // PÁGINAS
    // ========================================================================

    /**
     * Schema para crear página
     * POST /api/v1/website/paginas
     */
    crearPagina: {
        body: Joi.object({
            slug: Joi.string()
                .max(100)
                .pattern(slugRegex)
                .optional()
                .allow('')
                .messages({
                    'string.pattern.base': 'El slug solo puede contener letras minúsculas, números y guiones'
                }),
            titulo: Joi.string().max(255).required().messages({
                'any.required': 'El título de la página es requerido'
            }),
            descripcion_seo: Joi.string().max(160).optional().allow(null, ''),
            orden: Joi.number().integer().min(0).optional(),
            visible_menu: Joi.boolean().optional(),
            icono: Joi.string().max(50).optional().allow(null, ''),
            publicada: Joi.boolean().optional()
        })
    },

    /**
     * Schema para obtener página por ID
     * GET /api/v1/website/paginas/:id
     */
    obtenerPagina: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        })
    },

    /**
     * Schema para actualizar página
     * PUT /api/v1/website/paginas/:id
     */
    actualizarPagina: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        }),
        body: Joi.object({
            // Bloqueo optimista - requerido para actualizaciones
            version: Joi.number().integer().min(1).required().messages({
                'any.required': 'Se requiere version para actualizar (bloqueo optimista)',
                'number.min': 'La version debe ser mayor a 0'
            }),
            slug: Joi.string()
                .max(100)
                .pattern(slugRegex)
                .optional()
                .allow(''),
            titulo: Joi.string().max(255).optional(),
            descripcion_seo: Joi.string().max(160).optional().allow(null, ''),
            orden: Joi.number().integer().min(0).optional(),
            visible_menu: Joi.boolean().optional(),
            icono: Joi.string().max(50).optional().allow(null, ''),
            publicada: Joi.boolean().optional()
        })
    },

    /**
     * Schema para reordenar páginas
     * PUT /api/v1/website/paginas/orden
     */
    reordenarPaginas: {
        body: Joi.object({
            ordenamiento: Joi.array().items(
                Joi.object({
                    id: Joi.string().uuid().required(),
                    orden: Joi.number().integer().min(0).required()
                })
            ).min(1).required().messages({
                'any.required': 'El ordenamiento es requerido',
                'array.min': 'Debe proporcionar al menos un elemento'
            })
        })
    },

    /**
     * Schema para eliminar página
     * DELETE /api/v1/website/paginas/:id
     */
    eliminarPagina: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        })
    },

    // ========================================================================
    // BLOQUES
    // ========================================================================

    /**
     * Schema para crear bloque
     * POST /api/v1/website/bloques
     */
    crearBloque: {
        body: Joi.object({
            pagina_id: Joi.string().uuid().required().messages({
                'any.required': 'El ID de la página es requerido'
            }),
            tipo: Joi.string().valid(...TIPOS_BLOQUE).required().messages({
                'any.required': 'El tipo de bloque es requerido',
                'any.only': `El tipo debe ser uno de: ${TIPOS_BLOQUE.join(', ')}`
            }),
            contenido: jsonbWithMaxSize().optional().allow(null),
            estilos: jsonbWithMaxSize().optional().allow(null),
            orden: Joi.number().integer().min(0).optional(),
            visible: Joi.boolean().optional()
        })
    },

    /**
     * Schema para listar bloques de una página
     * GET /api/v1/website/paginas/:paginaId/bloques
     */
    listarBloques: {
        params: Joi.object({
            paginaId: Joi.string().uuid().required()
        })
    },

    /**
     * Schema para obtener bloque por ID
     * GET /api/v1/website/bloques/:id
     */
    obtenerBloque: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        })
    },

    /**
     * Schema para actualizar bloque
     * PUT /api/v1/website/bloques/:id
     */
    actualizarBloque: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        }),
        body: Joi.object({
            // Bloqueo optimista - requerido para actualizaciones
            version: Joi.number().integer().min(1).required().messages({
                'any.required': 'Se requiere version para actualizar (bloqueo optimista)',
                'number.min': 'La version debe ser mayor a 0'
            }),
            tipo: Joi.string().valid(...TIPOS_BLOQUE).optional(),
            contenido: jsonbWithMaxSize().optional().allow(null),
            estilos: jsonbWithMaxSize().optional().allow(null),
            orden: Joi.number().integer().min(0).optional(),
            visible: Joi.boolean().optional()
        })
    },

    /**
     * Schema para reordenar bloques
     * PUT /api/v1/website/paginas/:paginaId/bloques/orden
     */
    reordenarBloques: {
        params: Joi.object({
            paginaId: Joi.string().uuid().required()
        }),
        body: Joi.object({
            ordenamiento: Joi.array().items(
                Joi.object({
                    id: Joi.string().uuid().required(),
                    orden: Joi.number().integer().min(0).required()
                })
            ).min(1).required()
        })
    },

    /**
     * Schema para duplicar bloque
     * POST /api/v1/website/bloques/:id/duplicar
     */
    duplicarBloque: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        })
    },

    /**
     * Schema para eliminar bloque
     * DELETE /api/v1/website/bloques/:id
     */
    eliminarBloque: {
        params: Joi.object({
            id: Joi.string().uuid().required()
        })
    },

    /**
     * Schema para obtener contenido default de un tipo
     * GET /api/v1/website/bloques/tipos/:tipo/default
     */
    obtenerDefaultBloque: {
        params: Joi.object({
            tipo: Joi.string().valid(...TIPOS_BLOQUE).required().messages({
                'any.only': `El tipo debe ser uno de: ${TIPOS_BLOQUE.join(', ')}`
            })
        })
    },

    // ========================================================================
    // RUTAS PÚBLICAS
    // ========================================================================

    /**
     * Schema para obtener sitio público
     * GET /api/v1/public/sitio/:slug
     */
    obtenerSitioPublico: {
        params: Joi.object({
            slug: Joi.string()
                .min(3)
                .max(100)
                .pattern(slugRegex)
                .required()
        })
    },

    /**
     * Schema para obtener página pública
     * GET /api/v1/public/sitio/:slug/:pagina
     */
    obtenerPaginaPublica: {
        params: Joi.object({
            slug: Joi.string()
                .min(3)
                .max(100)
                .pattern(slugRegex)
                .required(),
            pagina: Joi.string()
                .max(100)
                .pattern(slugRegex)
                .required()
        })
    },

    /**
     * Schema para enviar formulario de contacto
     * POST /api/v1/public/sitio/:slug/contacto
     */
    enviarContacto: {
        params: Joi.object({
            slug: Joi.string()
                .min(3)
                .max(100)
                .pattern(slugRegex)
                .required()
        }),
        body: Joi.object({
            nombre: Joi.string().max(100).required().messages({
                'any.required': 'El nombre es requerido'
            }),
            email: Joi.string().email().max(150).required().messages({
                'any.required': 'El email es requerido',
                'string.email': 'Ingresa un email válido'
            }),
            telefono: Joi.string().max(20).optional().allow(null, ''),
            mensaje: Joi.string().max(1000).optional().allow(null, '').messages({
                'string.max': 'El mensaje no puede exceder 1000 caracteres'
            })
        })
    }
};

module.exports = websiteSchemas;
