/**
 * Schemas de validación - Ajustes Masivos de Inventario
 * @module inventario/schemas/ajustes-masivos.schemas
 */

const Joi = require('joi');

const ajustesMasivosSchemas = {
    /**
     * Schema para crear ajuste masivo
     * POST /api/v1/inventario/ajustes-masivos
     */
    crearAjusteMasivo: {
        body: Joi.object({
            archivo_nombre: Joi.string().max(255).required().messages({
                'any.required': 'El nombre del archivo es requerido',
                'string.max': 'El nombre del archivo no puede exceder 255 caracteres'
            }),
            items: Joi.array().items(
                Joi.object({
                    fila_numero: Joi.number().integer().positive().required().messages({
                        'any.required': 'El número de fila es requerido'
                    }),
                    sku: Joi.string().max(100).allow('', null).optional(),
                    codigo_barras: Joi.string().max(100).allow('', null).optional(),
                    cantidad_ajuste: Joi.number().integer().required().messages({
                        'any.required': 'La cantidad de ajuste es requerida',
                        'number.base': 'La cantidad debe ser un número entero'
                    }),
                    motivo: Joi.string().max(500).allow('', null).optional()
                }).custom((value, helpers) => {
                    // Validar que al menos uno de sku o codigo_barras esté presente
                    if (!value.sku && !value.codigo_barras) {
                        return helpers.error('custom.skuOrBarcode');
                    }
                    // Validar que cantidad no sea 0
                    if (value.cantidad_ajuste === 0) {
                        return helpers.error('custom.cantidadCero');
                    }
                    return value;
                }).messages({
                    'custom.skuOrBarcode': 'Debe proporcionar SKU o código de barras',
                    'custom.cantidadCero': 'La cantidad de ajuste no puede ser 0'
                })
            ).min(1).max(500).required().messages({
                'array.min': 'Debe incluir al menos un item',
                'array.max': 'No puede exceder 500 items por archivo',
                'any.required': 'Los items son requeridos'
            })
        })
    },

    /**
     * Schema para listar ajustes masivos
     * GET /api/v1/inventario/ajustes-masivos
     */
    listarAjustesMasivos: {
        query: Joi.object({
            estado: Joi.string().valid('pendiente', 'validado', 'aplicado', 'con_errores').optional(),
            fecha_desde: Joi.string().isoDate().optional(),
            fecha_hasta: Joi.string().isoDate().optional(),
            folio: Joi.string().max(20).optional(),
            limit: Joi.number().integer().min(1).max(100).default(20),
            offset: Joi.number().integer().min(0).default(0)
        })
    },

    /**
     * Schema para obtener ajuste masivo por ID
     * GET /api/v1/inventario/ajustes-masivos/:id
     */
    obtenerAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required().messages({
                'any.required': 'El ID del ajuste es requerido'
            })
        })
    },

    /**
     * Schema para validar ajuste masivo
     * POST /api/v1/inventario/ajustes-masivos/:id/validar
     */
    validarAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para aplicar ajuste masivo
     * POST /api/v1/inventario/ajustes-masivos/:id/aplicar
     */
    aplicarAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    },

    /**
     * Schema para cancelar ajuste masivo
     * DELETE /api/v1/inventario/ajustes-masivos/:id
     */
    cancelarAjusteMasivo: {
        params: Joi.object({
            id: Joi.number().integer().positive().required()
        })
    }
};

module.exports = ajustesMasivosSchemas;
