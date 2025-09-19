/**
 * @fileoverview Rutas de Autenticación para API SaaS
 * @description Define endpoints de login, registro, refresh token y gestión de usuarios
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const AuthController = require('../../../controllers/auth.controller');
const middleware = require('../../../middleware');

// Middleware para manejar errores de validación de express-validator
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    next();
};

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Autenticación]
 */
router.post('/login',
    // Rate limiting específico para login
    middleware.rateLimiting.authRateLimit,

    // Validaciones de entrada
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email debe tener formato válido'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Contraseña debe tener al menos 8 caracteres')
    ],

    // Middleware de validación
    handleValidationErrors,

    AuthController.login
);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registro de nuevo usuario
 *     tags: [Autenticación]
 */
router.post('/register',
    // Rate limiting para registro
    middleware.rateLimiting.apiRateLimit,

    // Validaciones de entrada
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email debe tener formato válido'),
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número'),
        body('nombre')
            .isLength({ min: 2, max: 150 })
            .trim()
            .withMessage('Nombre debe tener entre 2 y 150 caracteres'),
        body('apellidos')
            .optional()
            .isLength({ max: 150 })
            .trim()
            .withMessage('Apellidos no pueden exceder 150 caracteres'),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono debe tener formato válido'),
        body('rol')
            .optional()
            .isIn(['super_admin', 'admin', 'propietario', 'empleado', 'cliente'])
            .withMessage('Rol debe ser válido'),
        body('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero positivo')
    ],

    // Middleware de validación
    handleValidationErrors,

    AuthController.register
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refrescar access token
 *     tags: [Autenticación]
 */
router.post('/refresh',
    middleware.rateLimiting.apiRateLimit,
    AuthController.refresh
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Autenticación]
 */
router.post('/logout',
    middleware.rateLimiting.apiRateLimit,
    AuthController.logout
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener información del usuario actual
 *     tags: [Autenticación]
 */
router.get('/me',
    middleware.rateLimiting.apiRateLimit,
    middleware.auth.authenticateToken, // Middleware de autenticación requerido
    AuthController.me
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario actual
 *     tags: [Autenticación]
 */
router.post('/change-password',
    middleware.rateLimiting.heavyOperationRateLimit, // Rate limiting más estricto para cambio de contraseña
    middleware.auth.authenticateToken, // Autenticación requerida

    // Validaciones
    [
        body('passwordAnterior')
            .notEmpty()
            .withMessage('Contraseña anterior es requerida'),
        body('passwordNueva')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número')
    ],

    // Middleware de validación
    handleValidationErrors,

    AuthController.cambiarPassword
);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   put:
 *     summary: Actualizar perfil del usuario actual
 *     tags: [Autenticación]
 */
router.put('/profile',
    middleware.rateLimiting.apiRateLimit,
    middleware.auth.authenticateToken, // Autenticación requerida

    // Validaciones opcionales (solo se validan si están presentes)
    [
        body('nombre')
            .optional()
            .isLength({ min: 2, max: 150 })
            .trim()
            .withMessage('Nombre debe tener entre 2 y 150 caracteres'),
        body('apellidos')
            .optional()
            .isLength({ max: 150 })
            .trim()
            .withMessage('Apellidos no pueden exceder 150 caracteres'),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono debe tener formato válido'),
        body('zona_horaria')
            .optional()
            .isLength({ max: 50 })
            .withMessage('Zona horaria no puede exceder 50 caracteres'),
        body('idioma')
            .optional()
            .isLength({ max: 5 })
            .withMessage('Idioma no puede exceder 5 caracteres'),
        body('configuracion_ui')
            .optional()
            .isObject()
            .withMessage('configuracion_ui debe ser un objeto JSON')
    ],

    // Middleware de validación
    handleValidationErrors,

    AuthController.actualizarPerfil
);

/**
 * @swagger
 * /api/v1/auth/unlock-user:
 *   post:
 *     summary: Desbloquear usuario (solo administradores)
 *     tags: [Autenticación]
 */
router.post('/unlock-user',
    middleware.rateLimiting.heavyOperationRateLimit, // Rate limiting estricto para operaciones administrativas
    middleware.auth.authenticateToken, // Autenticación requerida

    // Validaciones
    [
        body('userId')
            .isInt({ min: 1 })
            .withMessage('userId debe ser un número entero positivo')
    ],

    // Middleware de validación
    handleValidationErrors,

    AuthController.desbloquearUsuario
);

/**
 * @swagger
 * /api/v1/auth/blocked-users:
 *   get:
 *     summary: Obtener lista de usuarios bloqueados (solo administradores)
 *     tags: [Autenticación]
 */
router.get('/blocked-users',
    middleware.rateLimiting.apiRateLimit,
    middleware.auth.authenticateToken, // Autenticación requerida
    AuthController.obtenerUsuariosBloqueados
);

/**
 * @swagger
 * /api/v1/auth/check-lock/{userId}:
 *   get:
 *     summary: Verificar estado de bloqueo de un usuario
 *     tags: [Autenticación]
 */
router.get('/check-lock/:userId',
    middleware.rateLimiting.apiRateLimit,
    middleware.auth.authenticateToken, // Autenticación requerida
    AuthController.verificarBloqueo
);

// === RUTAS DE DESARROLLO/TESTING ===

/**
 * Ruta de testing para verificar autenticación
 * Solo disponible en desarrollo
 */
if (process.env.NODE_ENV !== 'production') {
    router.get('/test-auth',
        middleware.auth.authenticateToken,
        (req, res) => {
            res.json({
                success: true,
                message: 'Autenticación funcionando correctamente',
                user: req.user,
                tenant: req.tenant
            });
        }
    );
}

module.exports = router;