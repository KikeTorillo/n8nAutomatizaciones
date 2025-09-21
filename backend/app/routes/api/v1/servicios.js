/**
 * Rutas de Servicios
 * Endpoints para gestión CRUD de servicios con aislamiento multi-tenant
 * Incluye middleware de autenticación, tenant, validaciones y relaciones con profesionales
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const ServicioController = require('../../../controllers/servicio.controller');
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

// Test simple para debugging
router.post('/test-create',
    auth.authenticateToken,
    (req, res) => {
        res.json({
            success: true,
            message: 'Test endpoint de servicios funcionando',
            user: req.user,
            data: {
                organizacion_id: req.user.organizacion_id,
                body: req.body
            }
        });
    }
);

/**
 * @route   POST /api/v1/servicios
 * @desc    Crear nuevo servicio
 * @access  Private (admin, propietario, manager)
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        body('nombre')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
        
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Descripción no puede exceder 1000 caracteres'),
            
        body('categoria')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Categoría no puede exceder 50 caracteres'),
            
        body('subcategoria')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Subcategoría no puede exceder 50 caracteres'),
            
        body('duracion_minutos')
            .isInt({ min: 1, max: 480 })
            .withMessage('Duración debe ser entre 1 y 480 minutos'),
            
        body('precio')
            .isFloat({ min: 0 })
            .withMessage('Precio debe ser mayor o igual a 0'),
            
        body('precio_minimo')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio mínimo debe ser mayor o igual a 0'),
            
        body('precio_maximo')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio máximo debe ser mayor o igual a 0'),
            
        body('requiere_preparacion_minutos')
            .optional()
            .isInt({ min: 0, max: 120 })
            .withMessage('Tiempo de preparación debe ser entre 0 y 120 minutos'),
            
        body('tiempo_limpieza_minutos')
            .optional()
            .isInt({ min: 0, max: 60 })
            .withMessage('Tiempo de limpieza debe ser entre 0 y 60 minutos'),
            
        body('max_clientes_simultaneos')
            .optional()
            .isInt({ min: 1, max: 20 })
            .withMessage('Máximo clientes simultáneos debe ser entre 1 y 20'),
            
        body('color_servicio')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('Color debe ser un código hexadecimal válido (#RRGGBB)'),
            
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags debe ser un array'),
            
        body('tags.*')
            .optional()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Cada tag debe tener entre 1 y 30 caracteres'),
            
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un valor booleano')
    ],
    handleValidation,
    ServicioController.crear
);

/**
 * @route   GET /api/v1/servicios/:id
 * @desc    Obtener servicio por ID
 * @access  Private (todos los roles autenticados)
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero válido'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.obtenerPorId
);

/**
 * @route   GET /api/v1/servicios
 * @desc    Listar servicios con filtros y paginación
 * @access  Private (todos los roles autenticados)
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        query('pagina')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Página debe ser un número entero mayor a 0'),
            
        query('limite')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Límite debe ser entre 1 y 100'),
            
        query('orden')
            .optional()
            .isIn(['nombre', 'categoria', 'precio', 'duracion_minutos', 'creado_en'])
            .withMessage('Orden debe ser uno de: nombre, categoria, precio, duracion_minutos, creado_en'),
            
        query('direccion')
            .optional()
            .isIn(['ASC', 'DESC'])
            .withMessage('Dirección debe ser ASC o DESC'),
            
        query('activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un valor booleano'),
            
        query('categoria')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 })
            .withMessage('Categoría debe tener entre 1 y 50 caracteres'),
            
        query('busqueda')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Búsqueda debe tener entre 1 y 100 caracteres'),
            
        query('precio_min')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio mínimo debe ser mayor o igual a 0'),
            
        query('precio_max')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio máximo debe ser mayor o igual a 0'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.listar
);

/**
 * @route   PUT /api/v1/servicios/:id
 * @desc    Actualizar servicio
 * @access  Private (admin, propietario, manager)
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero válido'),
            
        body('nombre')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
        
        body('descripcion')
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage('Descripción no puede exceder 1000 caracteres'),
            
        body('categoria')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Categoría no puede exceder 50 caracteres'),
            
        body('subcategoria')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Subcategoría no puede exceder 50 caracteres'),
            
        body('duracion_minutos')
            .optional()
            .isInt({ min: 1, max: 480 })
            .withMessage('Duración debe ser entre 1 y 480 minutos'),
            
        body('precio')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio debe ser mayor o igual a 0'),
            
        body('precio_minimo')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio mínimo debe ser mayor o igual a 0'),
            
        body('precio_maximo')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio máximo debe ser mayor o igual a 0'),
            
        body('requiere_preparacion_minutos')
            .optional()
            .isInt({ min: 0, max: 120 })
            .withMessage('Tiempo de preparación debe ser entre 0 y 120 minutos'),
            
        body('tiempo_limpieza_minutos')
            .optional()
            .isInt({ min: 0, max: 60 })
            .withMessage('Tiempo de limpieza debe ser entre 0 y 60 minutos'),
            
        body('max_clientes_simultaneos')
            .optional()
            .isInt({ min: 1, max: 20 })
            .withMessage('Máximo clientes simultáneos debe ser entre 1 y 20'),
            
        body('color_servicio')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('Color debe ser un código hexadecimal válido (#RRGGBB)'),
            
        body('tags')
            .optional()
            .isArray()
            .withMessage('Tags debe ser un array'),
            
        body('tags.*')
            .optional()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Cada tag debe tener entre 1 y 30 caracteres'),
            
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un valor booleano'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.actualizar
);

/**
 * @route   DELETE /api/v1/servicios/:id
 * @desc    Eliminar servicio (soft delete)
 * @access  Private (admin, propietario, manager)
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero válido'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.eliminar
);

/**
 * @route   POST /api/v1/servicios/:id/profesionales
 * @desc    Asignar profesional a servicio
 * @access  Private (admin, propietario, manager)
 */
