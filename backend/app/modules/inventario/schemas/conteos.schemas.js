/**
 * Schemas de validación - Conteos de Inventario
 * @module inventario/schemas/conteos.schemas
 */

const Joi = require('joi');
const { withPagination, idOptional } = require('../../../schemas/shared');

const conteosSchemas = {
    /**
     * Schema para crear conteo de inventario
     * POST /api/v1/inventario/conteos
     */
    crearConteo: {
        body: Joi.object({
            sucursal_id: Joi.number().integer().positive().optional().allow(null),

            tipo_conteo: Joi.string()
                .valid('total', 'por_categoria', 'por_ubicacion', 'ciclico', 'aleatorio')
                .required()
                .messages({
                    'any.required': 'El tipo_conteo es requerido',
                    'any.only': 'tipo_conteo debe ser: total, por_categoria, por_ubicacion, ciclico o aleatorio'
                }),

            filtros: Joi.object({
                categoria_id: Joi.number().integer().positive().optional(),
                ubicacion_id: Joi.number().integer().positive().optional(),
                producto_ids: Joi.array().items(Joi.number().integer().positive()).optional(),
                cantidad_muestra: Joi.number().integer().min(1).max(500).optional().default(50),
                solo_con_stock: Joi.boolean().optional().default(false)
            }).optional().default({}),

            fecha_programada: Joi.string().isoDate().optional().allow(null),

            usuario_contador_id: Joi.number().integer().positive().optional().allow(null),
            usuario_supervisor_id: Joi.number().integer().positive().optional().allow(null),

            notas: Joi.string().max(1000).optional().allow(null, '')
        }).custom((value, helpers) => {
            // Validación: conteo por categoría requiere categoria_id
            if (value.tipo_conteo === 'por_categoria' && !value.filtros?.categoria_id) {
                return helpers.error('any.custom', {
                    message: 'Para conteo por categoría debe especificar filtros.categoria_id'
                });
            }

            // Validación: conteo por ubicación requiere ubicacion_id
            if (value.tipo_conteo === 'por_ubicacion' && !value.filtros?.ubicacion_id) {
                return helpers.error('any.custom', {
                    message: 'Para conteo por ubicación debe especificar filtros.ubicacion_id'
                });
            }

            // Validación: conteo cíclico requiere producto_ids
            if (value.tipo_conteo === 'ciclico' &&
                (!value.filtros?.producto_ids || value.filtros.producto_ids.length === 0)) {
                return helpers.error('any.custom', {
                    message: 'Para conteo cíclico debe especificar filtros.producto_ids'
                });
            }

            return value;
        })
    },

    /**
     * Schema para listar conteos
     * GET /api/v1/inventario/conteos
     */
    listarConteos: {
        query: withPagination({
            sucursal_id: idOptional,
            estado: Joi.string().valid('borrador', 'en_proceso', 'completado', 'ajustado', 'cancelado').optional(),
            tipo_conteo: Joi.string().valid('total', 'por_categoria', 'por_ubicacion', 'ciclico', 'aleatorio').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            folio: Joi.string().max(20).optional()
        })
    },

    /**
     * Schema para obtener conteo por ID
     * GET /api/v1/inventario/conteos/:id
     */
    obtenerConteoPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para iniciar conteo
     * POST /api/v1/inventario/conteos/:id/iniciar
     */
    iniciarConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para registrar cantidad contada de un item
     * PUT /api/v1/inventario/conteos/items/:itemId
     */
    registrarConteoItem: {
        params: Joi.object({
            itemId: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            cantidad_contada: Joi.number().integer().min(0).required().messages({
                'any.required': 'La cantidad_contada es requerida',
                'number.min': 'La cantidad_contada no puede ser negativa'
            }),
            notas: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para completar conteo
     * POST /api/v1/inventario/conteos/:id/completar
     */
    completarConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para aplicar ajustes del conteo
     * POST /api/v1/inventario/conteos/:id/aplicar-ajustes
     */
    aplicarAjustesConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para cancelar conteo
     * POST /api/v1/inventario/conteos/:id/cancelar
     */
    cancelarConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            motivo: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para buscar item por código
     * GET /api/v1/inventario/conteos/:id/buscar-item
     */
    buscarItemConteo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        query: Joi.object({
            codigo: Joi.string().max(100).required().messages({
                'any.required': 'El código es requerido'
            })
        })
    },

    /**
     * Schema para estadísticas de conteos
     * GET /api/v1/inventario/conteos/estadisticas
     */
    estadisticasConteos: {
        query: Joi.object({
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional()
        })
    }
};

module.exports = conteosSchemas;
