/**
 * Schemas de Validación Joi para Autenticación
 * Valida todos los endpoints del módulo de autenticación
 */

const Joi = require('joi');
const { commonSchemas } = require('../../../middleware/validation');

// ============================================================
// CONSTANTES DE VALIDACIÓN
// ============================================================
const VALIDATION_CONSTANTS = {
    NOMBRE_MIN_LENGTH: 2,
    NOMBRE_MAX_LENGTH: 150,
    APELLIDOS_MAX_LENGTH: 150,
    BUSQUEDA_MAX_LENGTH: 100,
    PASSWORD_MIN: 8,
    PASSWORD_MAX: 128,

    /**
     * POLÍTICA DE CONTRASEÑAS DEL SISTEMA
     *
     * Requisitos:
     * - Mínimo 8 caracteres
     * - Al menos 1 mayúscula (A-Z)
     * - Al menos 1 minúscula (a-z)
     * - Al menos 1 número (0-9)
     * - Caracteres especiales: OPCIONALES (no requeridos)
     *
     * Nota: Este regex NO requiere caracteres especiales, solo verifica
     * que haya minúscula, mayúscula y número. Los caracteres especiales
     * son permitidos pero opcionales.
     *
     * Usado en:
     * - Registro de usuarios
     * - Reset de contraseña
     * - Cambio de contraseña
     */
    PASSWORD_STRONG_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,

    TOKEN_RESET_LENGTH: 64,
    ZONA_HORARIA_MAX: 50,
    IDIOMA_MAX: 5
};

// ============================================================
// SCHEMAS REUTILIZABLES DE CONTRASEÑA
// ============================================================
const passwordSchemas = {
    // Validación básica para login (solo mínimo requerido)
    basic: Joi.string()
        .min(VALIDATION_CONSTANTS.PASSWORD_MIN)
        .messages({
            'string.min': 'Contraseña debe tener al menos 8 caracteres',
            'any.required': 'Contraseña es requerida'
        }),

    // Validación fuerte para registro/cambio (incluye requisitos de complejidad)
    strong: Joi.string()
        .min(VALIDATION_CONSTANTS.PASSWORD_MIN)
        .max(VALIDATION_CONSTANTS.PASSWORD_MAX)
        .pattern(VALIDATION_CONSTANTS.PASSWORD_STRONG_PATTERN)
        .messages({
            'string.min': 'Contraseña debe tener al menos 8 caracteres',
            'string.max': 'Contraseña no puede exceder 128 caracteres',
            'string.pattern.base': 'Contraseña debe contener al menos una mayúscula, una minúscula y un número',
            'any.required': 'Contraseña es requerida'
        })
};

// ============================================================
// SCHEMAS REUTILIZABLES DE DATOS PERSONALES
// ============================================================
const personSchemas = {
    nombre: Joi.string()
        .min(VALIDATION_CONSTANTS.NOMBRE_MIN_LENGTH)
        .max(VALIDATION_CONSTANTS.NOMBRE_MAX_LENGTH)
        .trim(),

    apellidos: Joi.string()
        .max(VALIDATION_CONSTANTS.APELLIDOS_MAX_LENGTH)
        .allow('')
        .trim(),

    telefono: commonSchemas.mexicanPhone
};

// ============================================================
// SCHEMAS DE ENDPOINTS
// ============================================================

const login = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        password: passwordSchemas.basic.required()
    })
};

const register = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        password: passwordSchemas.strong.required(),
        nombre: personSchemas.nombre.required()
            .messages({
                'any.required': 'Nombre es requerido'
            }),
        apellidos: personSchemas.apellidos.optional(),
        telefono: personSchemas.telefono.optional(),
        rol: Joi.string()
            .valid('super_admin', 'admin', 'propietario', 'empleado', 'cliente')
            .optional()
            .default('empleado'),
        organizacion_id: Joi.when('rol', {
            is: 'super_admin',
            then: commonSchemas.id.optional(),
            otherwise: commonSchemas.id.required()
                .messages({
                    'any.required': 'organizacion_id es requerido para este rol'
                })
        })
    })
};

const crearPrimerAdmin = {
    body: Joi.object({
        email: commonSchemas.emailRequired,
        password: passwordSchemas.strong.required(),
        nombre: personSchemas.nombre.required(),
        apellidos: personSchemas.apellidos.optional(),
        telefono: personSchemas.telefono.optional()
    })
};

const refresh = {
    body: Joi.object({
        refreshToken: Joi.string()
            .optional()
            .messages({
                'string.base': 'Refresh token debe ser una cadena'
            })
    })
};

