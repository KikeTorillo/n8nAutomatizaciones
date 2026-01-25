const express = require('express');
const CitaController = require('../controllers/citas');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../middleware');
const { verificarPermiso } = require('../../../middleware/permisos');
const citaSchemas = require('../schemas/cita.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// DASHBOARD Y MÉTRICAS
// ===================================================================

router.get('/dashboard/today',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.dashboardToday),
    CitaController.dashboardToday
);

router.get('/cola-espera',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.colaEspera),
    CitaController.colaEspera
);

router.get('/metricas-tiempo-real',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.metricasTiempoReal),
    CitaController.metricasTiempoReal
);

// ===================================================================
// WALK-IN Y DISPONIBILIDAD
// ===================================================================

router.post('/walk-in',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.crear_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crearWalkIn),
    CitaController.crearWalkIn
);

router.get('/disponibilidad-inmediata',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.disponibilidadInmediata),
    CitaController.disponibilidadInmediata
);

// ===================================================================
// RECORDATORIOS
// ===================================================================

router.get('/recordatorios',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtenerRecordatorios),
    CitaController.obtenerRecordatorios
);

// ===================================================================
// CITAS RECURRENTES
// ===================================================================

/**
 * POST /api/v1/citas/recurrente/preview
 * Preview de fechas disponibles para una serie recurrente (sin crear)
 */
router.post('/recurrente/preview',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.previewRecurrencia),
    CitaController.previewRecurrencia
);

/**
 * POST /api/v1/citas/recurrente
 * Crear una serie de citas recurrentes
 */
router.post('/recurrente',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.crear_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crear),  // Usa el schema crear que incluye patron_recurrencia
    CitaController.crearRecurrente
);

/**
 * GET /api/v1/citas/serie/:serieId
 * Obtener todas las citas de una serie recurrente
 */
router.get('/serie/:serieId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtenerSerie),
    CitaController.obtenerSerie
);

/**
 * POST /api/v1/citas/serie/:serieId/cancelar
 * Cancelar todas las citas pendientes de una serie
 */
router.post('/serie/:serieId/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.cancelar_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.cancelarSerie),
    CitaController.cancelarSerie
);

// ===================================================================
// CRUD
// ===================================================================

/**
 * POST /api/v1/citas
 * Crear cita (soporta agendamiento público sin auth)
 *
 * ✅ FEATURE: Agendamiento público de marketplace
 * - Con auth: Usa organizacion_id del usuario, valida suscripción
 * - Sin auth: Usa organizacion_id del body, NO valida suscripción
 *
 * @public Acepta requests con y sin autenticación
 */
router.post('/',
    auth.optionalAuth,  // ✅ Permite requests con y sin token
    // Middleware condicional para tenant context
    (req, res, next) => {
        if (req.user) {
            // Usuario autenticado: usar tenant context normal
            return tenant.setTenantContext(req, res, next);
        } else {
            // Request público: usar tenant context desde body
            return tenant.setTenantContextFromBody(req, res, next);
        }
    },
    // Middleware condicional para verificación de tenant activo
    (req, res, next) => {
        if (req.user) {
            // Usuario autenticado: verificar que tenant esté activo
            return tenant.verifyTenantActive(req, res, next);
        } else {
            // Request público: ya se verificó en setTenantContextFromBody
            return next();
        }
    },
    // Middleware condicional para validación de suscripción
    (req, res, next) => {
        if (req.user) {
            // Usuario autenticado: verificar suscripción activa
        } else {
            // Request público: NO validar suscripción (marketplace público)
            return next();
        }
    },
    // Middleware condicional para límite de citas
    (req, res, next) => {
        if (req.user) {
            // Usuario autenticado: verificar límite de citas/mes
        } else {
            // Request público: NO validar límite (marketplace público)
            return next();
        }
    },
    rateLimiting.apiRateLimit,
    validate(citaSchemas.crear),
    CitaController.crear
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.listar),
    CitaController.listar
);

// ===================================================================
// PARÁMETROS DINÁMICOS
// ===================================================================

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.obtener),
    CitaController.obtener
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.editar_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.actualizar),
    CitaController.actualizar
);

router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.cancelar_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.eliminar),
    CitaController.eliminar
);

router.patch('/:id/confirmar-asistencia',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.confirmarAsistencia),
    CitaController.confirmarAsistencia
);

// ===================================================================
// OPERACIONALES
// ===================================================================

router.post('/:id/check-in',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.checkIn),
    CitaController.checkIn
);

router.post('/:id/start-service',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.startService),
    CitaController.startService
);

router.post('/:id/complete',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.completar_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.complete),
    CitaController.complete
);

router.post('/:id/reagendar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.editar_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.reagendar),
    CitaController.reagendar
);

router.post('/:id/no-show',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.noShow),
    CitaController.noShow
);

router.post('/:id/cancelar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    verificarPermiso('agendamiento.cancelar_citas'),
    rateLimiting.apiRateLimit,
    validate(citaSchemas.cancelar),
    CitaController.cancelar
);

router.patch('/:codigo/recordatorio-enviado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.marcarRecordatorioEnviado),
    CitaController.marcarRecordatorioEnviado
);

router.patch('/:codigo/calificar-cliente',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(citaSchemas.calificarCliente),
    CitaController.calificarCliente
);

module.exports = router;
