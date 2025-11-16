/**
 * ====================================================================
 * ROUTES - COMISIONES
 * ====================================================================
 *
 * Rutas para gestión de comisiones profesionales:
 * - Configuración de comisiones por profesional/servicio
 * - Consultas de comisiones generadas
 * - Reportes y exportación
 * - Métricas y estadísticas
 */

const express = require('express');
const ComisionesController = require('../../../controllers/comisiones');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../middleware');
const comisionesSchemas = require('../../../schemas/comisiones.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// DASHBOARD Y ESTADÍSTICAS
// ===================================================================

/**
 * GET /api/v1/comisiones/dashboard
 * Obtener métricas para dashboard de comisiones
 * Query params:
 * - fecha_desde (opcional): YYYY-MM-DD
 * - fecha_hasta (opcional): YYYY-MM-DD
 * - profesional_id (opcional): ID del profesional
 */
router.get('/dashboard',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.metricasDashboard),
    ComisionesController.metricasDashboard
);

/**
 * GET /api/v1/comisiones/estadisticas
 * Obtener estadísticas básicas de comisiones
 * Query params: igual que dashboard
 */
router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.metricasDashboard),
    ComisionesController.estadisticasBasicas
);

/**
 * GET /api/v1/comisiones/grafica/por-dia
 * Datos para gráfica de comisiones por día
 * Query params:
 * - fecha_desde (requerido): YYYY-MM-DD
 * - fecha_hasta (requerido): YYYY-MM-DD
 * - profesional_id (opcional): ID del profesional
 */
router.get('/grafica/por-dia',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.generarReporte),
    ComisionesController.graficaPorDia
);

// ===================================================================
// REPORTES
// ===================================================================

/**
 * GET /api/v1/comisiones/reporte
 * Generar reporte de comisiones
 * Query params:
 * - fecha_desde (requerido): YYYY-MM-DD
 * - fecha_hasta (requerido): YYYY-MM-DD
 * - tipo (opcional): por_profesional | detallado | por_dia (default: por_profesional)
 * - profesional_id (opcional): ID del profesional
 * - estado_pago (opcional): pendiente | pagada | cancelada
 * - formato (opcional): json | excel | pdf (default: json)
 */
router.get('/reporte',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.generarReporte),
    ComisionesController.generarReporte
);

// ===================================================================
// CONFIGURACIÓN DE COMISIONES
// ===================================================================

/**
 * GET /api/v1/comisiones/configuracion/historial
 * Obtener historial de cambios de configuración
 * Query params:
 * - profesional_id (opcional): ID del profesional
 * - configuracion_id (opcional): ID de la configuración
 */
router.get('/configuracion/historial',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ComisionesController.obtenerHistorialConfiguracion
);

/**
 * POST /api/v1/comisiones/configuracion
 * Crear o actualizar configuración de comisión
 * Body:
 * - profesional_id (requerido): ID del profesional
 * - tipo_comision (requerido): porcentaje | monto_fijo
 * - valor_comision (requerido): número >= 0
 * - servicio_id (opcional): ID del servicio (null = global)
 * - activo (opcional): boolean (default: true)
 * - notas (opcional): string
 */
router.post('/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.crearConfiguracion),
    ComisionesController.crearOActualizarConfiguracion
);

/**
 * GET /api/v1/comisiones/configuracion
 * Listar configuraciones de comisiones
 * Query params:
 * - profesional_id (opcional): ID del profesional
 * - servicio_id (opcional): ID del servicio
 * - activo (opcional): boolean
 * - tipo_comision (opcional): porcentaje | monto_fijo
 */
router.get('/configuracion',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.listarConfiguracion),
    ComisionesController.listarConfiguracion
);

/**
 * DELETE /api/v1/comisiones/configuracion/:id
 * Eliminar configuración de comisión
 */
router.delete('/configuracion/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.eliminarConfiguracion),
    ComisionesController.eliminarConfiguracion
);

// ===================================================================
// CONSULTAS DE COMISIONES
// ===================================================================

/**
 * GET /api/v1/comisiones/profesional/:id
 * Listar comisiones de un profesional con paginación
 * Params:
 * - id: ID del profesional
 * Query params:
 * - estado_pago (opcional): pendiente | pagada | cancelada
 * - fecha_desde (opcional): YYYY-MM-DD
 * - fecha_hasta (opcional): YYYY-MM-DD
 * - pagina (opcional): número >= 1 (default: 1)
 * - limite (opcional): 1-100 (default: 20)
 */
router.get('/profesional/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.listarPorProfesional),
    ComisionesController.listarPorProfesional
);

/**
 * GET /api/v1/comisiones/periodo
 * Consultar comisiones por rango de fechas
 * Query params:
 * - fecha_desde (requerido): YYYY-MM-DD
 * - fecha_hasta (requerido): YYYY-MM-DD
 * - profesional_id (opcional): ID del profesional
 * - estado_pago (opcional): pendiente | pagada | cancelada
 */
router.get('/periodo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.consultarPorPeriodo),
    ComisionesController.consultarPorPeriodo
);

// ===================================================================
// RUTAS CON PARÁMETROS DINÁMICOS (DEBEN IR AL FINAL)
// ===================================================================

/**
 * PATCH /api/v1/comisiones/:id/pagar
 * Marcar comisión como pagada
 * Body:
 * - fecha_pago (opcional): YYYY-MM-DD (default: hoy)
 * - metodo_pago (opcional): efectivo | transferencia | cheque | tarjeta | otro (default: efectivo)
 * - referencia_pago (opcional): string
 * - notas_pago (opcional): string
 */
router.patch('/:id/pagar',
    auth.authenticateToken,
    tenant.setTenantContext,
    tenant.verifyTenantActive,
    rateLimiting.apiRateLimit,
    validate(comisionesSchemas.marcarComoPagada),
    ComisionesController.marcarComoPagada
);

/**
 * GET /api/v1/comisiones/:id
 * Obtener comisión por ID con detalles completos
 */
router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    ComisionesController.obtenerComisionPorId
);

module.exports = router;
