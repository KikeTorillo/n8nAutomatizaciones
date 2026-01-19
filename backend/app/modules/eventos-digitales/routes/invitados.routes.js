/**
 * ====================================================================
 * RUTAS AUTENTICADAS - INVITADOS DE EVENTOS
 * ====================================================================
 * Rutas para gestión de invitados (requiere autenticación + módulo activo).
 *
 * Endpoints:
 * POST   /eventos/:eventoId/invitados           - Crear invitado
 * POST   /eventos/:eventoId/invitados/importar  - Importar CSV
 * GET    /eventos/:eventoId/invitados           - Listar invitados
 * GET    /eventos/:eventoId/invitados/exportar  - Exportar CSV
 * GET    /eventos/:eventoId/grupos              - Obtener grupos familiares
 * GET    /eventos/:eventoId/etiquetas           - Obtener etiquetas
 * PUT    /invitados/:id                         - Actualizar invitado
 * DELETE /invitados/:id                         - Eliminar invitado
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const InvitadosController = require('../controllers/invitados.controller');

// Schemas
const invitadosSchemas = require('../schemas/invitado.schemas');

// Middlewares
const {
    auth,
    tenant,
    modules,
    subscription,
    rateLimiting,
    validation: { validate },
    asyncHandler
} = require('../../../middleware');

// ============================================================================
// MIDDLEWARE COMÚN
// ============================================================================
const middlewareComun = [
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('eventos-digitales'),
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit
];

// ============================================================================
// RUTAS DE INVITADOS POR EVENTO
// ============================================================================

/**
 * POST /eventos/:eventoId/invitados
 * Crear invitado
 */
router.post('/eventos/:eventoId/invitados',
    ...middlewareComun,
    validate(invitadosSchemas.crearInvitado),
    asyncHandler(InvitadosController.crear)
);

/**
 * POST /eventos/:eventoId/invitados/importar
 * Importar invitados desde CSV/JSON
 */
router.post('/eventos/:eventoId/invitados/importar',
    ...middlewareComun,
    validate(invitadosSchemas.importarInvitados),
    asyncHandler(InvitadosController.importar)
);

/**
 * GET /eventos/:eventoId/invitados
 * Listar invitados del evento
 */
router.get('/eventos/:eventoId/invitados',
    ...middlewareComun,
    validate(invitadosSchemas.listarInvitados),
    asyncHandler(InvitadosController.listar)
);

/**
 * GET /eventos/:eventoId/invitados/exportar
 * Exportar invitados a CSV
 */
router.get('/eventos/:eventoId/invitados/exportar',
    ...middlewareComun,
    validate(invitadosSchemas.exportarInvitados),
    asyncHandler(InvitadosController.exportar)
);

/**
 * GET /eventos/:eventoId/grupos
 * Obtener grupos familiares únicos del evento
 */
router.get('/eventos/:eventoId/grupos',
    ...middlewareComun,
    asyncHandler(InvitadosController.obtenerGrupos)
);

/**
 * GET /eventos/:eventoId/etiquetas
 * Obtener etiquetas únicas del evento
 */
router.get('/eventos/:eventoId/etiquetas',
    ...middlewareComun,
    asyncHandler(InvitadosController.obtenerEtiquetas)
);

// ============================================================================
// RUTAS DE INVITADO INDIVIDUAL
// ============================================================================

/**
 * PUT /invitados/:id
 * Actualizar invitado
 */
router.put('/invitados/:id',
    ...middlewareComun,
    validate(invitadosSchemas.actualizarInvitado),
    asyncHandler(InvitadosController.actualizar)
);

/**
 * DELETE /invitados/:id
 * Eliminar invitado
 */
router.delete('/invitados/:id',
    ...middlewareComun,
    validate(invitadosSchemas.eliminarInvitado),
    asyncHandler(InvitadosController.eliminar)
);

// ============================================================================
// RUTAS QR + CHECK-IN
// ============================================================================

/**
 * GET /eventos/:eventoId/invitados/:invitadoId/qr
 * Generar QR individual para un invitado
 * Query: ?formato=png|base64
 */
router.get('/eventos/:eventoId/invitados/:invitadoId/qr',
    ...middlewareComun,
    asyncHandler(InvitadosController.generarQR)
);

/**
 * GET /eventos/:eventoId/qr-masivo
 * Descargar ZIP con todos los QR del evento
 */
router.get('/eventos/:eventoId/qr-masivo',
    ...middlewareComun,
    asyncHandler(InvitadosController.generarQRMasivo)
);

/**
 * POST /eventos/:eventoId/checkin
 * Registrar check-in de un invitado
 * Body: { token: string }
 */
router.post('/eventos/:eventoId/checkin',
    ...middlewareComun,
    asyncHandler(InvitadosController.registrarCheckin)
);

/**
 * GET /eventos/:eventoId/checkin/stats
 * Obtener estadísticas de check-in del evento
 */
router.get('/eventos/:eventoId/checkin/stats',
    ...middlewareComun,
    asyncHandler(InvitadosController.obtenerEstadisticasCheckin)
);

/**
 * GET /eventos/:eventoId/checkin/lista
 * Listar últimos check-ins (para dashboard tiempo real)
 */
router.get('/eventos/:eventoId/checkin/lista',
    ...middlewareComun,
    asyncHandler(InvitadosController.listarCheckins)
);

module.exports = router;
