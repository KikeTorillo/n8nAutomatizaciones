/**
 * Rutas de Servicios
 * Endpoints para gestión CRUD de servicios con aislamiento multi-tenant
 * Incluye middleware de autenticación, tenant, validaciones y relaciones con profesionales
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const ServicioController = require('../../../controllers/servicio.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');

const router = express.Router();

router.post('/',
    rateLimiting.heavyOperationRateLimit,
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
            .isString()
            .withMessage('Color debe ser una cadena válida'),
            
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
    validation.handleValidation,
    ServicioController.crear
);

router.get('/buscar',
    rateLimiting.apiRateLimit,
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
    validation.handleValidation,
    ServicioController.buscar
);

router.get('/estadisticas',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    tenant.setTenantContext,
    [
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('organizacion_id debe ser un número entero válido')
    ],
    validation.handleValidation,
    ServicioController.obtenerEstadisticas
);

router.post('/desde-plantilla',
    rateLimiting.heavyOperationRateLimit,
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
    validation.handleValidation,
    ServicioController.crearDesdeePlantilla
);

router.get('/:id',
    rateLimiting.apiRateLimit,
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
    validation.handleValidation,
    ServicioController.obtenerPorId
);

router.get('/',
    rateLimiting.apiRateLimit,
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
    validation.handleValidation,
    ServicioController.listar
);

router.put('/:id',
    rateLimiting.heavyOperationRateLimit,
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
            .isString()
            .withMessage('Color debe ser una cadena válida'),
            
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
    validation.handleValidation,
    ServicioController.actualizar
);

router.delete('/:id',
    rateLimiting.heavyOperationRateLimit,
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
    validation.handleValidation,
    ServicioController.eliminar
);

router.delete('/:id/permanente',
    rateLimiting.heavyOperationRateLimit,
    auth.authenticateToken,
    auth.requireRole('super_admin'),
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
    validation.handleValidation,
    ServicioController.eliminarPermanente
);

router.post('/:id/profesionales',
    rateLimiting.heavyOperationRateLimit,
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
    validation.handleValidation,
    ServicioController.asignarProfesional
);

router.delete('/:id/profesionales/:profesional_id',
    rateLimiting.heavyOperationRateLimit,
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
    validation.handleValidation,
    ServicioController.desasignarProfesional
);

router.get('/:id/profesionales',
    rateLimiting.apiRateLimit,
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
    validation.handleValidation,
    ServicioController.obtenerProfesionales
);

router.get('/profesionales/:profesional_id/servicios',
    rateLimiting.apiRateLimit,
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
    validation.handleValidation,
    ServicioController.obtenerServiciosPorProfesional
);

module.exports = router;