const logout = {}; // Sin body - autenticación por header

const me = {}; // Sin parámetros - usa JWT del header

const changePassword = {
    body: Joi.object({
        passwordAnterior: Joi.string()
            .required()
            .messages({
                'any.required': 'Contraseña anterior es requerida'
            }),
        passwordNueva: passwordSchemas.strong.required()
            .messages({
                'any.required': 'Nueva contraseña es requerida'
            })
    })
};

const updateProfile = {
    body: Joi.object({
        nombre: personSchemas.nombre.optional(),
        apellidos: personSchemas.apellidos.optional(),
        telefono: personSchemas.telefono.optional(),
        zona_horaria: Joi.string()
            .max(VALIDATION_CONSTANTS.ZONA_HORARIA_MAX)
            .optional(),
        idioma: Joi.string()
            .max(VALIDATION_CONSTANTS.IDIOMA_MAX)
            .optional(),
        configuracion_ui: Joi.object()
            .optional()
    }).min(1) // Al menos un campo debe estar presente
};

const unlockUser = {
    body: Joi.object({
        userId: commonSchemas.id.required()
            .messages({
                'any.required': 'userId es requerido'
            })
    })
};

const getBlockedUsers = {}; // organizacion_id viene del middleware tenant

const checkLock = {
    params: Joi.object({
        userId: commonSchemas.id.required()
    })
};

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
            password: passwordSchemas.strong.required(),
            nombre: personSchemas.nombre.required(),
            apellidos: personSchemas.apellidos.optional(),
            telefono: personSchemas.telefono.optional()
        }).required(),
        opciones: Joi.object({
            verificar_email_automaticamente: Joi.boolean().optional(),
            enviar_email_bienvenida: Joi.boolean().optional()
        }).optional()
    })
};

const verificarEmail = {
    params: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                'any.required': 'Token de verificación es requerido'
            })
    })
};

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

const listarUsuariosOrg = {
    query: Joi.object({
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
            .max(VALIDATION_CONSTANTS.BUSQUEDA_MAX_LENGTH)
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

const recuperarPassword = {
    body: Joi.object({
        email: commonSchemas.emailRequired
    })
};

const confirmarResetPassword = {
    params: Joi.object({
        token: Joi.string()
            .hex()
            .length(VALIDATION_CONSTANTS.TOKEN_RESET_LENGTH)
            .required()
            .messages({
                'string.hex': 'Token debe contener solo caracteres hexadecimales',
                'string.length': `Token debe tener exactamente ${VALIDATION_CONSTANTS.TOKEN_RESET_LENGTH} caracteres`,
                'any.required': 'Token es requerido'
            })
    }),
    body: Joi.object({
        passwordNueva: passwordSchemas.strong.required()
            .messages({
                'any.required': 'Nueva contraseña es requerida'
            }),
        confirmarPassword: Joi.string()
            .valid(Joi.ref('passwordNueva'))
            .optional()
            .messages({
                'any.only': 'La confirmación debe coincidir con la nueva contraseña'
            })
    })
};

const validarTokenReset = {
    params: Joi.object({
        token: Joi.string()
            .hex()
            .length(VALIDATION_CONSTANTS.TOKEN_RESET_LENGTH)
            .required()
            .messages({
                'string.hex': 'Token debe contener solo caracteres hexadecimales',
                'string.length': `Token debe tener exactamente ${VALIDATION_CONSTANTS.TOKEN_RESET_LENGTH} caracteres`,
                'any.required': 'Token es requerido'
            })
    })
};

const evaluarFortalezaPassword = {
    body: Joi.object({
        password: Joi.string()
            .required()
            .allow('')
            .max(VALIDATION_CONSTANTS.PASSWORD_MAX)
            .messages({
                'any.required': 'Contraseña es requerida para evaluar',
                'string.max': 'Contraseña demasiado larga para evaluar'
            })
    })
};

// ============================================================
// CAMBIO DE SUCURSAL - Ene 2026
// ============================================================
const cambiarSucursal = {
    body: Joi.object({
        sucursal_id: commonSchemas.id.required()
            .messages({
                'any.required': 'sucursal_id es requerido',
                'number.base': 'sucursal_id debe ser un número'
            })
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
    listarUsuariosOrg,
    // Password management schemas
    recuperarPassword,
    confirmarResetPassword,
    validarTokenReset,
    evaluarFortalezaPassword,
    // Cambio de sucursal - Ene 2026
    cambiarSucursal
};
