/**
 * Schemas de validación - Dropshipping
 * @module inventario/schemas/dropship.schemas
 */

const Joi = require('joi');

const dropshipSchemas = {
    /**
     * Schema para actualizar configuracion dropship
     * PATCH /api/v1/inventario/dropship/configuracion
     */
    actualizarConfigDropship: {
        body: Joi.object({
            dropship_auto_generar_oc: Joi.boolean().required().messages({
                'any.required': 'Debe indicar si la generacion automatica esta activa'
            })
        })
    }
};

module.exports = dropshipSchemas;
