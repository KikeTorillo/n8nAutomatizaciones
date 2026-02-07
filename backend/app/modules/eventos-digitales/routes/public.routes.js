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
const multer = require('multer');

// Controllers
const PublicController = require('../controllers/public.controller');

// Schemas
const publicSchemas = require('../schemas/public.schemas');

// Middlewares
const {
    rateLimiting,
    validation: { validate },
    asyncHandler
} = require('../../../middleware');

// Configuración de multer para uploads públicos de galería
const uploadGaleria = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG, WebP o GIF.'), false);
        }
    }
});

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
 * GET /evento/:slug/felicitaciones
 * Obtener felicitaciones aprobadas del evento
 */
router.get('/evento/:slug/felicitaciones',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerFelicitaciones),
    asyncHandler(PublicController.obtenerFelicitacionesPublicas)
);

/**
 * GET /evento/:slug/galeria
 * Obtener galería pública del evento
 * IMPORTANTE: Esta ruta debe estar ANTES de /evento/:slug/:token
 */
router.get('/evento/:slug/galeria',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.obtenerGaleriaPublica),
    asyncHandler(PublicController.obtenerGaleria)
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
 * POST /evento/:slug/:token/felicitacion
 * Enviar felicitación como invitado
 */
router.post('/evento/:slug/:token/felicitacion',
    rateLimiting.apiRateLimit,
    validate(publicSchemas.crearFelicitacion),
    asyncHandler(PublicController.crearFelicitacionPublica)
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

// ============================================================================
// RUTAS DE GALERÍA PÚBLICA - SUBIDA Y REPORTE
// ============================================================================

/**
 * POST /evento/:slug/:token/galeria
 * Subir foto como invitado (requiere token válido)
 * Acepta multipart/form-data con campo 'foto'
 */
router.post('/evento/:slug/:token/galeria',
    rateLimiting.heavyOperationRateLimit,
    uploadGaleria.single('foto'),
    asyncHandler(PublicController.subirFotoConArchivo)
);

/**
 * POST /galeria/:id/reportar
 * Reportar foto inapropiada
 */
router.post('/galeria/:id/reportar',
    rateLimiting.heavyOperationRateLimit,
    validate(publicSchemas.reportarFoto),
    asyncHandler(PublicController.reportarFoto)
);

module.exports = router;
