/**
 * Schemas de validacion - Batch Picking (Preparacion de pedidos por lotes)
 * @module inventario/schemas/batch-picking.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const batchPickingSchemas = {
    /**
     * Schema para listar ordenes de picking
     * GET /api/v1/inventario/batch-picking
     */
    listar: {
        query: Joi.object({
            estado: Joi.string().valid('pendiente', 'en_proceso', 'completado', 'cancelado').optional(),
            almacen_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            fecha_desde: fields.fecha.optional(),
            fecha_hasta: fields.fecha.optional(),
            prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente').optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
            orden: Joi.string().valid('creado_en', 'prioridad', 'fecha_limite').default('creado_en')
        })
    },

    /**
     * Schema para crear orden de picking
     * POST /api/v1/inventario/batch-picking
     */
    crear: {
        body: Joi.object({
            almacen_id: fields.id.required(),
            operador_id: fields.id.optional(),
            prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente').default('normal'),
            fecha_limite: fields.fechaHora.optional(),
            notas: fields.notas,
            ordenes_ids: Joi.array().items(fields.id).min(1).max(50).required().messages({
                'array.min': 'Debe incluir al menos una orden',
                'array.max': 'Maximo 50 ordenes por lote'
            }),
            estrategia: Joi.string().valid('zona', 'producto', 'orden', 'wave').default('zona')
        })
    },

    /**
     * Schema para actualizar orden de picking
     * PUT /api/v1/inventario/batch-picking/:id
     */
    actualizar: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            operador_id: fields.id.allow(null),
            prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente'),
            fecha_limite: fields.fechaHora.allow(null),
            estado: Joi.string().valid('pendiente', 'en_proceso', 'pausado'),
            notas: fields.notas
        }).min(1)
    },

    /**
     * Schema para procesar item de picking
     * POST /api/v1/inventario/batch-picking/:id/items/:itemId/procesar
     */
    procesarItem: {
        params: Joi.object({
            id: fields.id.required(),
            itemId: fields.id.required()
        }),
        body: Joi.object({
            cantidad_recogida: fields.cantidad.required(),
            ubicacion_origen_id: fields.id.optional(),
            lote_id: fields.id.optional(),
            numero_serie: Joi.string().trim().max(100).optional(),
            notas: fields.notas
        })
    },

    /**
     * Schema para agregar operacion a batch
     * POST /api/v1/inventario/batch-picking/:id/operaciones
     */
    agregarOperacion: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            orden_id: fields.id.required()
        })
    },

    /**
     * Schema para quitar operacion de batch
     * DELETE /api/v1/inventario/batch-picking/:id/operaciones/:ordenId
     */
    quitarOperacion: {
        params: Joi.object({
            id: fields.id.required(),
            ordenId: fields.id.required()
        })
    }
};

module.exports = batchPickingSchemas;
