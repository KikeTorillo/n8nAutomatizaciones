/**
 * Schemas de validacion - Operaciones de Almacen
 * @module inventario/schemas/operaciones-almacen.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const operacionesAlmacenSchemas = {
    /**
     * Schema para listar operaciones de almacen
     * GET /api/v1/inventario/operaciones-almacen
     */
    listar: {
        query: Joi.object({
            tipo: Joi.string().valid(
                'entrada', 'salida', 'transferencia', 'ajuste',
                'devolucion', 'picking', 'packing', 'recepcion'
            ).optional(),
            estado: Joi.string().valid('pendiente', 'en_proceso', 'completada', 'cancelada').optional(),
            almacen_origen_id: fields.id.optional(),
            almacen_destino_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            operador_id: fields.id.optional(),
            fecha_desde: fields.fechaHora.optional(),
            fecha_hasta: fields.fechaHora.optional(),
            referencia: Joi.string().trim().max(100).optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
            orden: Joi.string().valid('creado_en', 'fecha_programada', 'prioridad').default('creado_en')
        })
    },

    /**
     * Schema para crear operacion de almacen
     * POST /api/v1/inventario/operaciones-almacen
     */
    crear: {
        body: Joi.object({
            tipo: Joi.string().valid(
                'entrada', 'salida', 'transferencia', 'ajuste',
                'devolucion', 'picking', 'packing', 'recepcion'
            ).required(),
            almacen_origen_id: fields.id.when('tipo', {
                is: Joi.valid('salida', 'transferencia', 'picking'),
                then: Joi.required()
            }),
            almacen_destino_id: fields.id.when('tipo', {
                is: Joi.valid('entrada', 'transferencia', 'recepcion'),
                then: Joi.required()
            }),
            prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente').default('normal'),
            fecha_programada: fields.fechaHora.optional(),
            referencia_externa: Joi.string().trim().max(100).optional(),
            orden_compra_id: fields.id.optional(),
            orden_venta_id: fields.id.optional(),
            notas: fields.notas,
            items: Joi.array().items(
                Joi.object({
                    producto_id: fields.id.required(),
                    cantidad: fields.cantidad.required(),
                    ubicacion_origen_id: fields.id.optional(),
                    ubicacion_destino_id: fields.id.optional(),
                    lote_id: fields.id.optional(),
                    numero_serie: Joi.string().trim().max(100).optional()
                })
            ).min(1).required()
        })
    },

    /**
     * Schema para actualizar operacion
     * PUT /api/v1/inventario/operaciones-almacen/:id
     */
    actualizar: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            prioridad: Joi.string().valid('baja', 'normal', 'alta', 'urgente'),
            fecha_programada: fields.fechaHora.allow(null),
            notas: fields.notas
        }).min(1)
    },

    /**
     * Schema para asignar operador
     * POST /api/v1/inventario/operaciones-almacen/:id/asignar
     */
    asignar: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            operador_id: fields.id.required()
        })
    },

    /**
     * Schema para completar operacion
     * POST /api/v1/inventario/operaciones-almacen/:id/completar
     */
    completar: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            notas_cierre: fields.notas,
            forzar_completar: Joi.boolean().default(false).messages({
                'boolean.base': 'forzar_completar debe ser booleano'
            })
        })
    },

    /**
     * Schema para procesar item individual
     * POST /api/v1/inventario/operaciones-almacen/:id/items/:itemId/procesar
     */
    procesarItem: {
        params: Joi.object({
            id: fields.id.required(),
            itemId: fields.id.required()
        }),
        body: Joi.object({
            cantidad_procesada: fields.cantidad.required(),
            ubicacion_final_id: fields.id.optional(),
            lote_id: fields.id.optional(),
            numero_serie: Joi.string().trim().max(100).optional(),
            notas: fields.notas
        })
    }
};

module.exports = operacionesAlmacenSchemas;
