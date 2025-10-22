const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

const categorias = [
    'barberia', 'salon_belleza', 'estetica', 'spa',
    'podologia', 'medico', 'academia', 'taller_tecnico',
    'fitness', 'veterinaria', 'otro'
];

const industrias = [
    'academia', 'barberia', 'centro_fitness', 'consultorio_medico',
    'estetica', 'otro', 'podologia', 'salon_belleza', 'spa',
    'taller_tecnico', 'veterinaria'
];

const listar = {
    query: Joi.object({
        solo_sistema: Joi.boolean().optional(),
        solo_personalizados: Joi.boolean().optional(),
        tipo_industria: Joi.string().valid(...industrias).optional(),
        activo: Joi.boolean().optional()
    })
};

const obtener = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

const crear = {
    body: Joi.object({
        codigo: Joi.string()
            .pattern(/^[a-z_]+$/)
            .min(3)
            .max(50)
            .required()
            .messages({
                'string.pattern.base': 'El código solo puede contener letras minúsculas y guiones bajos'
            }),
        nombre: Joi.string()
            .min(3)
            .max(100)
            .required(),
        descripcion: Joi.string()
            .max(500)
            .optional()
            .allow(null),
        categoria: Joi.string()
            .valid(...categorias)
            .required(),
        industrias_compatibles: Joi.array()
            .items(Joi.string().valid(...industrias))
            .min(1)
            .required(),
        requiere_licencia: Joi.boolean()
            .optional()
            .default(false),
        nivel_experiencia_minimo: Joi.number()
            .integer()
            .min(0)
            .max(50)
            .optional()
            .default(0),
        icono: Joi.string()
            .max(50)
            .optional()
            .default('User'),
        color: Joi.string()
            .pattern(/^#[0-9A-Fa-f]{6}$/)
            .optional()
            .default('#808080')
            .messages({
                'string.pattern.base': 'El color debe ser hexadecimal válido (ej: #808080)'
            }),
        metadata: Joi.object()
            .optional()
            .default({})
    })
};

const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string().min(3).max(100).optional(),
        descripcion: Joi.string().max(500).optional().allow(null),
        categoria: Joi.string().valid(...categorias).optional(),
        industrias_compatibles: Joi.array().items(Joi.string().valid(...industrias)).min(1).optional(),
        requiere_licencia: Joi.boolean().optional(),
        nivel_experiencia_minimo: Joi.number().integer().min(0).max(50).optional(),
        icono: Joi.string().max(50).optional(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
        metadata: Joi.object().optional(),
        activo: Joi.boolean().optional()
    }).min(1)
};

const eliminar = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

module.exports = {
    listar,
    obtener,
    crear,
    actualizar,
    eliminar
};
