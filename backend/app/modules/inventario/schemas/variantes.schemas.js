const Joi = require('joi');
const { fields } = require('../../../schemas/shared');

/**
 * Schemas de validacion para atributos y variantes de producto
 */

// =========================================================================
// ATRIBUTOS
// =========================================================================

const crearAtributo = Joi.object({
    nombre: Joi.string().max(50).required()
        .messages({
            'string.max': 'El nombre no puede exceder 50 caracteres',
            'any.required': 'El nombre es requerido'
        }),
    codigo: Joi.string().max(30).required()
        .messages({
            'string.max': 'El codigo no puede exceder 30 caracteres',
            'any.required': 'El codigo es requerido'
        }),
    tipo_visualizacion: Joi.string()
        .valid('dropdown', 'buttons', 'color_swatches')
        .default('dropdown'),
    orden: Joi.number().integer().min(0).default(0)
});

const actualizarAtributo = Joi.object({
    nombre: Joi.string().max(50),
    codigo: Joi.string().max(30),
    tipo_visualizacion: Joi.string()
        .valid('dropdown', 'buttons', 'color_swatches'),
    orden: Joi.number().integer().min(0),
    activo: Joi.boolean()
});

// =========================================================================
// VALORES DE ATRIBUTO
// =========================================================================

const crearValor = Joi.object({
    valor: Joi.string().max(50).required()
        .messages({
            'string.max': 'El valor no puede exceder 50 caracteres',
            'any.required': 'El valor es requerido'
        }),
    codigo: Joi.string().max(30).required()
        .messages({
            'string.max': 'El codigo no puede exceder 30 caracteres',
            'any.required': 'El codigo es requerido'
        }),
    color_hex: fields.colorHex.allow(null),
    orden: Joi.number().integer().min(0).default(0)
});

const actualizarValor = Joi.object({
    valor: Joi.string().max(50),
    codigo: Joi.string().max(30),
    color_hex: fields.colorHex.allow(null),
    orden: Joi.number().integer().min(0),
    activo: Joi.boolean()
});

// =========================================================================
// VARIANTES
// =========================================================================

const crearVariante = Joi.object({
    sku: Joi.string().max(50).allow(null, ''),
    codigo_barras: Joi.string().max(50).allow(null, ''),
    nombre_variante: Joi.string().max(200).required()
        .messages({
            'string.max': 'El nombre no puede exceder 200 caracteres',
            'any.required': 'El nombre de la variante es requerido'
        }),
    precio_compra: Joi.number().min(0).allow(null),
    precio_venta: Joi.number().min(0).allow(null),
    stock_actual: Joi.number().integer().min(0).default(0),
    stock_minimo: Joi.number().integer().min(0).default(5),
    stock_maximo: Joi.number().integer().min(0).default(100),
    imagen_url: Joi.string().uri().allow(null, ''),
    atributos: Joi.array().items(
        Joi.object({
            atributo_id: Joi.number().integer().required(),
            valor_id: Joi.number().integer().required()
        })
    ).default([])
});

const actualizarVariante = Joi.object({
    sku: Joi.string().max(50).allow(null, ''),
    codigo_barras: Joi.string().max(50).allow(null, ''),
    nombre_variante: Joi.string().max(200),
    precio_compra: Joi.number().min(0).allow(null),
    precio_venta: Joi.number().min(0).allow(null),
    stock_minimo: Joi.number().integer().min(0),
    stock_maximo: Joi.number().integer().min(0),
    imagen_url: Joi.string().uri().allow(null, ''),
    activo: Joi.boolean()
});

const generarVariantes = Joi.object({
    atributos: Joi.array().items(
        Joi.object({
            atributo_id: Joi.number().integer().required()
                .messages({
                    'any.required': 'El ID del atributo es requerido'
                }),
            valores: Joi.array().items(Joi.number().integer()).min(1).required()
                .messages({
                    'array.min': 'Debe seleccionar al menos un valor',
                    'any.required': 'Los valores son requeridos'
                })
        })
    ).min(1).required()
        .messages({
            'array.min': 'Debe seleccionar al menos un atributo',
            'any.required': 'Los atributos son requeridos'
        }),
    opciones: Joi.object({
        sku_base: Joi.string().max(30).allow(null, ''),
        precio_compra: Joi.number().min(0).allow(null),
        precio_venta: Joi.number().min(0).allow(null)
    }).default({})
});

const ajustarStock = Joi.object({
    cantidad: Joi.number().integer().not(0).required()
        .messages({
            'number.base': 'La cantidad debe ser un numero',
            'any.invalid': 'La cantidad no puede ser 0',
            'any.required': 'La cantidad es requerida'
        }),
    tipo: Joi.string()
        .valid(
            'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
            'salida_venta', 'salida_uso_servicio', 'salida_merma',
            'salida_robo', 'salida_devolucion', 'salida_ajuste'
        )
        .required()
        .messages({
            'any.only': 'Tipo de movimiento invalido',
            'any.required': 'El tipo de movimiento es requerido'
        }),
    motivo: Joi.string().max(500).allow(null, '')
});

// =========================================================================
// BUSQUEDA
// =========================================================================

const buscarVariante = Joi.object({
    termino: Joi.string().required()
        .messages({
            'any.required': 'El termino de busqueda es requerido'
        })
});

module.exports = {
    // Atributos
    crearAtributo,
    actualizarAtributo,

    // Valores
    crearValor,
    actualizarValor,

    // Variantes
    crearVariante,
    actualizarVariante,
    generarVariantes,
    ajustarStock,
    buscarVariante
};
