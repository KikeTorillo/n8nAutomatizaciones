/**
 * ====================================================================
 * SCHEMAS DE VALIDACIÓN - ETIQUETAS CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Schemas Joi para validación de endpoints de etiquetas
 *
 * ====================================================================
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

const LIMITES = {
    NOMBRE_MIN: 2,
    NOMBRE_MAX: 50,
    DESCRIPCION_MAX: 200,
    COLOR_PATTERN: /^#[0-9A-Fa-f]{6}$/
};

// Colores predefinidos (para referencia y validación opcional)
const COLORES_PREDEFINIDOS = [
    '#EF4444', // Rojo
    '#F59E0B', // Naranja
    '#10B981', // Verde
    '#3B82F6', // Azul
    '#8B5CF6', // Morado
    '#EC4899', // Rosa
    '#6366F1', // Indigo (default)
    '#14B8A6', // Teal
];

// ====================================================================
// CRUD ETIQUETAS
// ====================================================================

const crear = {
    body: Joi.object({
        nombre: Joi.string()
            .min(LIMITES.NOMBRE_MIN)
            .max(LIMITES.NOMBRE_MAX)
            .required()
            .trim()
            .messages({
                'string.min': `Nombre debe tener al menos ${LIMITES.NOMBRE_MIN} caracteres`,
                'string.max': `Nombre no puede exceder ${LIMITES.NOMBRE_MAX} caracteres`,
                'any.required': 'Nombre es requerido'
            }),
        color: Joi.string()
            .pattern(LIMITES.COLOR_PATTERN)
            .default('#6366F1')
            .messages({
                'string.pattern.base': 'Color debe ser un código hexadecimal válido (ej: #EF4444)'
            }),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .trim()
            .allow(null, '')
            .messages({
                'string.max': `Descripción no puede exceder ${LIMITES.DESCRIPCION_MAX} caracteres`
            }),
        orden: Joi.number()
            .integer()
            .min(0)
            .max(999)
            .default(0),
        activo: Joi.boolean()
            .default(true)
    })
};

const actualizar = {
    params: Joi.object({
        etiquetaId: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string()
            .min(LIMITES.NOMBRE_MIN)
            .max(LIMITES.NOMBRE_MAX)
            .trim()
            .messages({
                'string.min': `Nombre debe tener al menos ${LIMITES.NOMBRE_MIN} caracteres`,
                'string.max': `Nombre no puede exceder ${LIMITES.NOMBRE_MAX} caracteres`
            }),
        color: Joi.string()
            .pattern(LIMITES.COLOR_PATTERN)
            .messages({
                'string.pattern.base': 'Color debe ser un código hexadecimal válido (ej: #EF4444)'
            }),
        descripcion: Joi.string()
            .max(LIMITES.DESCRIPCION_MAX)
            .trim()
            .allow(null, '')
            .messages({
                'string.max': `Descripción no puede exceder ${LIMITES.DESCRIPCION_MAX} caracteres`
            }),
        orden: Joi.number()
            .integer()
            .min(0)
            .max(999),
        activo: Joi.boolean()
    }).min(1) // Al menos un campo
};

const listar = {
    query: Joi.object({
        soloActivas: Joi.string()
            .valid('true', 'false')
            .default('true')
    })
};

const obtenerPorId = {
    params: Joi.object({
        etiquetaId: commonSchemas.id
    })
};

const eliminar = {
    params: Joi.object({
        etiquetaId: commonSchemas.id
    })
};

// ====================================================================
// ASIGNACIÓN A CLIENTES
// ====================================================================

const asignarEtiquetas = {
    params: Joi.object({
        clienteId: commonSchemas.id
    }),
    body: Joi.object({
        etiqueta_ids: Joi.array()
            .items(commonSchemas.id)
            .max(10) // Máximo 10 etiquetas por cliente
            .required()
            .messages({
                'array.max': 'Un cliente puede tener máximo 10 etiquetas',
                'any.required': 'etiqueta_ids es requerido (puede ser array vacío)'
            })
    })
};

const obtenerEtiquetasCliente = {
    params: Joi.object({
        clienteId: commonSchemas.id
    })
};

const agregarEtiqueta = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        etiquetaId: commonSchemas.id
    })
};

const quitarEtiqueta = {
    params: Joi.object({
        clienteId: commonSchemas.id,
        etiquetaId: commonSchemas.id
    })
};

module.exports = {
    crear,
    actualizar,
    listar,
    obtenerPorId,
    eliminar,
    asignarEtiquetas,
    obtenerEtiquetasCliente,
    agregarEtiqueta,
    quitarEtiqueta,
    LIMITES,
    COLORES_PREDEFINIDOS
};
