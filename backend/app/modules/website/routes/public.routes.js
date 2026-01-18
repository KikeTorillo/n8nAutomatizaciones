/**
 * ====================================================================
 * ROUTES - WEBSITE PÚBLICO
 * ====================================================================
 *
 * Rutas públicas para renderizar el sitio web sin autenticación.
 * Accesible via nexo.com/sitio/{slug}
 *
 * ENDPOINTS (3):
 * • GET  /sitio/:slug           - Obtener sitio completo
 * • GET  /sitio/:slug/:pagina   - Obtener página con bloques
 * • POST /sitio/:slug/contacto  - Enviar formulario de contacto
 *
 * Fecha creación: 6 Diciembre 2025
 */

const express = require('express');
const { WebsitePublicController } = require('../controllers');
const { rateLimiting, validation } = require('../../../middleware');
const websiteSchemas = require('../schemas/website.schemas');

const router = express.Router();
const validate = validation.validate;

/**
 * GET /api/v1/public/sitio/:slug
 * Obtener sitio completo (config + menú + página inicio)
 * @public Sin autenticación
 */
router.get('/sitio/:slug',
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.obtenerSitioPublico),
    WebsitePublicController.obtenerSitio
);

/**
 * GET /api/v1/public/sitio/:slug/servicios
 * Obtener servicios públicos de la organización
 * @public Sin autenticación
 */
router.get('/sitio/:slug/servicios',
    rateLimiting.apiRateLimit,
    WebsitePublicController.obtenerServicios
);

/**
 * GET /api/v1/public/sitio/:slug/:pagina
 * Obtener página específica con bloques
 * @public Sin autenticación
 */
router.get('/sitio/:slug/:pagina',
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.obtenerPaginaPublica),
    WebsitePublicController.obtenerPagina
);

/**
 * POST /api/v1/public/sitio/:slug/contacto
 * Enviar formulario de contacto
 * @public Sin autenticación
 * Rate limit estricto para evitar spam
 */
router.post('/sitio/:slug/contacto',
    rateLimiting.authRateLimit,
    validate(websiteSchemas.enviarContacto),
    WebsitePublicController.enviarContacto
);

module.exports = router;
