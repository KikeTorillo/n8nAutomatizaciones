/**
 * ====================================================================
 * ROUTES: USO DE USUARIOS (SEAT-BASED BILLING)
 * ====================================================================
 * Endpoints para consultar uso de usuarios y proyecciones de facturación.
 *
 * Base path: /api/v1/suscripciones-negocio/uso
 *
 * @module routes/uso
 * @version 1.0.0
 * @date Enero 2026
 */

const express = require('express');
const router = express.Router();
const UsoController = require('../controllers/uso.controller');
const { auth, tenant } = require('../../../middleware');

// Middleware chain común (sin verificar permisos especiales, todo usuario puede ver su uso)
const authChain = [
    auth.authenticateToken,
    tenant.setTenantContext
];

/**
 * GET /api/v1/suscripciones-negocio/uso/resumen
 * Obtener resumen de uso de usuarios
 *
 * Respuesta:
 * {
 *   usuariosActuales: 7,
 *   usuariosIncluidos: 5,
 *   usuariosExtra: 2,
 *   porcentajeUso: 140,
 *   estadoUso: "excedido",
 *   cobroAdicionalProyectado: 98,
 *   ...
 * }
 */
router.get(
    '/resumen',
    ...authChain,
    UsoController.obtenerResumen
);

/**
 * GET /api/v1/suscripciones-negocio/uso/historial
 * Obtener historial diario de uso de usuarios
 *
 * Query params:
 * - dias: Número de días hacia atrás (default 30, max 90)
 *
 * Respuesta:
 * {
 *   items: [
 *     { fecha: "2026-01-30", usuarios_activos: 7, usuarios_incluidos: 5, usuarios_extra: 2 },
 *     ...
 *   ]
 * }
 */
router.get(
    '/historial',
    ...authChain,
    UsoController.obtenerHistorial
);

/**
 * GET /api/v1/suscripciones-negocio/uso/proyeccion
 * Obtener proyección del próximo cobro con desglose
 *
 * Respuesta:
 * {
 *   precioBase: 249,
 *   ajusteUsuarios: { monto: 98, usuariosExtra: 2, precioUnitario: 49 },
 *   totalProyectado: 347,
 *   fechaProximoCobro: "2026-02-15"
 * }
 */
router.get(
    '/proyeccion',
    ...authChain,
    UsoController.obtenerProyeccion
);

/**
 * GET /api/v1/suscripciones-negocio/uso/verificar-limite
 * Verificar si se puede crear usuario(s)
 *
 * Query params:
 * - cantidad: Número de usuarios a crear (default 1)
 *
 * Respuesta:
 * {
 *   puedeCrear: true,
 *   advertencia: "Se agregarán $49 MXN/mes...",
 *   costoAdicional: 49,
 *   esHardLimit: false
 * }
 */
router.get(
    '/verificar-limite',
    ...authChain,
    UsoController.verificarLimite
);

module.exports = router;
