/**
 * Rutas de Profesionales
 * Endpoints para gestión CRUD de profesionales con aislamiento multi-tenant
 * Incluye middleware de autenticación, tenant y validaciones
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const ProfesionalController = require('../../../controllers/profesional.controller');
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
            message: 'Test endpoint funcionando',
            user: req.user,
            data: {
                organizacion_id: req.user.organizacion_id,
                body: req.body
            }
        });
    }
);

// Middlewares aplicados individualmente por ruta para mejor control

/**
 * @route   POST /api/v1/profesionales
 * @desc    Crear nuevo profesional
 * @access  Private (admin, organizacion_admin)
 */
router.post('/',
    auth.authenticateToken,
    [
        body('nombre_completo')
            .isLength({ min: 3, max: 150 })
            .withMessage('Nombre completo debe tener entre 3 y 150 caracteres')
            .trim(),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email no válido')
            .normalizeEmail(),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono no válido'),
        body('fecha_nacimiento')
            .optional()
            .isISO8601()
            .withMessage('Fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)'),
        body('documento_identidad')
            .optional()
            .isLength({ max: 30 })
            .withMessage('Documento de identidad no puede exceder 30 caracteres')
            .trim(),
        body('tipo_profesional')
            .isIn([
                'barbero', 'estilista_masculino', 'estilista', 'colorista', 'manicurista',
                'peinados_eventos', 'esteticista', 'cosmetologo', 'depilacion_laser',
                'masajista', 'terapeuta_spa', 'aromaterapeuta', 'reflexologo',
                'podologo', 'asistente_podologia', 'doctor_general', 'enfermero',
                'recepcionista_medica', 'instructor', 'profesor', 'tutor',
                'tecnico_auto', 'tecnico_electronico', 'mecanico', 'soldador',
                'entrenador_personal', 'instructor_yoga', 'instructor_pilates',
                'nutricionista', 'veterinario', 'asistente_veterinario', 'groomer', 'otro'
            ])
            .withMessage('Tipo de profesional no válido'),
        body('especialidades')
            .optional()
            .isArray()
            .withMessage('Especialidades debe ser un array'),
        body('años_experiencia')
            .optional()
            .isInt({ min: 0, max: 70 })
            .withMessage('Años de experiencia debe ser entre 0 y 70'),
        body('idiomas')
            .optional()
            .isArray()
            .withMessage('Idiomas debe ser un array'),
        body('color_calendario')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('Color de calendario debe ser un color hexadecimal válido'),
        body('comision_porcentaje')
            .optional()
            .isFloat({ min: 0, max: 100 })
            .withMessage('Comisión debe ser entre 0 y 100'),
        body('salario_base')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Salario base debe ser mayor o igual a 0'),
        body('forma_pago')
            .optional()
            .isIn(['comision', 'salario', 'mixto'])
            .withMessage('Forma de pago debe ser: comision, salario o mixto'),
        body('activo')
            .optional()
            .isBoolean()
            .withMessage('Activo debe ser un booleano'),
        body('disponible_online')
            .optional()
            .isBoolean()
            .withMessage('Disponible online debe ser un booleano'),
        body('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un número entero positivo')
    ],
    handleValidation,
    ProfesionalController.crear
);

/**
 * @route   GET /api/v1/profesionales
 * @desc    Listar profesionales con filtros y paginación
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/',
    auth.authenticateToken,
    [
        query('activo')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('Activo debe ser true o false'),
        query('disponible_online')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('Disponible online debe ser true o false'),
        query('tipo_profesional')
            .optional()
            .isIn([
                'barbero', 'estilista_masculino', 'estilista', 'colorista', 'manicurista',
                'peinados_eventos', 'esteticista', 'cosmetologo', 'depilacion_laser',
                'masajista', 'terapeuta_spa', 'aromaterapeuta', 'reflexologo',
                'podologo', 'asistente_podologia', 'doctor_general', 'enfermero',
                'recepcionista_medica', 'instructor', 'profesor', 'tutor',
                'tecnico_auto', 'tecnico_electronico', 'mecanico', 'soldador',
                'entrenador_personal', 'instructor_yoga', 'instructor_pilates',
                'nutricionista', 'veterinario', 'asistente_veterinario', 'groomer', 'otro'
            ])
            .withMessage('Tipo de profesional no válido'),
        query('busqueda')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Búsqueda debe tener entre 2 y 100 caracteres')
            .trim(),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Límite debe ser entre 1 y 50'),
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset debe ser mayor o igual a 0'),
        query('organizacion_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de organización debe ser un número entero positivo')
    ],
    handleValidation,
    ProfesionalController.listar
);

/**
 * @route   GET /api/v1/profesionales/estadisticas
 * @desc    Obtener estadísticas de profesionales de la organización
 * @access  Private (admin, organizacion_admin)
 */
router.get('/estadisticas',
    auth.authenticateToken,
    // Verificar permisos de administrador
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden ver estadísticas',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ProfesionalController.obtenerEstadisticas
);

