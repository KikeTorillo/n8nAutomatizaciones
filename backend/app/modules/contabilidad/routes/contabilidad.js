/**
 * ====================================================================
 * ROUTES - CONTABILIDAD
 * ====================================================================
 *
 * Rutas para el módulo de contabilidad:
 * - Gestión de cuentas contables (catálogo SAT)
 * - Asientos contables (libro diario)
 * - Reportes financieros (balanza, libro mayor, PyG, balance)
 * - Períodos contables
 */

const express = require('express');
const { CuentasController, AsientosController, ReportesController } = require('../controllers');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const contabilidadSchemas = require('../schemas/contabilidad.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// MIDDLEWARE COMÚN
// ===================================================================
const authMiddleware = [
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit
];

// ===================================================================
// DASHBOARD
// ===================================================================

/**
 * GET /api/v1/contabilidad/dashboard
 * Resumen del módulo contable para dashboard
 */
router.get('/dashboard',
    ...authMiddleware,
    ReportesController.obtenerDashboard
);

// ===================================================================
// CUENTAS CONTABLES
// ===================================================================

/**
 * GET /api/v1/contabilidad/cuentas
 * Listar cuentas con filtros y paginación
 */
router.get('/cuentas',
    ...authMiddleware,
    validate(contabilidadSchemas.listarCuentas),
    CuentasController.listar
);

/**
 * GET /api/v1/contabilidad/cuentas/arbol
 * Obtener árbol jerárquico de cuentas
 */
router.get('/cuentas/arbol',
    ...authMiddleware,
    CuentasController.obtenerArbol
);

/**
 * GET /api/v1/contabilidad/cuentas/afectables
 * Obtener solo cuentas afectables (para selects en asientos)
 */
router.get('/cuentas/afectables',
    ...authMiddleware,
    CuentasController.listarAfectables
);

/**
 * POST /api/v1/contabilidad/cuentas/inicializar-sat
 * Inicializar catálogo de cuentas SAT México
 */
router.post('/cuentas/inicializar-sat',
    ...authMiddleware,
    CuentasController.inicializarCatalogoSAT
);

/**
 * GET /api/v1/contabilidad/cuentas/:id
 * Obtener cuenta por ID
 */
router.get('/cuentas/:id',
    ...authMiddleware,
    CuentasController.obtenerPorId
);

/**
 * POST /api/v1/contabilidad/cuentas
 * Crear nueva cuenta contable
 */
router.post('/cuentas',
    ...authMiddleware,
    validate(contabilidadSchemas.crearCuenta),
    CuentasController.crear
);

/**
 * PUT /api/v1/contabilidad/cuentas/:id
 * Actualizar cuenta contable
 */
router.put('/cuentas/:id',
    ...authMiddleware,
    validate(contabilidadSchemas.actualizarCuenta),
    CuentasController.actualizar
);

/**
 * DELETE /api/v1/contabilidad/cuentas/:id
 * Eliminar (desactivar) cuenta contable
 */
router.delete('/cuentas/:id',
    ...authMiddleware,
    CuentasController.eliminar
);

// ===================================================================
// ASIENTOS CONTABLES
// ===================================================================

/**
 * GET /api/v1/contabilidad/asientos
 * Listar asientos con filtros y paginación
 */
router.get('/asientos',
    ...authMiddleware,
    validate(contabilidadSchemas.listarAsientos),
    AsientosController.listar
);

/**
 * GET /api/v1/contabilidad/asientos/:id
 * Obtener asiento por ID con movimientos
 * Query: fecha (requerido para tabla particionada)
 */
router.get('/asientos/:id',
    ...authMiddleware,
    validate(contabilidadSchemas.obtenerAsiento),
    AsientosController.obtenerPorId
);

/**
 * POST /api/v1/contabilidad/asientos
 * Crear nuevo asiento contable
 */
router.post('/asientos',
    ...authMiddleware,
    validate(contabilidadSchemas.crearAsiento),
    AsientosController.crear
);

/**
 * PUT /api/v1/contabilidad/asientos/:id
 * Actualizar asiento (solo en borrador)
 * Query: fecha (requerido)
 */
router.put('/asientos/:id',
    ...authMiddleware,
    validate(contabilidadSchemas.actualizarAsiento),
    AsientosController.actualizar
);

/**
 * POST /api/v1/contabilidad/asientos/:id/publicar
 * Publicar asiento (cambiar de borrador a publicado)
 * Query: fecha (requerido)
 */
router.post('/asientos/:id/publicar',
    ...authMiddleware,
    AsientosController.publicar
);

/**
 * POST /api/v1/contabilidad/asientos/:id/anular
 * Anular asiento publicado
 * Query: fecha (requerido)
 * Body: motivo
 */
router.post('/asientos/:id/anular',
    ...authMiddleware,
    validate(contabilidadSchemas.anularAsiento),
    AsientosController.anular
);

/**
 * DELETE /api/v1/contabilidad/asientos/:id
 * Eliminar asiento en borrador
 * Query: fecha (requerido)
 */
router.delete('/asientos/:id',
    ...authMiddleware,
    AsientosController.eliminar
);

// ===================================================================
// PERÍODOS CONTABLES
// ===================================================================

/**
 * GET /api/v1/contabilidad/periodos
 * Listar períodos contables
 * Query: anio (opcional)
 */
router.get('/periodos',
    ...authMiddleware,
    validate(contabilidadSchemas.listarPeriodos),
    ReportesController.listarPeriodos
);

/**
 * POST /api/v1/contabilidad/periodos/:id/cerrar
 * Cerrar período contable
 */
router.post('/periodos/:id/cerrar',
    ...authMiddleware,
    validate(contabilidadSchemas.cerrarPeriodo),
    ReportesController.cerrarPeriodo
);

// ===================================================================
// REPORTES FINANCIEROS
// ===================================================================

/**
 * GET /api/v1/contabilidad/reportes/balanza
 * Balanza de Comprobación
 * Query: periodo_id (requerido)
 */
router.get('/reportes/balanza',
    ...authMiddleware,
    validate(contabilidadSchemas.balanza),
    ReportesController.obtenerBalanza
);

/**
 * GET /api/v1/contabilidad/reportes/libro-mayor
 * Libro Mayor de una cuenta
 * Query: cuenta_id, fecha_inicio, fecha_fin (requeridos)
 */
router.get('/reportes/libro-mayor',
    ...authMiddleware,
    validate(contabilidadSchemas.libroMayor),
    ReportesController.obtenerLibroMayor
);

/**
 * GET /api/v1/contabilidad/reportes/estado-resultados
 * Estado de Resultados (Pérdidas y Ganancias)
 * Query: fecha_inicio, fecha_fin (requeridos)
 */
router.get('/reportes/estado-resultados',
    ...authMiddleware,
    validate(contabilidadSchemas.estadoResultados),
    ReportesController.obtenerEstadoResultados
);

/**
 * GET /api/v1/contabilidad/reportes/balance-general
 * Balance General
 * Query: fecha (requerido)
 */
router.get('/reportes/balance-general',
    ...authMiddleware,
    validate(contabilidadSchemas.balanceGeneral),
    ReportesController.obtenerBalanceGeneral
);

// ===================================================================
// CONFIGURACIÓN CONTABLE
// ===================================================================

/**
 * GET /api/v1/contabilidad/configuracion
 * Obtener configuración contable
 */
router.get('/configuracion',
    ...authMiddleware,
    ReportesController.obtenerConfiguracion
);

/**
 * PUT /api/v1/contabilidad/configuracion
 * Actualizar configuración contable
 */
router.put('/configuracion',
    ...authMiddleware,
    validate(contabilidadSchemas.actualizarConfiguracion),
    ReportesController.actualizarConfiguracion
);

module.exports = router;