router.post('/:id/profesionales',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de servicio debe ser un número entero válido'),
            
        body('profesional_id')
            .isInt({ min: 1 })
            .withMessage('profesional_id debe ser un número entero válido'),
            
        body('configuracion.precio_personalizado')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio personalizado debe ser mayor o igual a 0'),
            
        body('configuracion.duracion_personalizada')
            .optional()
            .isInt({ min: 1, max: 480 })
            .withMessage('Duración personalizada debe ser entre 1 y 480 minutos'),
            
        body('configuracion.notas_especiales')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Notas especiales no pueden exceder 500 caracteres'),
            
        body('configuracion.activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un valor booleano'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.asignarProfesional
);

/**
 * @route   DELETE /api/v1/servicios/:id/profesionales/:profesional_id
 * @desc    Desasignar profesional de servicio
 * @access  Private (admin, propietario, manager)
 */
router.delete('/:id/profesionales/:profesional_id',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de servicio debe ser un número entero válido'),
            
        param('profesional_id')
            .isInt({ min: 1 })
            .withMessage('ID de profesional debe ser un número entero válido'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.desasignarProfesional
);

/**
 * @route   GET /api/v1/servicios/:id/profesionales
 * @desc    Obtener profesionales asignados a un servicio
 * @access  Private (todos los roles autenticados)
 */
router.get('/:id/profesionales',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID de servicio debe ser un número entero válido'),
            
        query('solo_activos')
            .optional()
            .isBoolean()
            .withMessage('solo_activos debe ser un valor booleano'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.obtenerProfesionales
);

/**
 * @route   GET /api/v1/profesionales/:profesional_id/servicios
 * @desc    Obtener servicios de un profesional
 * @access  Private (todos los roles autenticados)
 */
router.get('/profesionales/:profesional_id/servicios',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        param('profesional_id')
            .isInt({ min: 1 })
            .withMessage('ID de profesional debe ser un número entero válido'),
            
        query('solo_activos')
            .optional()
            .isBoolean()
            .withMessage('solo_activos debe ser un valor booleano'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.obtenerServiciosPorProfesional
);

/**
 * @route   GET /api/v1/servicios/buscar
 * @desc    Buscar servicios con búsqueda full-text
 * @access  Private (todos los roles autenticados)
 */
router.get('/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        query('termino')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Término de búsqueda debe tener entre 1 y 100 caracteres'),
            
        query('limite')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Límite debe ser entre 1 y 50'),
            
        query('solo_activos')
            .optional()
            .isBoolean()
            .withMessage('solo_activos debe ser un valor booleano'),
            
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.buscar
);

/**
 * @route   GET /api/v1/servicios/estadisticas
 * @desc    Obtener estadísticas de servicios
 * @access  Private (admin, propietario, manager)
 */
router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.obtenerEstadisticas
);

/**
 * @route   POST /api/v1/servicios/desde-plantilla
 * @desc    Crear servicio desde plantilla
 * @access  Private (admin, propietario, manager)
 */
router.post('/desde-plantilla',
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        body('plantilla_id')
            .isInt({ min: 1 })
            .withMessage('plantilla_id debe ser un número entero válido'),
            
        body('configuracion_personalizada.nombre')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Nombre debe tener entre 1 y 100 caracteres'),
            
        body('configuracion_personalizada.precio')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Precio debe ser mayor o igual a 0'),
            
        body('configuracion_personalizada.duracion_minutos')
            .optional()
            .isInt({ min: 1, max: 480 })
            .withMessage('Duración debe ser entre 1 y 480 minutos'),
            
        body('configuracion_personalizada.organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    handleValidation,
    ServicioController.crearDesdeePlantilla
);

module.exports = router;