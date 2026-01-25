/**
 * ====================================================================
 * ROUTES - WEBSITE (PRIVADAS)
 * ====================================================================
 *
 * Rutas privadas para gestión del sitio web:
 * - Configuración del sitio (5 endpoints)
 * - Páginas (6 endpoints)
 * - Bloques de contenido (9 endpoints)
 *
 * CARACTERÍSTICAS:
 * • Auth requerido para todas las rutas
 * • RLS context para multi-tenant
 * • Validación Joi en todos los endpoints
 *
 * Fecha creación: 6 Diciembre 2025
 */

const express = require('express');
const {
    WebsiteConfigController,
    WebsitePaginasController,
    WebsiteBloquesController
} = require('../controllers');
const WebsiteTemplatesController = require('../controllers/templates.controller');
const WebsiteAIController = require('../controllers/ai.controller');
const { auth, tenant, rateLimiting, validation, subscription, modules } = require('../../../middleware');
const websiteSchemas = require('../schemas/website.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// CONFIGURACIÓN DEL SITIO
// ===================================================================

/**
 * POST /api/v1/website/config
 * Crear configuración del sitio web
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.post('/config',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.crearConfig),
    WebsiteConfigController.crear
);

/**
 * GET /api/v1/website/config
 * Obtener configuración del sitio web
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/config',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteConfigController.obtener
);

/**
 * PUT /api/v1/website/config/:id
 * Actualizar configuración del sitio
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.put('/config/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.actualizarConfig),
    WebsiteConfigController.actualizar
);

/**
 * POST /api/v1/website/config/:id/publicar
 * Publicar o despublicar sitio
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.post('/config/:id/publicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.publicarConfig),
    WebsiteConfigController.publicar
);

/**
 * GET /api/v1/website/config/slug/:slug/disponible
 * Verificar disponibilidad de slug
 * @requires auth - cualquier rol
 */
router.get('/config/slug/:slug/disponible',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.verificarSlug),
    WebsiteConfigController.verificarSlug
);

/**
 * DELETE /api/v1/website/config/:id
 * Eliminar sitio web
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.delete('/config/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.eliminarConfig),
    WebsiteConfigController.eliminar
);

// ===================================================================
// PÁGINAS
// ===================================================================

/**
 * POST /api/v1/website/paginas
 * Crear nueva página
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.post('/paginas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.crearPagina),
    WebsitePaginasController.crear
);

/**
 * GET /api/v1/website/paginas
 * Listar páginas del sitio
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/paginas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsitePaginasController.listar
);

/**
 * PUT /api/v1/website/paginas/orden
 * Reordenar páginas
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.put('/paginas/orden',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.reordenarPaginas),
    WebsitePaginasController.reordenar
);

/**
 * GET /api/v1/website/paginas/:id
 * Obtener página por ID
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/paginas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.obtenerPagina),
    WebsitePaginasController.obtener
);

/**
 * PUT /api/v1/website/paginas/:id
 * Actualizar página
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.put('/paginas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.actualizarPagina),
    WebsitePaginasController.actualizar
);

/**
 * DELETE /api/v1/website/paginas/:id
 * Eliminar página
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.delete('/paginas/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.eliminarPagina),
    WebsitePaginasController.eliminar
);

// ===================================================================
// BLOQUES
// ===================================================================

/**
 * GET /api/v1/website/bloques/tipos
 * Listar tipos de bloques disponibles
 * @requires auth - cualquier rol
 */
router.get('/bloques/tipos',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    WebsiteBloquesController.listarTipos
);

/**
 * GET /api/v1/website/bloques/tipos/:tipo/default
 * Obtener contenido por defecto de un tipo de bloque
 * @requires auth - cualquier rol
 */
router.get('/bloques/tipos/:tipo/default',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.obtenerDefaultBloque),
    WebsiteBloquesController.obtenerDefault
);

/**
 * POST /api/v1/website/bloques
 * Crear nuevo bloque
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.post('/bloques',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.crearBloque),
    WebsiteBloquesController.crear
);

/**
 * GET /api/v1/website/paginas/:paginaId/bloques
 * Listar bloques de una página
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/paginas/:paginaId/bloques',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.listarBloques),
    WebsiteBloquesController.listar
);

/**
 * PUT /api/v1/website/paginas/:paginaId/bloques/orden
 * Reordenar bloques de una página
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.put('/paginas/:paginaId/bloques/orden',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.reordenarBloques),
    WebsiteBloquesController.reordenar
);

/**
 * GET /api/v1/website/bloques/:id
 * Obtener bloque por ID
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/bloques/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.obtenerBloque),
    WebsiteBloquesController.obtener
);

/**
 * PUT /api/v1/website/bloques/:id
 * Actualizar bloque
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.put('/bloques/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.actualizarBloque),
    WebsiteBloquesController.actualizar
);

/**
 * POST /api/v1/website/bloques/:id/duplicar
 * Duplicar bloque
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.post('/bloques/:id/duplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.duplicarBloque),
    WebsiteBloquesController.duplicar
);

/**
 * DELETE /api/v1/website/bloques/:id
 * Eliminar bloque
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.delete('/bloques/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    validate(websiteSchemas.eliminarBloque),
    WebsiteBloquesController.eliminar
);

// ===================================================================
// TEMPLATES
// ===================================================================

/**
 * GET /api/v1/website/templates/industrias
 * Listar industrias disponibles
 * @requires auth - cualquier rol
 */
router.get('/templates/industrias',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.listarIndustrias
);

/**
 * GET /api/v1/website/templates
 * Listar templates disponibles
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/templates',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.listar
);

/**
 * GET /api/v1/website/templates/:id
 * Obtener template por ID
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/templates/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.obtener
);

/**
 * GET /api/v1/website/templates/:id/estructura
 * Obtener estructura del template (previsualización)
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/templates/:id/estructura',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.obtenerEstructura
);

/**
 * POST /api/v1/website/templates/:id/aplicar
 * Aplicar template a sitio nuevo o existente
 * @requires auth - admin
 * @requires tenant
 */
router.post('/templates/:id/aplicar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.aplicar
);

/**
 * POST /api/v1/website/templates
 * Guardar sitio actual como template personalizado
 * @requires auth - admin
 * @requires tenant
 */
router.post('/templates',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.crear
);

/**
 * DELETE /api/v1/website/templates/:id
 * Eliminar template personalizado
 * @requires auth - admin
 * @requires tenant
 */
router.delete('/templates/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteTemplatesController.eliminar
);

// ===================================================================
// IA - GENERACIÓN DE CONTENIDO
// ===================================================================

/**
 * GET /api/v1/website/ai/status
 * Verificar disponibilidad del servicio de IA
 * @requires auth - cualquier rol
 */
router.get('/ai/status',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    WebsiteAIController.obtenerStatus
);

/**
 * POST /api/v1/website/ai/generar
 * Generar contenido para un campo específico
 * @requires auth - admin
 * @requires tenant
 */
router.post('/ai/generar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.aiRateLimit || rateLimiting.apiRateLimit,
    WebsiteAIController.generarContenido
);

/**
 * POST /api/v1/website/ai/generar-bloque
 * Generar contenido completo para un bloque
 * @requires auth - admin
 * @requires tenant
 */
router.post('/ai/generar-bloque',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.aiRateLimit || rateLimiting.apiRateLimit,
    WebsiteAIController.generarBloque
);

module.exports = router;
