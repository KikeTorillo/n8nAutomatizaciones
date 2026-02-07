/**
 * ====================================================================
 * SCHEMAS: PLANTILLAS DE EVENTOS
 * ====================================================================
 * Validación Joi para endpoints de plantillas.
 *
 * Fecha creación: 4 Diciembre 2025
 * Actualizado: 14 Diciembre 2025 - Plantillas temáticas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const tiposEvento = ['boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'universal', 'otro'];

// Categorías permitidas
const categorias = ['infantil', 'juvenil', 'adulto', 'elegante', 'moderno', 'rustico', 'tematico', 'clasico'];

// Subcategorías permitidas (temáticas específicas)
const subcategorias = [
    // Infantiles
    'superheroes', 'princesas', 'frozen', 'unicornios', 'dinosaurios',
    'minecraft', 'kpop', 'futbol', 'espacial', 'sirenas', 'safari', 'circo',
    // XV Años
    'paris', 'mascarada', 'jardin_secreto', 'hollywood',
    // Bodas
    'dorado', 'floral', 'natural', 'playa', 'vintage',
    // Generales
    'minimalista', 'colorido', 'neon', 'pastel'
];

// Opciones para campos del tema
const patronesFondo = ['none', 'confetti', 'stars', 'hearts', 'dots', 'stripes', 'bubbles', 'geometric'];
const decoracionesEsquinas = ['none', 'globos', 'estrellas', 'flores', 'corazones', 'lazos', 'hojas'];
const iconosPrincipales = ['none', 'cake', 'crown', 'star', 'heart', 'mask', 'gift', 'ring', 'baby', 'balloon'];
const animacionesEntrada = ['none', 'fade', 'bounce', 'slide', 'zoom', 'flip'];
const efectosTitulo = ['none', 'sparkle', 'glow', 'shadow', 'gradient', 'outline'];
const marcosFotos = ['none', 'polaroid', 'comic', 'vintage', 'neon', 'rounded', 'ornate'];

// Schema para el tema visual (ampliado)
const temaSchema = Joi.object({
    // Colores
    color_primario: fields.colorHex.default('#ec4899'),
    color_secundario: fields.colorHex.default('#fce7f3'),
    color_fondo: fields.colorHex.default('#fdf2f8'),
    color_texto: fields.colorHex.default('#1f2937'),
    color_texto_claro: fields.colorHex.default('#6b7280'),

    // Fuentes
    fuente_titulo: Joi.string().max(100).default('Playfair Display'),
    fuente_cuerpo: Joi.string().max(100).default('Inter'),

    // Elementos visuales temáticos
    patron_fondo: Joi.string().valid(...patronesFondo).default('none'),
    patron_opacidad: Joi.number().min(0).max(1).default(0.1),
    decoracion_esquinas: Joi.string().valid(...decoracionesEsquinas).default('none'),
    icono_principal: Joi.string().valid(...iconosPrincipales).default('none'),

    // Efectos
    animacion_entrada: Joi.string().valid(...animacionesEntrada).default('fade'),
    efecto_titulo: Joi.string().valid(...efectosTitulo).default('none'),

    // Fotos
    marco_fotos: Joi.string().valid(...marcosFotos).default('none'),

    // Stickers/emojis decorativos
    stickers: Joi.array().items(Joi.string().max(10)).max(10).default([]),

    // Imagen de fondo temática
    imagen_fondo: Joi.string().uri().max(500).allow(null, '').default(null)
});

const plantillasSchemas = {
    /**
     * GET /plantillas
     */
    listarPlantillas: {
        query: Joi.object({
            tipo_evento: Joi.string().valid(...tiposEvento),
            categoria: Joi.string().valid(...categorias),
            subcategoria: Joi.string().valid(...subcategorias),
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
            categoria: Joi.string().valid(...categorias).allow(null),
            subcategoria: Joi.string().valid(...subcategorias).allow(null),
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
            categoria: Joi.string().valid(...categorias).allow(null),
            subcategoria: Joi.string().valid(...subcategorias).allow(null),
            tema: temaSchema,
            estructura_html: Joi.string().max(50000).allow(null, ''),
            estilos_css: Joi.string().max(50000).allow(null, ''),
            es_premium: Joi.boolean(),
            activo: Joi.boolean(),
            orden: Joi.number().integer().min(0)
        }).min(1)
    },

    /**
     * PUT /plantillas/:id/bloques (super_admin)
     */
    guardarBloquesPlantilla: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            bloques: Joi.array().items(
                Joi.object({
                    id: Joi.string().required(),
                    tipo: Joi.string().required(),
                    orden: Joi.number().integer().min(0).required(),
                    visible: Joi.boolean().default(true),
                    contenido: Joi.object().default({}),
                    estilos: Joi.object().default({}),
                }).unknown(true)
            ).required()
        })
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

// Exportar también las constantes para uso en frontend
module.exports = plantillasSchemas;
module.exports.categorias = categorias;
module.exports.subcategorias = subcategorias;
module.exports.patronesFondo = patronesFondo;
module.exports.decoracionesEsquinas = decoracionesEsquinas;
module.exports.iconosPrincipales = iconosPrincipales;
module.exports.animacionesEntrada = animacionesEntrada;
module.exports.efectosTitulo = efectosTitulo;
module.exports.marcosFotos = marcosFotos;
