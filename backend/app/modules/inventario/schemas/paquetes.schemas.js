/**
 * Schemas de validación - Paquetes de Envío
 * @module inventario/schemas/paquetes.schemas
 */

const Joi = require('joi');

const paquetesSchemas = {
    /**
     * Schema para crear paquete
     * POST /api/v1/inventario/operaciones/:operacionId/paquetes
     */
    crearPaquete: {
        params: Joi.object({
            operacionId: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de operacion es requerido',
                'number.positive': 'El ID de operacion debe ser positivo'
            })
        }),
        body: Joi.object({
            notas: Joi.string().max(500).optional().allow(null, '')
        })
    },

    /**
     * Schema para agregar item a paquete
     * POST /api/v1/inventario/paquetes/:id/items
     */
    agregarItemPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de paquete es requerido'
            })
        }),
        body: Joi.object({
            operacion_item_id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID de item de operacion es requerido',
                'number.positive': 'El ID debe ser positivo'
            }),
            cantidad: Joi.number().integer().positive().required().messages({
                'any.required': 'La cantidad es requerida',
                'number.positive': 'La cantidad debe ser mayor a 0'
            }),
            numero_serie_id: Joi.number().integer().positive().optional().allow(null)
        })
    },

    /**
     * Schema para actualizar paquete (dimensiones, peso)
     * PUT /api/v1/inventario/paquetes/:id
     */
    actualizarPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            peso_kg: Joi.number().positive().precision(3).optional().allow(null),
            largo_cm: Joi.number().positive().precision(2).optional().allow(null),
            ancho_cm: Joi.number().positive().precision(2).optional().allow(null),
            alto_cm: Joi.number().positive().precision(2).optional().allow(null),
            notas: Joi.string().max(500).optional().allow(null, ''),
            carrier: Joi.string().max(50).optional().allow(null, ''),
            tracking_carrier: Joi.string().max(100).optional().allow(null, '')
        }).min(1).messages({
            'object.min': 'Debe proporcionar al menos un campo para actualizar'
        })
    },

    /**
     * Schema para etiquetar paquete
     * POST /api/v1/inventario/paquetes/:id/etiquetar
     */
    etiquetarPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            tracking_carrier: Joi.string().max(100).optional().allow(null, ''),
            carrier: Joi.string().max(50).optional().allow(null, '')
        })
    },

    /**
     * Schema para cancelar paquete
     * POST /api/v1/inventario/paquetes/:id/cancelar
     */
    cancelarPaquete: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        }),
        body: Joi.object({
            motivo: Joi.string().max(500).optional().allow(null, '')
        })
    }
};

module.exports = paquetesSchemas;
