/**
 * Schemas de Validación Joi para Autenticación
 * Valida todos los endpoints del módulo de autenticación
 */

const Joi = require('joi');
const { commonSchemas } = require('../middleware/validation');

/**
 * Schema para login
 * POST /auth/login
 */
const login = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        password: Joi.string()
            .min(8)
            .required()
            .messages({
                'string.min': 'Contraseña debe tener al menos 8 caracteres',
                'any.required': 'Contraseña es requerida'
            })
    })
};

/**
 * Schema para registro
 * POST /auth/register
 */
const register = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'Contraseña debe tener al menos 8 caracteres',
                'string.max': 'Contraseña no puede exceder 128 caracteres',
                'string.pattern.base': 'Contraseña debe contener al menos una mayúscula, una minúscula y un número',
                'any.required': 'Contraseña es requerida'
            }),
        nombre: Joi.string()
            .min(2)
            .max(150)
            .required()
            .trim()
            .messages({
                'string.min': 'Nombre debe tener al menos 2 caracteres',
                'string.max': 'Nombre no puede exceder 150 caracteres',
                'any.required': 'Nombre es requerido'
            }),
        apellidos: Joi.string()
            .max(150)
            .optional()
            .allow('')
            .trim(),
        telefono: Joi.string()
            .pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Teléfono no válido'
            }),
        rol: Joi.string()
            .valid('super_admin', 'admin', 'propietario', 'empleado', 'cliente')
            .optional()
            .default('empleado'),
        organizacion_id: commonSchemas.id.optional()
    })
};

/**
 * Schema para crear primer admin
 * POST /auth/crear-primer-admin
 */
const crearPrimerAdmin = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'Contraseña debe tener al menos 8 caracteres',
                'string.max': 'Contraseña no puede exceder 128 caracteres',
                'string.pattern.base': 'Contraseña debe contener al menos una mayúscula, una minúscula y un número'
            }),
        nombre: Joi.string()
            .min(2)
            .max(150)
            .required()
            .trim(),
        apellidos: Joi.string()
            .max(150)
            .optional()
            .allow('')
            .trim(),
        telefono: Joi.string()
            .pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Teléfono no válido'
            })
    })
};

/**
 * Schema para refresh token
 * POST /auth/refresh
 */
const refresh = {
    body: Joi.object({
        refreshToken: Joi.string()
            .optional()
            .messages({
                'string.base': 'Refresh token debe ser una cadena'
            })
    })
};

/**
 * Schema para logout
 * POST /auth/logout
 */
const logout = {
    // No requiere body, solo el token en header
};

/**
 * Schema para obtener usuario actual
 * GET /auth/me
 */
const me = {
    // No requiere parámetros, usa el token JWT
};

/**
 * Schema para cambiar contraseña
 * POST /auth/change-password
 */
const changePassword = {
    body: Joi.object({
        passwordAnterior: Joi.string()
            .required()
            .messages({
                'any.required': 'Contraseña anterior es requerida'
            }),
        passwordNueva: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .required()
            .messages({
                'string.min': 'Nueva contraseña debe tener al menos 8 caracteres',
                'string.max': 'Nueva contraseña no puede exceder 128 caracteres',
                'string.pattern.base': 'Nueva contraseña debe contener al menos una mayúscula, una minúscula y un número'
            })
    })
};

/**
 * Schema para actualizar perfil
 * PUT /auth/profile
 */
const updateProfile = {
    body: Joi.object({
        nombre: Joi.string()
            .min(2)
            .max(150)
            .optional()
            .trim(),
        apellidos: Joi.string()
            .max(150)
            .optional()
            .allow('')
            .trim(),
        telefono: Joi.string()
            .pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Teléfono no válido'
            }),
        zona_horaria: Joi.string()
            .max(50)
            .optional(),
        idioma: Joi.string()
            .max(5)
            .optional(),
        configuracion_ui: Joi.object()
            .optional()
    }).min(1) // Al menos un campo debe estar presente
};

/**
 * Schema para desbloquear usuario
 * POST /auth/unlock-user
 */
const unlockUser = {
    body: Joi.object({
        userId: commonSchemas.id.required()
            .messages({
                'any.required': 'userId es requerido'
            })
    })
};

/**
 * Schema para obtener usuarios bloqueados
 * GET /auth/blocked-users
 */
const getBlockedUsers = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional()
    })
};

/**
 * Schema para verificar bloqueo
 * GET /auth/check-lock/:userId
 */
const checkLock = {
    params: Joi.object({
        userId: commonSchemas.id.required()
    })
};

/**
 * Schema para registrar usuario en organización
 * POST /auth/registrar-usuario-org
 */
const registrarUsuarioOrg = {
    body: Joi.object({
        organizacion_id: commonSchemas.id.required()
            .messages({
                'any.required': 'organizacion_id es requerido'
            }),
        rol: Joi.string()
            .valid('admin', 'propietario', 'empleado', 'cliente')
            .required()
            .messages({
                'any.required': 'rol es requerido',
                'any.only': 'Rol debe ser: admin, propietario, empleado o cliente'
            }),
        usuario_data: Joi.object({
            email: commonSchemas.emailRequired,
            password: Joi.string()
                .min(8)
                .max(128)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
                .required(),
            nombre: Joi.string()
                .min(2)
                .max(150)
                .required()
                .trim(),
            apellidos: Joi.string()
                .max(150)
                .optional()
                .allow('')
                .trim(),
            telefono: Joi.string()
                .pattern(/^[+]?[0-9\s\-\(\)]{7,20}$/)
                .optional()
        }).required(),
        opciones: Joi.object({
            verificar_email_automaticamente: Joi.boolean().optional(),
            enviar_email_bienvenida: Joi.boolean().optional()
        }).optional()
    })
};

/**
 * Schema para verificar email
 * GET /auth/verificar-email/:token
 */
const verificarEmail = {
    params: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                'any.required': 'Token de verificación es requerido'
            })
    })
};

/**
 * Schema para cambiar rol de usuario
 * PUT /auth/cambiar-rol
 */
const cambiarRol = {
    body: Joi.object({
        usuario_id: commonSchemas.id.required()
            .messages({
                'any.required': 'usuario_id es requerido'
            }),
        nuevo_rol: Joi.string()
            .valid('admin', 'propietario', 'empleado', 'cliente')
            .required()
            .messages({
                'any.required': 'nuevo_rol es requerido',
                'any.only': 'Rol debe ser: admin, propietario, empleado o cliente'
            }),
        organizacion_id: commonSchemas.id.optional()
    })
};

/**
 * Schema para listar usuarios de organización
 * GET /auth/usuarios-organizacion
 */
const listarUsuariosOrg = {
    query: Joi.object({
        organizacion_id: commonSchemas.id.optional(),
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
            .max(100)
            .optional(),
        page: Joi.number()
            .integer()
            .min(1)
            .optional()
            .default(1),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)
            .optional()
            .default(10),
        order_by: Joi.string()
            .valid('creado_en', 'nombre', 'email', 'ultimo_login', 'id')
            .optional()
            .default('creado_en'),
        order_direction: Joi.string()
            .valid('ASC', 'DESC')
            .optional()
            .default('DESC')
    })
};

module.exports = {
    login,
    register,
    crearPrimerAdmin,
    refresh,
    logout,
    me,
    changePassword,
    updateProfile,
    unlockUser,
    getBlockedUsers,
    checkLock,
    registrarUsuarioOrg,
    verificarEmail,
    cambiarRol,
    listarUsuariosOrg
};
