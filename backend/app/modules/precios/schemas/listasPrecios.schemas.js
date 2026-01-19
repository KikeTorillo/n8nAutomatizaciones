/**
 * Schemas de validacion - Listas de Precios
 * @module precios/schemas/listasPrecios.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const listasPreciosSchemas = {
    /**
     * Schema para listar listas de precios
     * GET /api/v1/precios/listas
     */
    listar: {
        query: Joi.object({
            activo: fields.activoQuery,
            tipo: Joi.string().valid('venta', 'compra', 'promocion').optional(),
            cliente_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(20),
            orden: Joi.string().valid('nombre', 'creado_en', 'prioridad').default('nombre')
        })
    },

    /**
     * Schema para obtener lista por ID
     * GET /api/v1/precios/listas/:id
     */
    obtenerPorId: {
        params: Joi.object({
            id: fields.id.required()
        }),
        query: Joi.object({
            incluir_items: Joi.boolean().default(false)
        })
    },

    /**
     * Schema para crear lista de precios
     * POST /api/v1/precios/listas
     */
    crear: {
        body: Joi.object({
            nombre: fields.nombre.required(),
            descripcion: fields.descripcion,
            tipo: Joi.string().valid('venta', 'compra', 'promocion').required(),
            moneda_codigo: Joi.string().trim().length(3).uppercase().default('MXN'),
            prioridad: Joi.number().integer().min(0).max(100).default(0),
            fecha_inicio: fields.fecha.optional(),
            fecha_fin: fields.fecha.optional(),
            porcentaje_descuento_global: fields.porcentaje.optional(),
            sucursal_id: fields.id.optional(),
            aplica_todos_productos: Joi.boolean().default(true),
            activo: fields.activo
        }).custom((value, helpers) => {
            if (value.fecha_inicio && value.fecha_fin) {
                if (new Date(value.fecha_inicio) > new Date(value.fecha_fin)) {
                    return helpers.error('any.custom', { message: 'fecha_inicio debe ser anterior a fecha_fin' });
                }
            }
            return value;
        })
    },

    /**
     * Schema para actualizar lista de precios
     * PUT /api/v1/precios/listas/:id
     */
    actualizar: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            nombre: fields.nombre,
            descripcion: fields.descripcion,
            tipo: Joi.string().valid('venta', 'compra', 'promocion'),
            moneda_codigo: Joi.string().trim().length(3).uppercase(),
            prioridad: Joi.number().integer().min(0).max(100),
            fecha_inicio: fields.fecha.allow(null),
            fecha_fin: fields.fecha.allow(null),
            porcentaje_descuento_global: fields.porcentaje,
            aplica_todos_productos: Joi.boolean(),
            activo: Joi.boolean()
        }).min(1)
    },

    /**
     * Schema para agregar item a lista
     * POST /api/v1/precios/listas/:listaId/items
     */
    crearItem: {
        params: Joi.object({
            listaId: fields.id.required()
        }),
        body: Joi.object({
            producto_id: fields.id.required(),
            precio: fields.precio.required(),
            precio_minimo: fields.precio.optional(),
            porcentaje_descuento: fields.porcentaje.optional(),
            cantidad_minima: fields.cantidad.default(1),
            cantidad_maxima: fields.cantidad.optional()
        })
    },

    /**
     * Schema para actualizar item de lista
     * PUT /api/v1/precios/listas/:listaId/items/:itemId
     */
    actualizarItem: {
        params: Joi.object({
            listaId: fields.id.required(),
            itemId: fields.id.required()
        }),
        body: Joi.object({
            precio: fields.precio,
            precio_minimo: fields.precio,
            porcentaje_descuento: fields.porcentaje,
            cantidad_minima: fields.cantidad,
            cantidad_maxima: fields.cantidad.allow(null)
        }).min(1)
    },

    /**
     * Schema para asignar lista a cliente
     * POST /api/v1/precios/listas/:listaId/clientes
     */
    asignarCliente: {
        params: Joi.object({
            listaId: fields.id.required()
        }),
        body: Joi.object({
            cliente_id: fields.id.required()
        })
    },

    /**
     * Schema para asignar lista a multiples clientes
     * POST /api/v1/precios/listas/:listaId/clientes/bulk
     */
    asignarClientesBulk: {
        params: Joi.object({
            listaId: fields.id.required()
        }),
        body: Joi.object({
            cliente_ids: fields.ids.required()
        })
    }
};

module.exports = listasPreciosSchemas;
