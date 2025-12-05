/**
 * ====================================================================
 * SCHEMAS: PLANTILLAS DE EVENTOS
 * ====================================================================
 * Validación Joi para endpoints de plantillas.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const Joi = require('joi');

const tiposEvento = ['boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'universal', 'otro'];

// Schema para el tema visual
const temaSchema = Joi.object({
    color_primario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#ec4899'),
    color_secundario: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#fce7f3'),
    color_fondo: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#fdf2f8'),
    color_texto: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#1f2937'),
    color_texto_claro: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#6b7280'),
    fuente_titulo: Joi.string().max(100).default('Playfair Display'),
    fuente_cuerpo: Joi.string().max(100).default('Inter')
});

const plantillasSchemas = {
    /**
     * GET /plantillas
     */
    listarPlantillas: {
        query: Joi.object({
            tipo_evento: Joi.string().valid(...tiposEvento),
            es_premium: Joi.string().valid('true', 'false')
        })
    },

    /**
     * GET /plantillas/:id
     */
    obtenerPlantilla: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * GET /plantillas/tipo/:tipoEvento
     */
    listarPorTipo: {
        params: Joi.object({
            tipoEvento: Joi.string().valid(...tiposEvento).required()
        })
    },

    /**
     * POST /plantillas (super_admin)
     */
    crearPlantilla: {
        body: Joi.object({
            codigo: Joi.string().max(50).pattern(/^[a-z0-9-]+$/).required(),
            nombre: Joi.string().max(100).required(),
            tipo_evento: Joi.string().valid(...tiposEvento).required(),
            descripcion: Joi.string().max(500).allow(null, ''),
            preview_url: Joi.string().uri().max(500).allow(null, ''),
            tema: temaSchema,
            estructura_html: Joi.string().max(50000).allow(null, ''),
            estilos_css: Joi.string().max(50000).allow(null, ''),
            es_premium: Joi.boolean().default(false),
            orden: Joi.number().integer().min(0).default(0)
        })
    },

    /**
     * PUT /plantillas/:id (super_admin)
     */
    actualizarPlantilla: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            nombre: Joi.string().max(100),
            tipo_evento: Joi.string().valid(...tiposEvento),
            descripcion: Joi.string().max(500).allow(null, ''),
            preview_url: Joi.string().uri().max(500).allow(null, ''),
            tema: temaSchema,
            estructura_html: Joi.string().max(50000).allow(null, ''),
            estilos_css: Joi.string().max(50000).allow(null, ''),
            es_premium: Joi.boolean(),
            activo: Joi.boolean(),
            orden: Joi.number().integer().min(0)
        }).min(1)
    },

    /**
     * DELETE /plantillas/:id (super_admin)
     */
    eliminarPlantilla: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    }
};

module.exports = plantillasSchemas;
