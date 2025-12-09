/**
 * ====================================================================
 * RUTAS PÚBLICAS - EVENTOS DIGITALES
 * ====================================================================
 * Rutas sin autenticación para vista de invitación y confirmación RSVP.
 *
 * Endpoints:
 * GET  /api/v1/public/evento/:slug                    - Info del evento
 * GET  /api/v1/public/evento/:slug/ubicaciones        - Ubicaciones del evento
 * GET  /api/v1/public/evento/:slug/regalos            - Mesa de regalos
 * GET  /api/v1/public/evento/:slug/:token             - Invitación personalizada
 * POST /api/v1/public/evento/:slug/:token/rsvp        - Confirmar asistencia
 * GET  /api/v1/public/evento/:slug/:token/whatsapp    - Generar mensaje WhatsApp
 *
 * Fecha creación: 4 Diciembre 2025
 */

const express = require('express');
const router = express.Router();

// Controllers
const PublicController = require('../controllers/public.controller');

// Schemas
const publicSchemas = require('../schemas/public.schema');

// Middlewares
const {
    rateLimiting,
    validation: { validate },
    asyncHandler
} = require('../../../middleware');

// ============================================================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ============================================================================
// Estas rutas solo usan rate limiting y validación de schema.
// Los models usan RLSContextManager.withBypass() internamente.

/**
 * GET /evento/:slug
 * Obtener información pública del evento
 */
router.get('/evento/:slug',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerEventoPublico),
    asyncHandler(PublicController.obtenerEvento)
);

/**
 * GET /evento/:slug/ubicaciones
 * Obtener ubicaciones del evento
 */
router.get('/evento/:slug/ubicaciones',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerEventoPublico),
    asyncHandler(PublicController.obtenerUbicaciones)
);

/**
 * GET /evento/:slug/regalos
 * Obtener mesa de regalos del evento
 */
router.get('/evento/:slug/regalos',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerEventoPublico),
    asyncHandler(PublicController.obtenerRegalos)
);

/**
 * GET /evento/:slug/calendario
 * Generar archivo iCalendar (.ics) para agregar al calendario
 */
router.get('/evento/:slug/calendario',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerEventoPublico),
    asyncHandler(PublicController.generarCalendario)
);

/**
 * GET /evento/:slug/:token
 * Obtener invitación personalizada por token
 */
router.get('/evento/:slug/:token',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerInvitacion),
    asyncHandler(PublicController.obtenerInvitacion)
);

/**
 * POST /evento/:slug/:token/rsvp
 * Confirmar asistencia (RSVP)
 */
router.post('/evento/:slug/:token/rsvp',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.confirmarRSVP),
    asyncHandler(PublicController.confirmarRSVP)
);

/**
 * GET /evento/:slug/:token/whatsapp
 * Generar mensaje para compartir por WhatsApp
 */
router.get('/evento/:slug/:token/whatsapp',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerInvitacion),
    asyncHandler(PublicController.generarMensajeWhatsApp)
);

/**
 * GET /evento/:slug/:token/qr
 * Generar QR para la invitación pública
 * Query: ?formato=png|base64
 */
router.get('/evento/:slug/:token/qr',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerInvitacion),
    asyncHandler(PublicController.generarQR)
);

module.exports = router;
