/**
 * Schemas de validacion - Combos y Grupos Modificadores
 * @module inventario/schemas/combos.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const combosSchemas = {
    /**
     * Schema para crear combo
     * POST /api/v1/inventario/combos
     */
    crear: {
        body: Joi.object({
            nombre: fields.nombre.required(),
            descripcion: fields.descripcion,
            sku: fields.sku.optional(),
            precio_venta: fields.precio.required(),
            precio_costo: fields.precio.optional(),
            categoria_id: fields.id.optional(),
            imagen_url: fields.url,
            disponible_desde: fields.fechaHora.optional(),
            disponible_hasta: fields.fechaHora.optional(),
            disponible_dias: Joi.array().items(
                Joi.number().integer().min(0).max(6)
            ).optional(),
            activo: fields.activo,
            items: Joi.array().items(
                Joi.object({
                    producto_id: fields.id.required(),
                    cantidad: fields.cantidad.min(1).required(),
                    es_obligatorio: Joi.boolean().default(true),
                    precio_extra: fields.precio.default(0)
                })
            ).min(1).required()
        })
    },

    /**
     * Schema para actualizar combo
     * PUT /api/v1/inventario/combos/:id
     */
    actualizar: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            nombre: fields.nombre,
            descripcion: fields.descripcion,
            sku: fields.sku,
            precio_venta: fields.precio,
            precio_costo: fields.precio,
            categoria_id: fields.id.allow(null),
            imagen_url: fields.url,
            disponible_desde: fields.fechaHora.allow(null),
            disponible_hasta: fields.fechaHora.allow(null),
            disponible_dias: Joi.array().items(
                Joi.number().integer().min(0).max(6)
            ).allow(null),
            activo: Joi.boolean()
        }).min(1)
    },

    /**
     * Schema para crear grupo modificador
     * POST /api/v1/inventario/combos/grupos-modificadores
     */
    crearGrupoModificador: {
        body: Joi.object({
            nombre: fields.nombre.required(),
            descripcion: fields.descripcion,
            tipo: Joi.string().valid('unico', 'multiple', 'cantidad').default('unico'),
            obligatorio: Joi.boolean().default(false),
            min_seleccion: Joi.number().integer().min(0).default(0),
            max_seleccion: Joi.number().integer().min(1).default(1),
            orden: fields.orden,
            activo: fields.activo,
            opciones: Joi.array().items(
                Joi.object({
                    nombre: fields.nombre.required(),
                    precio_extra: fields.precio.default(0),
                    producto_id: fields.id.optional(),
                    es_default: Joi.boolean().default(false),
                    activo: Joi.boolean().default(true)
                })
            ).min(1).required()
        })
    },

    /**
     * Schema para actualizar grupo modificador
     * PUT /api/v1/inventario/combos/grupos-modificadores/:id
     */
    actualizarModificador: {
        params: Joi.object({
            id: fields.id.required()
        }),
        body: Joi.object({
            nombre: fields.nombre,
            descripcion: fields.descripcion,
            tipo: Joi.string().valid('unico', 'multiple', 'cantidad'),
            obligatorio: Joi.boolean(),
            min_seleccion: Joi.number().integer().min(0),
            max_seleccion: Joi.number().integer().min(1),
            orden: fields.orden,
            activo: Joi.boolean()
        }).min(1)
    },

    /**
     * Schema para asignar grupo modificador a combo
     * POST /api/v1/inventario/combos/:comboId/grupos/:grupoId
     */
    asignarGrupo: {
        params: Joi.object({
            comboId: fields.id.required(),
            grupoId: fields.id.required()
        }),
        body: Joi.object({
            orden: fields.orden.optional()
        })
    },

    /**
     * Schema para desasignar grupo modificador de combo
     * DELETE /api/v1/inventario/combos/:comboId/grupos/:grupoId
     */
    desasignarGrupo: {
        params: Joi.object({
            comboId: fields.id.required(),
            grupoId: fields.id.required()
        })
    },

    /**
     * Schema para agregar opcion a grupo
     * POST /api/v1/inventario/combos/grupos-modificadores/:grupoId/opciones
     */
    agregarOpcion: {
        params: Joi.object({
            grupoId: fields.id.required()
        }),
        body: Joi.object({
            nombre: fields.nombre.required(),
            precio_extra: fields.precio.default(0),
            producto_id: fields.id.optional(),
            es_default: Joi.boolean().default(false),
            activo: Joi.boolean().default(true)
        })
    },

    /**
     * Schema para actualizar opcion de grupo
     * PUT /api/v1/inventario/combos/grupos-modificadores/:grupoId/opciones/:opcionId
     */
    actualizarOpcion: {
        params: Joi.object({
            grupoId: fields.id.required(),
            opcionId: fields.id.required()
        }),
        body: Joi.object({
            nombre: fields.nombre,
            precio_extra: fields.precio,
            producto_id: fields.id.allow(null),
            es_default: Joi.boolean(),
            activo: Joi.boolean()
        }).min(1)
    }
};

module.exports = combosSchemas;
