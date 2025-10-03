/**
 * Rutas de Citas - API SaaS Multi-tenant
 * Endpoints para gestión de citas con IA conversacional y operaciones estándar
 */

const express = require('express');
const CitaController = require('../../../controllers/citas');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const citaSchemas = require('../../../schemas/cita.schemas');

const router = express.Router();

// Alias para el middleware de validación
const validate = validation.validate;

// ===================================================================
// 🤖 ENDPOINTS IA CONVERSACIONAL (WEBHOOKS)
// ===================================================================

/**
 * @route   POST /api/v1/citas/automatica
 * @desc    Crear cita automáticamente desde IA/webhook n8n
 * @access  Public (webhook interno)
 */
router.post('/automatica',
    rateLimiting.heavyOperationRateLimit,
    validate(citaSchemas.crearAutomatica),
    CitaController.crearAutomatica
);

/**
 * @route   GET /api/v1/citas/buscar-por-telefono
 * @desc    Buscar citas activas por teléfono del cliente
 * @access  Public (IA)
 */
router.get('/buscar-por-telefono',
    rateLimiting.apiRateLimit,
    validate(citaSchemas.buscarPorTelefono),
    CitaController.buscarPorTelefono
);

/**
 * @route   PUT /api/v1/citas/automatica/:codigo
 * @desc    Modificar cita automáticamente desde IA
 * @access  Public (webhook)
 */
router.put('/automatica/:codigo',
    rateLimiting.heavyOperationRateLimit,
    validate(citaSchemas.modificarAutomatica),
    CitaController.modificarAutomatica
);

/**
 * @route   DELETE /api/v1/citas/automatica/:codigo
 * @desc    Cancelar cita automáticamente desde IA
 * @access  Public (webhook)
 */
router.delete('/automatica/:codigo',
    rateLimiting.heavyOperationRateLimit,
    validate(citaSchemas.cancelarAutomatica),
    CitaController.cancelarAutomatica
);

// ===================================================================
// 🛡️ ENDPOINTS CRUD ESTÁNDAR (AUTENTICADOS)
// ===================================================================

// IMPORTANTE: Rutas con paths específicos ANTES de rutas con parámetros dinámicos (:id)
// para evitar que Express interprete paths como "dashboard" o "walk-in" como IDs

// ===================================================================
// 📊 ENDPOINTS DASHBOARD Y MÉTRICAS (Paths específicos primero)
// ===================================================================

/**
 * @route   GET /api/v1/citas/dashboard/today
 * @desc    Dashboard del día - citas de hoy
 * @access  Private (empleado, propietario, admin)
 */
router.get('/dashboard/today',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.dashboardToday),
    CitaController.dashboardToday
);

/**
 * @route   GET /api/v1/citas/cola-espera
 * @desc    Obtener cola de espera en tiempo real
 * @access  Private (empleado, propietario, admin)
 */
router.get('/cola-espera',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.colaEspera),
    CitaController.colaEspera
);

/**
 * @route   GET /api/v1/citas/metricas-tiempo-real
 * @desc    Métricas en tiempo real del día
 * @access  Private (empleado, propietario, admin)
 */
router.get('/metricas-tiempo-real',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.metricasTiempoReal),
    CitaController.metricasTiempoReal
);

// ===================================================================
// 🚶 ENDPOINTS WALK-IN Y DISPONIBILIDAD INMEDIATA (Paths específicos)
// ===================================================================

/**
 * @route   POST /api/v1/citas/walk-in
 * @desc    Crear cita walk-in (cliente sin cita previa)
 * @access  Private (empleado, propietario, admin)
 */
router.post('/walk-in',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crearWalkIn),
    CitaController.crearWalkIn
);

/**
 * @route   GET /api/v1/citas/disponibilidad-inmediata
 * @desc    Consultar disponibilidad inmediata para walk-ins
 * @access  Private (empleado, propietario, admin)
 */
router.get('/disponibilidad-inmediata',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.disponibilidadInmediata),
    CitaController.disponibilidadInmediata
);

// ===================================================================
// 📨 ENDPOINTS RECORDATORIOS (Paths específicos)
// ===================================================================

/**
 * @route   GET /api/v1/citas/recordatorios
 * @desc    Obtener citas que requieren recordatorio
 * @access  Private (admin, empleado, sistema)
 */
router.get('/recordatorios',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtenerRecordatorios),
    CitaController.obtenerRecordatorios
);

// ===================================================================
// 🛡️ ENDPOINTS CRUD BÁSICOS
// ===================================================================

/**
 * @route   POST /api/v1/citas
 * @desc    Crear nueva cita (modo estándar)
 * @access  Private (empleado, propietario, admin)
 */
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crear),
    CitaController.crear
);

/**
 * @route   GET /api/v1/citas
 * @desc    Listar citas con filtros
 * @access  Private (empleado, propietario, admin)
 */
router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.listar),
    CitaController.listar
);

// ===================================================================
// 🔧 ENDPOINTS CON PARÁMETROS DINÁMICOS (Al final para evitar conflictos)
// ===================================================================

/**
 * @route   GET /api/v1/citas/:id
 * @desc    Obtener cita por ID
 * @access  Private (empleado, propietario, admin)
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtener),
    CitaController.obtener
);

/**
 * @route   PUT /api/v1/citas/:id
 * @desc    Actualizar cita
 * @access  Private (empleado, propietario, admin)
 */
router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.actualizar),
    CitaController.actualizar
);

/**
 * @route   DELETE /api/v1/citas/:id
 * @desc    Eliminar cita
 * @access  Private (propietario, admin)
 */
router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.eliminar),
    CitaController.eliminar
);

/**
 * @route   PATCH /api/v1/citas/:id/confirmar-asistencia
 * @desc    Confirmar asistencia a cita
 * @access  Private (empleado, propietario, admin)
 */
router.patch('/:id/confirmar-asistencia',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.confirmarAsistencia),
    CitaController.confirmarAsistencia
);

// ===================================================================
// 🏥 ENDPOINTS OPERACIONALES
// ===================================================================

/**
 * @route   POST /api/v1/citas/:id/check-in
 * @desc    Registrar llegada del cliente (check-in)
 * @access  Private (empleado, propietario, admin)
 */
router.post('/:id/check-in',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.checkIn),
    CitaController.checkIn
);

/**
 * @route   POST /api/v1/citas/:id/start-service
 * @desc    Iniciar servicio (profesional empieza atención)
 * @access  Private (empleado, propietario, admin)
 */
router.post('/:id/start-service',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.startService),
    CitaController.startService
);

/**
 * @route   POST /api/v1/citas/:id/complete
 * @desc    Completar cita
 * @access  Private (empleado, propietario, admin)
 */
router.post('/:id/complete',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.complete),
    CitaController.complete
);

/**
 * @route   POST /api/v1/citas/:id/reagendar
 * @desc    Reagendar cita
 * @access  Private (empleado, propietario, admin)
 */
router.post('/:id/reagendar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.reagendar),
    CitaController.reagendar
);

/**
 * @route   PATCH /api/v1/citas/:codigo/recordatorio-enviado
 * @desc    Marcar recordatorio como enviado
 * @access  Private (sistema, admin)
 */
router.patch('/:codigo/recordatorio-enviado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.marcarRecordatorioEnviado),
    CitaController.marcarRecordatorioEnviado
);

/**
 * @route   PATCH /api/v1/citas/:codigo/calificar-cliente
 * @desc    Calificar cliente (por profesional)
 * @access  Private (profesional, empleado)
 */
router.patch('/:codigo/calificar-cliente',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.calificarCliente),
    CitaController.calificarCliente
);

module.exports = router;
