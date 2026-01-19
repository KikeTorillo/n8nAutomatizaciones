/**
 * Schemas de validacion - Configuracion de Almacen
 * @module inventario/schemas/configuracion-almacen.schemas
 */

const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

const configuracionAlmacenSchemas = {
    /**
     * Schema para actualizar configuracion de almacen
     * PUT /api/v1/inventario/almacenes/:almacenId/configuracion
     */
    actualizar: {
        params: Joi.object({
            almacenId: fields.id.required()
        }),
        body: Joi.object({
            // Configuracion de stock
            permitir_stock_negativo: Joi.boolean().default(false),
            alertar_stock_bajo: Joi.boolean().default(true),
            dias_stock_seguridad: Joi.number().integer().min(0).max(365).default(7),

            // Configuracion de ubicaciones
            usar_ubicaciones: Joi.boolean().default(true),
            formato_ubicacion: Joi.string().valid('simple', 'jerarquico', 'coordenadas').default('simple'),
            niveles_ubicacion: Joi.number().integer().min(1).max(5).default(3),
            prefijo_ubicaciones: Joi.string().trim().max(10).optional(),

            // Configuracion de lotes y series
            usar_lotes: Joi.boolean().default(false),
            usar_numeros_serie: Joi.boolean().default(false),
            lote_obligatorio_entrada: Joi.boolean().default(false),
            serie_obligatorio_entrada: Joi.boolean().default(false),

            // Configuracion de FIFO/LIFO
            metodo_salida: Joi.string().valid('FIFO', 'LIFO', 'FEFO', 'manual').default('FIFO'),

            // Configuracion de recepcion
            requiere_inspeccion_entrada: Joi.boolean().default(false),
            tolerancia_recepcion_porcentaje: fields.porcentaje.default(0),

            // Configuracion de conteos
            frecuencia_conteo_ciclico: Joi.string().valid('diario', 'semanal', 'mensual', 'trimestral').default('mensual'),
            hora_conteo_programado: fields.hora.optional(),

            // Notificaciones
            email_alertas: fields.email.optional(),
            webhook_url: fields.url
        }).min(1)
    },

    /**
     * Schema para crear ubicaciones por defecto
     * POST /api/v1/inventario/almacenes/:almacenId/ubicaciones/default
     */
    crearUbicacionesDefault: {
        params: Joi.object({
            almacenId: fields.id.required()
        }),
        body: Joi.object({
            zonas: Joi.array().items(
                Joi.object({
                    nombre: fields.nombre.required(),
                    codigo: fields.codigo.required(),
                    tipo: Joi.string().valid('recepcion', 'almacenamiento', 'picking', 'expedicion', 'cuarentena').default('almacenamiento'),
                    filas: Joi.number().integer().min(1).max(100).default(1),
                    columnas: Joi.number().integer().min(1).max(100).default(1),
                    niveles: Joi.number().integer().min(1).max(10).default(1)
                })
            ).min(1).required().messages({
                'array.min': 'Debe definir al menos una zona'
            }),
            incluir_ubicacion_default: Joi.boolean().default(true),
            incluir_ubicacion_transito: Joi.boolean().default(true)
        })
    }
};

module.exports = configuracionAlmacenSchemas;
