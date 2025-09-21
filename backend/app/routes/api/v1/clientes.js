/**
 * Rutas de Clientes
 * Endpoints para gestión CRUD de clientes con aislamiento multi-tenant
 * Incluye middleware de autenticación, tenant y validaciones
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const ClienteController = require('../../../controllers/cliente.controller');
const { auth, tenant } = require('../../../middleware');

// Middleware para procesar validaciones de express-validator
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array(),
            timestamp: new Date().toISOString()
        });
    }
    next();
};

const router = express.Router();

/**
 * @route   POST /api/v1/clientes
 * @desc    Crear nuevo cliente
 * @access  Private (admin, organizacion_admin, manager, empleado)
 */
router.post('/',
    auth.authenticateToken,
    [
        body('nombre')
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre debe tener entre 2 y 150 caracteres')
            .trim(),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email no válido')
            .normalizeEmail(),
        body('telefono')
            .optional()
            .matches(/^[\+]?[1-9][\d]{0,15}$/)
            .withMessage('Teléfono debe ser un número válido con código de país opcional'),
        body('fecha_nacimiento')
            .optional()
            .isISO8601()
            .withMessage('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
            .custom((value) => {
                if (value) {
                    const fecha = new Date(value);
                    const hoy = new Date();
                    const edad = hoy.getFullYear() - fecha.getFullYear();
                    if (edad < 0 || edad > 120) {
                        throw new Error('La edad debe estar entre 0 y 120 años');
                    }
                }
                return true;
            }),
        body('genero')
            .optional()
            .isIn(['masculino', 'femenino', 'otro', 'prefiero_no_decir'])
            .withMessage('Género debe ser: masculino, femenino, otro, prefiero_no_decir'),
        body('direccion')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Dirección no puede exceder 500 caracteres')
            .trim(),
        body('notas')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Notas no pueden exceder 1000 caracteres')
            .trim(),
        body('preferencias')
            .optional()
            .isObject()
            .withMessage('Preferencias debe ser un objeto JSON válido'),
        body('acepta_marketing')
            .optional()
            .isBoolean()
            .withMessage('Acepta marketing debe ser un booleano'),
        body('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un número entero positivo')
    ],
    handleValidation,
    ClienteController.crear
);

/**
 * @route   GET /api/v1/clientes
 * @desc    Listar clientes con filtros y paginación
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/',
    auth.authenticateToken,
    [
        query('activo')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('Activo debe ser true o false'),
        query('genero')
            .optional()
            .isIn(['masculino', 'femenino', 'otro', 'prefiero_no_decir'])
            .withMessage('Género debe ser: masculino, femenino, otro, prefiero_no_decir'),
        query('acepta_marketing')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('Acepta marketing debe ser true o false'),
        query('busqueda')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Búsqueda debe tener entre 2 y 100 caracteres')
            .trim(),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Límite debe ser entre 1 y 100'),
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset debe ser mayor o igual a 0'),
        query('orden')
            .optional()
            .isIn(['nombre', 'email', 'fecha_registro', 'ultima_visita'])
            .withMessage('Orden debe ser: nombre, email, fecha_registro, ultima_visita'),
        query('direccion')
            .optional()
            .isIn(['ASC', 'DESC', 'asc', 'desc'])
            .withMessage('Dirección debe ser ASC o DESC'),
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un número entero positivo')
    ],
    handleValidation,
    ClienteController.listar
);

/**
 * @route   GET /api/v1/clientes/estadisticas
 * @desc    Obtener estadísticas de clientes de la organización
 * @access  Private (admin, organizacion_admin, manager)
 */
router.get('/estadisticas',
    auth.authenticateToken,
    [
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un número entero positivo')
    ],
    handleValidation,
    // Verificar permisos de administrador o manager
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin', 'manager'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores y managers pueden ver estadísticas',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ClienteController.obtenerEstadisticas
);

/**
 * @route   GET /api/v1/clientes/buscar
 * @desc    Buscar clientes por texto (nombre, email, teléfono)
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/buscar',
    auth.authenticateToken,
    [
        query('q')
            .isLength({ min: 2, max: 100 })
            .withMessage('Query de búsqueda debe tener entre 2 y 100 caracteres')
            .trim(),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Límite debe ser entre 1 y 50'),
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un número entero positivo')
    ],
    handleValidation,
    ClienteController.buscar
);

/**
 * @route   GET /api/v1/clientes/:id
 * @desc    Obtener cliente por ID
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
    ],
    handleValidation,
    ClienteController.obtenerPorId
);

/**
 * @route   PUT /api/v1/clientes/:id
 * @desc    Actualizar cliente
 * @access  Private (admin, organizacion_admin, manager, empleado)
 */
router.put('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('nombre')
            .optional()
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre debe tener entre 2 y 150 caracteres')
            .trim(),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email no válido')
            .normalizeEmail(),
        body('telefono')
            .optional()
            .matches(/^[\+]?[1-9][\d]{0,15}$/)
            .withMessage('Teléfono debe ser un número válido con código de país opcional'),
        body('fecha_nacimiento')
            .optional()
            .isISO8601()
            .withMessage('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
            .custom((value) => {
                if (value) {
                    const fecha = new Date(value);
                    const hoy = new Date();
                    const edad = hoy.getFullYear() - fecha.getFullYear();
                    if (edad < 0 || edad > 120) {
                        throw new Error('La edad debe estar entre 0 y 120 años');
                    }
                }
                return true;
            }),
        body('genero')
            .optional()
            .isIn(['masculino', 'femenino', 'otro', 'prefiero_no_decir'])
            .withMessage('Género debe ser: masculino, femenino, otro, prefiero_no_decir'),
        body('direccion')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Dirección no puede exceder 500 caracteres')
            .trim(),
        body('notas')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Notas no pueden exceder 1000 caracteres')
            .trim(),
        body('preferencias')
            .optional()
            .isObject()
            .withMessage('Preferencias debe ser un objeto JSON válido'),
        body('acepta_marketing')
            .optional()
            .isBoolean()
            .withMessage('Acepta marketing debe ser un booleano')
    ],
    handleValidation,
    ClienteController.actualizar
);

/**
 * @route   PATCH /api/v1/clientes/:id/estado
 * @desc    Cambiar estado de cliente (activar/desactivar)
 * @access  Private (admin, organizacion_admin, manager)
 */
router.patch('/:id/estado',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('activo')
            .isBoolean()
            .withMessage('Activo debe ser un booleano'),
        body('motivo_inactividad')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Motivo de inactividad no puede exceder 500 caracteres')
            .trim()
    ],
    handleValidation,
    // Verificar permisos de administrador o manager
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin', 'manager'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores y managers pueden cambiar estado de clientes',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ClienteController.cambiarEstado
);

/**
 * @route   DELETE /api/v1/clientes/:id
 * @desc    Eliminar cliente (soft delete)
 * @access  Private (admin, organizacion_admin)
 */
router.delete('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('motivo')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Motivo no puede exceder 500 caracteres')
            .trim()
    ],
    handleValidation,
    // Verificar permisos de administrador (más restrictivo que cambiar estado)
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden eliminar clientes',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ClienteController.eliminar
);

module.exports = router;