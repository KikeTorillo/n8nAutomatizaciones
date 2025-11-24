const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin lo envía
        email: commonSchemas.emailRequired,
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'Password debe tener al menos 8 caracteres',
                'string.max': 'Password no puede exceder 128 caracteres',
                'string.pattern.base': 'Password debe contener al menos una minúscula, una mayúscula y un número'
            }),
        nombre: Joi.string()
            .min(2)
            .max(150)
            .required()
            .trim(),
        apellidos: Joi.string()
            .max(150)
            .optional()
            .trim(),
        telefono: commonSchemas.mexicanPhone.optional(),
        rol: Joi.string()
            .valid('admin', 'propietario', 'empleado', 'cliente')
            .optional()
            .default('empleado'),
        profesional_id: commonSchemas.id.optional(),
        activo: Joi.boolean()
            .optional()
            .default(true),
        email_verificado: Joi.boolean()
            .optional()
            .default(false)
    })
};

const listar = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin
        rol: Joi.string()
            .valid('admin', 'propietario', 'empleado', 'cliente')
            .optional(),
        activo: Joi.string()
            .valid('true', 'false')
            .optional(),
        email_verificado: Joi.string()
            .valid('true', 'false')
            .optional(),
        buscar: Joi.string()
            .min(2)
            .max(100)
            .trim()
            .optional(),
        page: Joi.number()
            .integer()
            .min(1)
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(10),
        order_by: Joi.string()
            .valid('creado_en', 'nombre', 'email', 'ultimo_login')
            .default('creado_en'),
        order_direction: Joi.string()
            .valid('ASC', 'DESC')
            .default('DESC')
    })
};

const obtenerBloqueados = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const obtenerPorId = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const verificarBloqueo = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

const actualizar = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        nombre: Joi.string()
            .min(2)
            .max(150)
            .trim()
            .optional(),
        apellidos: Joi.string()
            .max(150)
            .trim()
            .optional(),
        telefono: commonSchemas.mexicanPhone.optional(),
        zona_horaria: Joi.string()
            .min(3)
            .max(50)
            .optional(),
        idioma: Joi.string()
            .valid('es', 'en', 'fr', 'pt')
            .optional(),
        configuracion_ui: Joi.object()
            .optional()
    }).min(1), // Al menos un campo debe estar presente
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const cambiarRol = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        rol: Joi.string()
            .valid('admin', 'propietario', 'empleado', 'cliente')
            .required()
    }),
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional() // Solo super_admin
    })
};

const desbloquear = {
    params: Joi.object({
        id: commonSchemas.id
    })
};

module.exports = {
    crear,
    listar,
    obtenerBloqueados,
    obtenerPorId,
    verificarBloqueo,
    actualizar,
    cambiarRol,
    desbloquear
};
