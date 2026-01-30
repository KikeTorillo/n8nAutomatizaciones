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
const WebsiteAnalyticsController = require('../controllers/analytics.controller');
const WebsiteSEOController = require('../controllers/seo.controller');
const WebsiteVersionesController = require('../controllers/versiones.controller');
const WebsiteHealthController = require('../controllers/health.controller');
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

/**
 * POST /api/v1/website/config/:id/preview
 * Generar token de preview
 * @requires auth - admin
 * @requires tenant
 */
router.post('/config/:id/preview',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteConfigController.generarPreview
);

/**
 * GET /api/v1/website/config/:id/preview
 * Obtener info de preview activo
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/config/:id/preview',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteConfigController.obtenerPreview
);

/**
 * DELETE /api/v1/website/config/:id/preview
 * Revocar token de preview
 * @requires auth - admin
 * @requires tenant
 */
router.delete('/config/:id/preview',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteConfigController.revocarPreview
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

/**
 * POST /api/v1/website/ai/generar-sitio
 * Generar sitio web completo desde descripcion
 * @requires auth - admin
 * @requires tenant
 */
router.post('/ai/generar-sitio',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.aiRateLimit || rateLimiting.apiRateLimit,
    WebsiteAIController.generarSitio
);

/**
 * POST /api/v1/website/ai/detectar-industria
 * Detectar industria desde descripcion
 * @requires auth - cualquier rol
 */
router.post('/ai/detectar-industria',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    WebsiteAIController.detectarIndustria
);

/**
 * POST /api/v1/website/ai/generar-texto
 * Generar texto con tono personalizado
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.post('/ai/generar-texto',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.aiRateLimit || rateLimiting.apiRateLimit,
    WebsiteAIController.generarTextoConTono
);

// ===================================================================
// ANALYTICS
// ===================================================================

/**
 * GET /api/v1/website/analytics
 * Listar eventos de analytics recientes
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/analytics',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteAnalyticsController.listarEventos
);

/**
 * GET /api/v1/website/analytics/resumen
 * Obtener resumen de metricas
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/analytics/resumen',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteAnalyticsController.obtenerResumen
);

/**
 * GET /api/v1/website/analytics/paginas
 * Obtener paginas mas populares
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/analytics/paginas',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteAnalyticsController.obtenerPaginasPopulares
);

/**
 * GET /api/v1/website/analytics/tiempo-real
 * Obtener metricas en tiempo real (ultimos 5 minutos)
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/analytics/tiempo-real',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteAnalyticsController.obtenerTiempoReal
);

// ===================================================================
// SEO
// ===================================================================

/**
 * GET /api/v1/website/seo/auditoria
 * Obtener auditoria SEO del sitio
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/seo/auditoria',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteSEOController.obtenerAuditoria
);

/**
 * GET /api/v1/website/seo/preview-google
 * Obtener preview de SERP de Google
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/seo/preview-google',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteSEOController.previewGoogle
);

/**
 * GET /api/v1/website/seo/schema
 * Obtener schema markup generado
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/seo/schema',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteSEOController.obtenerSchema
);

// ===================================================================
// VERSIONES (HISTORIAL/ROLLBACK)
// ===================================================================

/**
 * GET /api/v1/website/versiones
 * Listar versiones del sitio
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/versiones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.listar
);

/**
 * GET /api/v1/website/versiones/comparar
 * Comparar dos versiones
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/versiones/comparar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.comparar
);

/**
 * GET /api/v1/website/versiones/:id
 * Obtener version por ID
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/versiones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.obtener
);

/**
 * GET /api/v1/website/versiones/:id/preview
 * Preview de una version sin restaurar
 * @requires auth - cualquier rol
 * @requires tenant
 */
router.get('/versiones/:id/preview',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.obtenerPreview
);

/**
 * POST /api/v1/website/versiones
 * Crear version manual (snapshot)
 * @requires auth - admin
 * @requires tenant
 */
router.post('/versiones',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.crear
);

/**
 * POST /api/v1/website/versiones/:id/restaurar
 * Restaurar sitio a una version
 * @requires auth - admin
 * @requires tenant
 */
router.post('/versiones/:id/restaurar',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.restaurar
);

/**
 * DELETE /api/v1/website/versiones/:id
 * Eliminar version
 * @requires auth - admin
 * @requires tenant
 */
router.delete('/versiones/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('website'),
    auth.requireRole(['admin']),
    rateLimiting.apiRateLimit,
    WebsiteVersionesController.eliminar
);

// ===================================================================
// HEALTH CHECK
// ===================================================================

/**
 * GET /api/v1/website/health
 * Obtener estado de salud del módulo website
 * @requires auth - cualquier rol
 */
router.get('/health',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    WebsiteHealthController.obtenerHealth
);

/**
 * GET /api/v1/website/health/ping
 * Ping rápido para verificar disponibilidad
 * @requires auth - cualquier rol
 */
router.get('/health/ping',
    auth.authenticateToken,
    rateLimiting.apiRateLimit,
    WebsiteHealthController.ping
);

// ===================================================================
// IMÁGENES (UNSPLASH)
// ===================================================================

const imagesRouter = require('./images.routes');
router.use('/images', imagesRouter);

module.exports = router;
