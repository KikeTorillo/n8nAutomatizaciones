/**
 * Schemas de validación - Landed Costs (Costos en Destino)
 * @module inventario/schemas/landed-costs.schemas
 */

const Joi = require('joi');

const landedCostsSchemas = {
    /**
     * Schema para crear costo adicional
     * POST /api/v1/inventario/ordenes-compra/:id/costos
     */
    crearCostoAdicional: {
        body: Joi.object({
            tipo_costo: Joi.string()
                .valid('flete', 'arancel', 'seguro', 'manipulacion', 'almacenaje', 'otro')
                .required()
                .messages({
                    'any.required': 'El tipo de costo es requerido',
                    'any.only': 'Tipo de costo invalido'
                }),

            descripcion: Joi.string().max(500).optional().allow(null, ''),

            referencia_externa: Joi.string().max(100).optional().allow(null, ''),

            monto_total: Joi.number()
                .positive()
                .precision(2)
                .required()
                .messages({
                    'any.required': 'El monto total es requerido',
                    'number.positive': 'El monto debe ser mayor a 0'
                }),

            moneda: Joi.string().length(3).uppercase().optional().default('MXN'),

            tipo_cambio: Joi.number().positive().precision(4).optional().default(1),

            metodo_distribucion: Joi.string()
                .valid('valor', 'cantidad', 'peso', 'volumen')
                .optional()
                .default('valor')
                .messages({
                    'any.only': 'Metodo de distribucion invalido'
                }),

            proveedor_servicio_id: Joi.number().integer().positive().optional().allow(null),

            proveedor_servicio_nombre: Joi.string().max(200).optional().allow(null, '')
        })
    },

    /**
     * Schema para actualizar costo adicional
     * PUT /api/v1/inventario/ordenes-compra/:id/costos/:costoId
     */
    actualizarCostoAdicional: {
        body: Joi.object({
            tipo_costo: Joi.string()
                .valid('flete', 'arancel', 'seguro', 'manipulacion', 'almacenaje', 'otro')
                .optional(),

            descripcion: Joi.string().max(500).optional().allow(null, ''),

            referencia_externa: Joi.string().max(100).optional().allow(null, ''),

            monto_total: Joi.number().positive().precision(2).optional(),

            moneda: Joi.string().length(3).uppercase().optional(),

            tipo_cambio: Joi.number().positive().precision(4).optional(),

            metodo_distribucion: Joi.string()
                .valid('valor', 'cantidad', 'peso', 'volumen')
                .optional(),

            proveedor_servicio_id: Joi.number().integer().positive().optional().allow(null),

            proveedor_servicio_nombre: Joi.string().max(200).optional().allow(null, '')
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    }
};

module.exports = landedCostsSchemas;