/**
 * @route   POST /api/v1/profesionales/validar-email
 * @desc    Validar disponibilidad de email
 * @access  Private (admin, organizacion_admin)
 */
router.post('/validar-email',
    auth.authenticateToken,
    [
        body('email')
            .isEmail()
            .withMessage('Email no válido')
            .normalizeEmail(),
        body('excluir_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID a excluir debe ser un número entero positivo')
    ],
    handleValidation,
    // Verificar permisos de administrador
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden validar emails',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ProfesionalController.validarEmail
);

/**
 * @route   GET /api/v1/profesionales/tipo/:tipo
 * @desc    Buscar profesionales por tipo
 * @access  Private (todos los roles autenticados de la organización)
 */
router.get('/tipo/:tipo',
    auth.authenticateToken,
    [
        param('tipo')
            .isIn([
                'barbero', 'estilista_masculino', 'estilista', 'colorista', 'manicurista',
                'peinados_eventos', 'esteticista', 'cosmetologo', 'depilacion_laser',
                'masajista', 'terapeuta_spa', 'aromaterapeuta', 'reflexologo',
                'podologo', 'asistente_podologia', 'doctor_general', 'enfermero',
                'recepcionista_medica', 'instructor', 'profesor', 'tutor',
                'tecnico_auto', 'tecnico_electronico', 'mecanico', 'soldador',
                'entrenador_personal', 'instructor_yoga', 'instructor_pilates',
                'nutricionista', 'veterinario', 'asistente_veterinario', 'groomer', 'otro'
            ])
            .withMessage('Tipo de profesional no válido'),
        query('activos')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('Activos debe ser true o false')
    ],
    handleValidation,
    ProfesionalController.buscarPorTipo
);

/**
 * @route   GET /api/v1/profesionales/:id
 * @desc    Obtener profesional por ID
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
    ProfesionalController.obtenerPorId
);

/**
 * @route   PUT /api/v1/profesionales/:id
 * @desc    Actualizar profesional
 * @access  Private (admin, organizacion_admin)
 */
router.put('/:id',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('nombre_completo')
            .optional()
            .isLength({ min: 3, max: 150 })
            .withMessage('Nombre completo debe tener entre 3 y 150 caracteres')
            .trim(),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email no válido')
            .normalizeEmail(),
        body('telefono')
            .optional()
            .isMobilePhone('any')
            .withMessage('Teléfono no válido'),
        body('fecha_nacimiento')
            .optional()
            .isISO8601()
            .withMessage('Fecha de nacimiento debe ser una fecha válida'),
        body('especialidades')
            .optional()
            .isArray()
            .withMessage('Especialidades debe ser un array'),
        body('años_experiencia')
            .optional()
            .isInt({ min: 0, max: 70 })
            .withMessage('Años de experiencia debe ser entre 0 y 70'),
        body('color_calendario')
            .optional()
            .matches(/^#[0-9A-Fa-f]{6}$/)
            .withMessage('Color de calendario debe ser un color hexadecimal válido'),
        body('comision_porcentaje')
            .optional()
            .isFloat({ min: 0, max: 100 })
            .withMessage('Comisión debe ser entre 0 y 100'),
        body('salario_base')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Salario base debe ser mayor o igual a 0'),
        body('forma_pago')
            .optional()
            .isIn(['comision', 'salario', 'mixto'])
            .withMessage('Forma de pago debe ser: comision, salario o mixto')
    ],
    handleValidation,
    // Verificar permisos de administrador
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden actualizar profesionales',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ProfesionalController.actualizar
);

/**
 * @route   PATCH /api/v1/profesionales/:id/estado
 * @desc    Cambiar estado de profesional (activar/desactivar)
 * @access  Private (admin, organizacion_admin)
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
    // Verificar permisos de administrador
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden cambiar estado de profesionales',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ProfesionalController.cambiarEstado
);

/**
 * @route   PATCH /api/v1/profesionales/:id/metricas
 * @desc    Actualizar métricas de profesional
 * @access  Private (sistema interno, admin)
 */
router.patch('/:id/metricas',
    auth.authenticateToken,
    [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID debe ser un número entero positivo'),
        body('citas_completadas_incremento')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Incremento de citas completadas debe ser un entero positivo'),
        body('nuevos_clientes')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Nuevos clientes debe ser un entero positivo'),
        body('nueva_calificacion')
            .optional()
            .isFloat({ min: 1, max: 5 })
            .withMessage('Calificación debe ser entre 1.0 y 5.0')
    ],
    handleValidation,
    // Verificar permisos de administrador o sistema
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin', 'empleado'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Permisos insuficientes para actualizar métricas',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ProfesionalController.actualizarMetricas
);

/**
 * @route   DELETE /api/v1/profesionales/:id
 * @desc    Eliminar profesional (soft delete)
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
    // Verificar permisos de administrador
    (req, res, next) => {
        if (!['super_admin', 'admin', 'organizacion_admin'].includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Solo administradores pueden eliminar profesionales',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    },
    ProfesionalController.eliminar
);

module.exports = router;