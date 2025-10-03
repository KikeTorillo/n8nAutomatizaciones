/**
 * Rutas de Usuarios
 * Endpoints para gestión CRUD de usuarios con aislamiento multi-tenant
 * Incluye middleware de autenticación, tenant y validaciones
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const UsuarioController = require('../../../controllers/usuario.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');

const router = express.Router();

/**
 * @route   POST /api/v1/usuarios
 * @desc    Crear nuevo usuario
 * @access  Private (admin, propietario, super_admin)
 */
router.post('/',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        body('email')
            .isEmail()
            .withMessage('Email no válido')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8, max: 128 })
            .withMessage('Password debe tener entre 8 y 128 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password debe contener al menos una minúscula, una mayúscula y un número'),
        body('nombre')
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre debe tener entre 2 y 150 caracteres')
            .trim(),
        body('apellidos')
            .optional()
            .isLength({ max: 150 })
            .withMessage('Apellidos no pueden exceder 150 caracteres')
            .trim(),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono no válido'),
        body('rol')
            .optional()
            .isIn(['admin', 'propietario', 'empleado', 'cliente'])
            .withMessage('Rol no válido. Opciones: admin, propietario, empleado, cliente'),
        body('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un entero positivo'),
        body('profesional_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de profesional debe ser un entero positivo'),
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un valor booleano'),
        body('email_verificado')
            .optional()
            .isBoolean()
            .withMessage('Email verificado debe ser un valor booleano')
    ],
    validation.handleValidation,
    UsuarioController.crear
);

/**
 * @route   GET /api/v1/usuarios
 * @desc    Listar usuarios de la organización
 * @access  Private (admin, propietario, super_admin)
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    [
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un entero positivo'),
        query('rol')
            .optional()
            .isIn(['admin', 'propietario', 'empleado', 'cliente'])
            .withMessage('Rol no válido'),
        query('activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un valor booleano'),
        query('email_verificado')
            .optional()
            .isBoolean()
            .withMessage('Email verificado debe ser un valor booleano'),
        query('buscar')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Búsqueda debe tener entre 2 y 100 caracteres')
            .trim(),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Página debe ser un entero positivo'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Límite debe ser entre 1 y 100'),
        query('order_by')
            .optional()
            .isIn(['creado_en', 'nombre', 'email', 'ultimo_login'])
            .withMessage('Campo de ordenamiento no válido'),
        query('order_direction')
            .optional()
            .isIn(['ASC', 'DESC'])
            .withMessage('Dirección de ordenamiento debe ser ASC o DESC')
    ],
    validation.handleValidation,
    UsuarioController.listar
);

/**
 * @route   GET /api/v1/usuarios/bloqueados
 * @desc    Obtener usuarios bloqueados de la organización
 * @access  Private (admin, propietario, super_admin)
 */
router.get('/bloqueados',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    [
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un entero positivo')
    ],
    validation.handleValidation,
    UsuarioController.obtenerBloqueados
);

/**
 * @route   GET /api/v1/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Private (self-access, admin, propietario, super_admin)
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un entero positivo'),
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un entero positivo')
    ],
    validation.handleValidation,
    UsuarioController.obtenerPorId
);

/**
 * @route   GET /api/v1/usuarios/:id/bloqueo
 * @desc    Verificar estado de bloqueo de usuario
 * @access  Private (self-access, admin, propietario, super_admin)
 */
router.get('/:id/bloqueo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un entero positivo')
    ],
    validation.handleValidation,
    UsuarioController.verificarBloqueo
);

/**
 * @route   PUT /api/v1/usuarios/:id
 * @desc    Actualizar perfil de usuario
 * @access  Private (self-access, admin, propietario, super_admin)
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un entero positivo'),
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un entero positivo'),
        body('nombre')
            .optional()
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre debe tener entre 2 y 150 caracteres')
            .trim(),
        body('apellidos')
            .optional()
            .isLength({ max: 150 })
            .withMessage('Apellidos no pueden exceder 150 caracteres')
            .trim(),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono no válido'),
        body('zona_horaria')
            .optional()
            .isLength({ min: 3, max: 50 })
            .withMessage('Zona horaria debe tener entre 3 y 50 caracteres'),
        body('idioma')
            .optional()
            .isIn(['es', 'en', 'fr', 'pt'])
            .withMessage('Idioma no válido. Opciones: es, en, fr, pt'),
        body('configuracion_ui')
            .optional()
            .isObject()
            .withMessage('Configuración UI debe ser un objeto JSON válido')
    ],
    validation.handleValidation,
    UsuarioController.actualizar
);

/**
 * @route   PATCH /api/v1/usuarios/:id/rol
 * @desc    Cambiar rol de usuario
 * @access  Private (admin, propietario, super_admin)
 */
router.patch('/:id/rol',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un entero positivo'),
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un entero positivo'),
        body('rol')
            .isIn(['admin', 'propietario', 'empleado', 'cliente'])
            .withMessage('Rol no válido. Opciones: admin, propietario, empleado, cliente')
    ],
    validation.handleValidation,
    UsuarioController.cambiarRol
);

/**
 * @route   PATCH /api/v1/usuarios/:id/desbloquear
 * @desc    Desbloquear usuario
 * @access  Private (admin, propietario, super_admin)
 */
router.patch('/:id/desbloquear',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un entero positivo')
    ],
    validation.handleValidation,
    UsuarioController.desbloquear
);

module.exports = router;