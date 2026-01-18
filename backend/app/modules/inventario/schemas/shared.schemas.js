/**
 * Schemas de validación compartidos - Inventario
 * @module inventario/schemas/shared.schemas
 */

const Joi = require('joi');

/**
 * Schema reutilizable para precios en múltiples monedas
 */
const precioMonedaSchema = Joi.object({
    moneda: Joi.string().length(3).uppercase().required().messages({
        'any.required': 'El código de moneda es requerido',
        'string.length': 'El código de moneda debe tener 3 caracteres'
    }),
    precio_compra: Joi.number().min(0).optional().allow(null),
    precio_venta: Joi.number().min(0.01).required().messages({
        'any.required': 'El precio de venta es requerido',
        'number.min': 'El precio de venta debe ser mayor a 0'
    })
    // Dic 2025: precio_mayoreo eliminado, usar listas_precios
});

const sharedSchemas = {
    /**
     * Schema genérico para ID en params
     */
    obtenerPorId: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    }
};

module.exports = sharedSchemas;
module.exports.precioMonedaSchema = precioMonedaSchema;
