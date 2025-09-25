
/**
 * Rutas de Organizaciones
 * Endpoints para gestión CRUD de organizaciones (tenants)
 * Incluye middleware de autenticación y validaciones
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const OrganizacionController = require('../../../controllers/organizacion.controller');
const { auth, tenant } = require('../../../middleware');

// Middleware simple para procesar validaciones de express-validator
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
 * @route   POST /api/v1/organizaciones
 * @desc    Crear nueva organización
 * @access  Public (para registro inicial) / Private (super_admin)
 */
router.post('/',
    auth.authenticateToken, // Comentado temporalmente para testing
    [
        body('nombre_comercial')
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre comercial debe tener entre 2 y 150 caracteres')
            .trim(),
        body('configuracion_industria')
            .isIn(['barberia', 'salon_belleza', 'estetica', 'spa', 'podologia', 'consultorio_medico', 'academia', 'taller_tecnico', 'centro_fitness', 'veterinaria'])
            .withMessage('Configuración de industria no válida'),
        body('email_admin')
            .isEmail()
            .withMessage('Email del administrador no válido')
            .normalizeEmail(),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono no válido'),
        body('razon_social')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Razón social no puede exceder 200 caracteres')
            .trim(),
        body('sitio_web')
            .optional()
            .isURL()
            .withMessage('Sitio web debe ser una URL válida')
    ],
    handleValidation,
    OrganizacionController.crear
);

/**
 * @route   GET /api/v1/organizaciones
 * @desc    Listar organizaciones con paginación y filtros
 * @access  Private (super_admin, admin)
 */
router.get('/',
    auth.authenticateToken, // Solo usuarios autenticados
    [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Página debe ser un número entero mayor a 0'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Límite debe ser entre 1 y 50'),
        query('configuracion_industria')
            .optional()
            .isIn(['barberia', 'salon_belleza', 'estetica', 'spa', 'podologia', 'consultorio_medico', 'academia', 'taller_tecnico', 'centro_fitness', 'veterinaria'])
            .withMessage('Configuración de industria no válida'),
        query('activo')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('Activo debe ser true o false')
    ],
    handleValidation,
    OrganizacionController.listar
);

/**
 * @route   GET /api/v1/organizaciones/:id
 * @desc    Obtener organización por ID
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
    ],
    handleValidation,
    OrganizacionController.obtenerPorId
);

/**
 * @route   PUT /api/v1/organizaciones/:id
 * @desc    Actualizar organización
 * @access  Private (super_admin, admin de la org)
 */
router.put('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('nombre_comercial')
            .optional()
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre comercial debe tener entre 2 y 150 caracteres')
            .trim(),
        body('configuracion_industria')
            .optional()
            .isIn(['barberia', 'salon_belleza', 'estetica', 'spa', 'podologia', 'consultorio_medico', 'academia', 'taller_tecnico', 'centro_fitness', 'veterinaria'])
            .withMessage('Configuración de industria no válida'),
        body('email_admin')
            .optional()
            .isEmail()
            .withMessage('Email del administrador no válido')
            .normalizeEmail(),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono no válido')
    ],
    handleValidation,
    OrganizacionController.actualizar
);

/**
 * @route   DELETE /api/v1/organizaciones/:id
 * @desc    Desactivar organización (soft delete)
 * @access  Private (super_admin only)
 */
router.delete('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
    ],
    handleValidation,
    // Solo super_admin puede desactivar organizaciones
    (req, res, next) => {
        if (req.user.rol !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo super administradores pueden desactivar organizaciones',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    OrganizacionController.desactivar
);

/**
 * @route   GET /api/v1/organizaciones/:id/limites
 * @desc    Verificar límites de organización (citas, profesionales, servicios)
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id/limites',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
    ],
    handleValidation,
    tenant.setTenantContext,
    OrganizacionController.verificarLimites
);

/**
 * @route   GET /api/v1/organizaciones/:id/estadisticas
 * @desc    Obtener estadísticas de organización
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id/estadisticas',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo')
    ],
    handleValidation,
    tenant.setTenantContext,
    OrganizacionController.obtenerEstadisticas
);

/**
 * @route   POST /api/v1/organizaciones/onboarding
 * @desc    Proceso completo de onboarding para nueva organización
 * @access  Private (super_admin)
 */
router.post('/onboarding',
    auth.authenticateToken,
    [
        body('organizacion_data.nombre_comercial')
            .isLength({ min: 2, max: 150 })
            .withMessage('Nombre comercial debe tener entre 2 y 150 caracteres')
            .trim(),
        body('organizacion_data.tipo_industria')
            .isIn(['barberia', 'salon_belleza', 'estetica', 'spa', 'podologia', 'consultorio_medico', 'academia', 'taller_tecnico', 'centro_fitness', 'veterinaria', 'otro'])
            .withMessage('Tipo de industria no válido'),
        body('organizacion_data.email_admin')
            .isEmail()
            .withMessage('Email del administrador no válido')
            .normalizeEmail(),
        body('importar_plantillas')
            .optional()
            .isBoolean()
            .withMessage('importar_plantillas debe ser boolean')
    ],
    handleValidation,
    // Solo super_admin puede hacer onboarding completo
    (req, res, next) => {
        if (req.user.rol !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo super administradores pueden ejecutar onboarding',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    OrganizacionController.onboarding
);

/**
 * @route   GET /api/v1/organizaciones/:id/metricas
 * @desc    Obtener métricas detalladas de organización para dashboard
 * @access  Private (super_admin, admin de la org)
 */
router.get('/:id/metricas',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        query('periodo')
            .optional()
            .isIn(['mes', 'semana', 'año'])
            .withMessage('Período debe ser: mes, semana o año')
    ],
    handleValidation,
    tenant.setTenantContext,
    OrganizacionController.obtenerMetricas
);

/**
 * @route   PUT /api/v1/organizaciones/:id/plan
 * @desc    Cambiar plan de subscripción de organización
 * @access  Private (super_admin)
 */
router.put('/:id/plan',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('nuevo_plan')
            .isIn(['trial', 'basico', 'profesional', 'empresarial', 'custom'])
            .withMessage('Plan debe ser: trial, basico, profesional, empresarial o custom'),
        body('configuracion_plan')
            .optional()
            .isObject()
            .withMessage('configuracion_plan debe ser un objeto')
    ],
    handleValidation,
    // Solo super_admin puede cambiar planes
    (req, res, next) => {
        if (req.user.rol !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo super administradores pueden cambiar planes',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    OrganizacionController.cambiarPlan
);

module.exports = router;