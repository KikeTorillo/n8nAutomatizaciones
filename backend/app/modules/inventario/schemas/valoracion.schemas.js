/**
 * Schemas de validacion - Valoracion de Inventario
 * @module inventario/schemas/valoracion.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const valoracionSchemas = {
    /**
     * Schema para actualizar configuracion de valoracion
     * PUT /api/v1/inventario/valoracion/configuracion
     */
    actualizarConfiguracion: {
        body: Joi.object({
            metodo_valuacion: Joi.string().valid('PEPS', 'UEPS', 'promedio', 'costo_estandar').required().messages({
                'any.only': 'Metodo de valuacion debe ser PEPS, UEPS, promedio o costo_estandar'
            }),
            moneda_base: Joi.string().trim().length(3).uppercase().default('MXN'),
            incluir_costos_indirectos: Joi.boolean().default(false),
            porcentaje_costos_indirectos: fields.porcentaje.when('incluir_costos_indirectos', {
                is: true,
                then: Joi.required()
            }),
            recalcular_automatico: Joi.boolean().default(true),
            frecuencia_recalculo: Joi.string().valid('diario', 'semanal', 'mensual').default('diario')
        })
    },

    /**
     * Schema para obtener valor total de inventario
     * GET /api/v1/inventario/valoracion/total
     */
    valorTotal: {
        query: Joi.object({
            almacen_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            categoria_id: fields.id.optional(),
            fecha: fields.fecha.optional(),
            metodo: Joi.string().valid('PEPS', 'UEPS', 'promedio', 'costo_estandar').optional(),
            agrupar_por: Joi.string().valid('almacen', 'categoria', 'proveedor').optional()
        })
    },

    /**
     * Schema para comparativa de valoracion por metodos
     * GET /api/v1/inventario/valoracion/comparativa
     */
    comparativa: {
        query: Joi.object({
            almacen_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            producto_id: fields.id.optional(),
            fecha: fields.fecha.optional()
        })
    },

    /**
     * Schema para reporte de diferencias de valoracion
     * GET /api/v1/inventario/valoracion/diferencias
     */
    reporteDiferencias: {
        query: Joi.object({
            almacen_id: fields.id.optional(),
            sucursal_id: fields.id.optional(),
            fecha_inicio: fields.fecha.required(),
            fecha_fin: fields.fecha.required(),
            umbral_diferencia: fields.porcentaje.default(5).messages({
                'number.base': 'umbral_diferencia debe ser un porcentaje'
            }),
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(50)
        })
    },

    /**
     * Schema para obtener valor de un producto especifico
     * GET /api/v1/inventario/valoracion/productos/:productoId
     */
    obtenerValorProducto: {
        params: Joi.object({
            productoId: fields.id.required()
        }),
        query: Joi.object({
            almacen_id: fields.id.optional(),
            fecha: fields.fecha.optional(),
            incluir_historico: Joi.boolean().default(false)
        })
    }
};

module.exports = valoracionSchemas;
