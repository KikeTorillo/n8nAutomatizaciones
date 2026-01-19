const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { fields } = require('../../../schemas/shared');

// ====================================================================
// TIPOS DE CATEGORÍA
// ====================================================================
const TIPOS_CATEGORIA = ['especialidad', 'nivel', 'area', 'certificacion', 'general'];

// ====================================================================
// DEPARTAMENTOS
// ====================================================================

const departamentoCrear = {
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).required().trim(),
        descripcion: Joi.string().max(500).optional().allow(null),
        codigo: Joi.string().max(20).optional().allow(null).trim(),
        parent_id: commonSchemas.id.optional().allow(null),
        gerente_id: commonSchemas.id.optional().allow(null),
        activo: Joi.boolean().optional().default(true)
    })
};

const departamentoActualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).trim().optional(),
        descripcion: Joi.string().max(500).allow(null).optional(),
        codigo: Joi.string().max(20).allow(null).trim().optional(),
        parent_id: commonSchemas.id.optional().allow(null),
        gerente_id: commonSchemas.id.optional().allow(null),
        activo: Joi.boolean().optional()
    }).min(1)
};

const departamentoListar = {
    query: Joi.object({
        activo: Joi.string().valid('true', 'false').optional(),
        parent_id: Joi.number().integer().min(0).optional(), // 0 = raíz
        limit: Joi.number().integer().min(1).max(100).default(100),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// ====================================================================
// PUESTOS
// ====================================================================

const puestoCrear = {
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).required().trim(),
        descripcion: Joi.string().max(500).optional().allow(null),
        codigo: Joi.string().max(20).optional().allow(null).trim(),
        departamento_id: commonSchemas.id.optional().allow(null),
        salario_minimo: Joi.number().min(0).optional().allow(null),
        salario_maximo: Joi.number().min(0).optional().allow(null),
        activo: Joi.boolean().optional().default(true)
    })
};

const puestoActualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).trim().optional(),
        descripcion: Joi.string().max(500).allow(null).optional(),
        codigo: Joi.string().max(20).allow(null).trim().optional(),
        departamento_id: commonSchemas.id.optional().allow(null),
        salario_minimo: Joi.number().min(0).allow(null).optional(),
        salario_maximo: Joi.number().min(0).allow(null).optional(),
        activo: Joi.boolean().optional()
    }).min(1)
};

const puestoListar = {
    query: Joi.object({
        activo: Joi.string().valid('true', 'false').optional(),
        departamento_id: Joi.number().integer().positive().optional(),
        limit: Joi.number().integer().min(1).max(100).default(100),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// ====================================================================
// CATEGORÍAS DE PROFESIONAL
// ====================================================================

const categoriaCrear = {
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).required().trim(),
        descripcion: Joi.string().max(500).optional().allow(null),
        tipo_categoria: Joi.string().valid(...TIPOS_CATEGORIA).optional().default('general'),
        color: fields.colorHex.optional().default('#753572'),
        icono: Joi.string().max(50).optional().allow(null),
        orden: Joi.number().integer().min(0).optional().default(0),
        activo: Joi.boolean().optional().default(true)
    })
};

const categoriaActualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().min(2).max(100).trim().optional(),
        descripcion: Joi.string().max(500).allow(null).optional(),
        tipo_categoria: Joi.string().valid(...TIPOS_CATEGORIA).optional(),
        color: fields.colorHex.optional(),
        icono: Joi.string().max(50).allow(null).optional(),
        orden: Joi.number().integer().min(0).optional(),
        activo: Joi.boolean().optional()
    }).min(1)
};

const categoriaListar = {
    query: Joi.object({
        activo: Joi.string().valid('true', 'false').optional(),
        tipo_categoria: Joi.string().valid(...TIPOS_CATEGORIA).optional(),
        agrupado: Joi.string().valid('true', 'false').optional(),
        limit: Joi.number().integer().min(1).max(100).default(100),
        offset: Joi.number().integer().min(0).default(0)
    })
};

// ====================================================================
// COMÚN
// ====================================================================

const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

module.exports = {
    // Departamentos
    departamentoCrear,
    departamentoActualizar,
    departamentoListar,
    // Puestos
    puestoCrear,
    puestoActualizar,
    puestoListar,
    // Categorías
    categoriaCrear,
    categoriaActualizar,
    categoriaListar,
    // Común
    obtenerPorId,
    // Constantes
    TIPOS_CATEGORIA
};
