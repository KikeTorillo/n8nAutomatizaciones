const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');
const { passwordSchemas } = require('../../../schemas/shared');

const crear = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.optional(), // Solo super_admin lo envía
        email: commonSchemas.emailRequired,
        // Ene 2026: Usar schema compartido de contraseñas
        password: passwordSchemas.strongRequired,
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

// ====================================================================
// GESTIÓN DE USUARIOS ESTILO ODOO - Dic 2025
// ====================================================================

/**
 * Schema para invitar usuario directo (sin profesional)
 * POST /usuarios/directo
 * Dic 2025: Cambiado para usar sistema de invitaciones (sin password)
 */
const crearDirecto = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        nombre: Joi.string()
            .min(2)
            .max(150)
            .required()
            .trim()
            .messages({
                'string.min': 'El nombre debe tener al menos 2 caracteres',
                'any.required': 'El nombre es obligatorio'
            }),
        apellidos: Joi.string()
            .max(150)
            .optional()
            .trim()
            .allow(''),
        rol: Joi.string()
            .valid('admin', 'propietario', 'empleado')
            .optional()
            .default('empleado')
    })
};

/**
 * Schema para cambiar estado activo de usuario
 * PATCH /usuarios/:id/estado
 */
const cambiarEstado = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        activo: Joi.boolean()
            .required()
            .messages({
                'any.required': 'El campo activo es obligatorio',
                'boolean.base': 'El campo activo debe ser verdadero o falso'
            })
    })
};

/**
 * Schema para vincular/desvincular profesional a usuario
 * PATCH /usuarios/:id/vincular-profesional
 */
const vincularProfesional = {
    params: Joi.object({
        id: commonSchemas.id
    }),
    body: Joi.object({
        profesional_id: Joi.number()
            .integer()
            .positive()
            .allow(null)
            .required()
            .messages({
                'number.base': 'El ID de profesional debe ser un número o null',
                'any.required': 'El campo profesional_id es obligatorio (usar null para desvincular)'
            })
    })
};

/**
 * Schema para obtener profesionales sin usuario
 * GET /usuarios/profesionales-disponibles
 */
const obtenerProfesionalesDisponibles = {
    query: Joi.object({})
};

/**
 * Schema para obtener usuarios sin profesional vinculado
 * GET /usuarios/sin-profesional
 * Ene 2026: Agregado validación Joi
 */
const obtenerUsuariosSinProfesional = {
    query: Joi.object({
        buscar: Joi.string()
            .min(2)
            .max(100)
            .trim()
            .optional(),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .default(50)
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
    desbloquear,
    // Nuevos - Dic 2025
    crearDirecto,
    cambiarEstado,
    vincularProfesional,
    obtenerProfesionalesDisponibles,
    // Ene 2026
    obtenerUsuariosSinProfesional
};
