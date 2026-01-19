/**
 * Schemas de validacion - Snapshots de Inventario
 * @module inventario/schemas/snapshots.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const snapshotsSchemas = {
    /**
     * Schema para listar snapshots
     * GET /api/v1/inventario/snapshots
     */
    listar: {
        query: Joi.object({
            almacen_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            tipo: Joi.string().valid('automatico', 'manual', 'cierre_fiscal').optional(),
            fecha_desde: fields.fecha.optional(),
            fecha_hasta: fields.fecha.optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
            orden: Joi.string().valid('fecha_creacion', 'tipo').default('fecha_creacion')
        })
    },

    /**
     * Schema para obtener historico de un producto
     * GET /api/v1/inventario/snapshots/producto/:productoId/historico
     */
    historicoProducto: {
        params: Joi.object({
            productoId: fields.id.required()
        }),
        query: Joi.object({
            almacen_id: fields.id.optional(),
            fecha_desde: fields.fecha.optional(),
            fecha_hasta: fields.fecha.optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(50)
        })
    },

    /**
     * Schema para obtener stock en una fecha especifica
     * GET /api/v1/inventario/snapshots/stock-en-fecha
     */
    stockEnFecha: {
        query: Joi.object({
            fecha: fields.fecha.required(),
            almacen_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            categoria_id: fields.id.optional(),
            producto_id: fields.id.optional(),
            solo_con_stock: Joi.boolean().default(false),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(500).default(100)
        })
    },

    /**
     * Schema para comparar dos snapshots
     * GET /api/v1/inventario/snapshots/comparar
     */
    comparar: {
        query: Joi.object({
            snapshot_id_1: fields.id.required(),
            snapshot_id_2: fields.id.required(),
            solo_diferencias: Joi.boolean().default(true),
            umbral_diferencia: fields.porcentaje.default(0).messages({
                'number.base': 'umbral_diferencia debe ser un porcentaje'
            }),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(500).default(100)
        })
    }
};

module.exports = snapshotsSchemas;
