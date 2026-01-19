/**
 * Schemas de validación compartidos - Inventario
 * @module inventario/schemas/shared.schemas
 *
 * Refactorizado v2.2 - Usa campos compartidos de common-fields
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

/**
 * Schema reutilizable para precios en múltiples monedas (inventario)
 * Ahora usa el campo compartido precioMonedaInventario
 */
const precioMonedaSchema = fields.precioMonedaInventario;

const sharedSchemas = {
    /**
     * Schema genérico para ID en params
     */
    obtenerPorId: {
        params: Joi.object({
            id: fields.id.required()
        })
    }
};

module.exports = sharedSchemas;
module.exports.precioMonedaSchema = precioMonedaSchema;
