/**
 * Schemas de validación - Categorías de Productos
 * @module inventario/schemas/categorias.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const categoriasSchemas = {
    /**
     * Schema para crear categoría
     * POST /api/v1/inventario/categorias
     */
    crearCategoria: {
        body: Joi.object({
            nombre: Joi.string().max(100).required().messages({
                'any.required': 'El nombre es requerido',
                'string.max': 'El nombre no puede exceder 100 caracteres'
            }),

            descripcion: Joi.string().max(500).optional().allow(null, '').messages({
                'string.max': 'La descripción no puede exceder 500 caracteres'
            }),

            categoria_padre_id: Joi.number().integer().positive().optional().messages({
                'number.base': 'categoria_padre_id debe ser un número',
                'number.positive': 'categoria_padre_id debe ser positivo'
            }),

            icono: Joi.string().max(50).optional().allow(null, ''),

            // ✅ FIX v2.1: Usar fields.colorHex
            color: fields.colorHex.optional().allow(null, ''),

            orden: Joi.number().integer().min(0).optional().default(0),

            activo: Joi.boolean().optional().default(true)
        })
    },

    /**
     * Schema para actualizar categoría
     * PUT /api/v1/inventario/categorias/:id
     */
    actualizarCategoria: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),

        body: Joi.object({
            nombre: Joi.string().max(100).optional(),
            descripcion: Joi.string().max(500).optional().allow(null, ''),
            categoria_padre_id: Joi.number().integer().positive().optional().allow(null),
            icono: Joi.string().max(50).optional().allow(null, ''),
            // ✅ FIX v2.1: Usar fields.colorHex
            color: fields.colorHex.optional().allow(null, ''),
            orden: Joi.number().integer().min(0).optional(),
            activo: Joi.boolean().optional()
        }).min(1)
    },

    /**
     * Schema para listar categorías
     * GET /api/v1/inventario/categorias
     */
    listarCategorias: {
        query: Joi.object({
            activo: Joi.boolean().optional(),
            categoria_padre_id: Joi.number().integer().optional().allow(null),
            busqueda: Joi.string().max(100).optional()
        })
    }
};

module.exports = categoriasSchemas;
