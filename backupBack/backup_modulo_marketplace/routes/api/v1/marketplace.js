/**
 * ====================================================================
 * ROUTES - MARKETPLACE
 * ====================================================================
 *
 * Rutas para marketplace público de negocios:
 * - Perfiles públicos de negocios (7 endpoints)
 * - Reseñas de clientes (4 endpoints)
 * - Analytics de tráfico (4 endpoints)
 *
 * CARACTERÍSTICAS:
 * • Acceso público sin auth para búsqueda y visualización
 * • Auth requerido para gestión de perfiles y reseñas
 * • GDPR-compliant analytics (hash de IPs)
 *
 * Fecha creación: 17 Noviembre 2025
 */

const express = require('express');
const {
    PerfilesMarketplaceController,
    ReseñasMarketplaceController,
    AnalyticsMarketplaceController
} = require('../../../controllers/marketplace');
const { auth, tenant, rateLimiting, validation, subscription } = require('../../../../../middleware');
const marketplaceSchemas = require('../../../schemas/marketplace.schemas');

const router = express.Router();
const validate = validation.validate;

// ===================================================================
// PERFILES PÚBLICOS
// ===================================================================

/**
 * POST /api/v1/marketplace/perfiles
 * Crear perfil de marketplace para la organización
 * @requires auth - admin o propietario
 * @requires tenant
 * @requires subscription - valida límites del plan
 */
router.post('/perfiles',
    auth.authenticateToken,
    tenant.setTenantContext,
    subscription.checkActiveSubscription,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.crearPerfil),
    PerfilesMarketplaceController.crear
);

/**
 * PUT /api/v1/marketplace/perfiles/:id
 * Actualizar perfil de marketplace
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.put('/perfiles/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.actualizarPerfil),
    PerfilesMarketplaceController.actualizar
);

/**
 * PATCH /api/v1/marketplace/perfiles/:id/activar
 * Activar/Desactivar perfil (solo super_admin)
 * @requires auth - solo super_admin
 */
router.patch('/perfiles/:id/activar',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.activarPerfil),
    PerfilesMarketplaceController.activar
);

/**
 * GET /api/v1/marketplace/perfiles/mi-perfil
 * Obtener mi perfil de marketplace
 * @requires auth - admin o propietario
 * @requires tenant
 * @note Retorna el perfil de la organización del usuario logueado
 */
router.get('/perfiles/mi-perfil',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    PerfilesMarketplaceController.obtenerMiPerfil
);

/**
 * GET /api/v1/marketplace/perfiles/buscar
 * Búsqueda pública de perfiles en el marketplace
 * @public Sin autenticación
 * Query params:
 * - q (opcional): Búsqueda full-text
 * - ciudad (opcional): Filtro por ciudad
 * - estado (opcional): Filtro por estado
 * - pais (opcional): Filtro por país
 * - rating_minimo (opcional): Rating mínimo (0-5)
 * - orden (opcional): rating|reseñas|reciente|alfabetico (default: rating)
 * - pagina (opcional): Número de página (default: 1)
 * - limite (opcional): Items por página (default: 12, max: 50)
 */
router.get('/perfiles/buscar',
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.buscarPerfiles),
    PerfilesMarketplaceController.buscar
);

/**
 * GET /api/v1/marketplace/perfiles/slug/:slug
 * Obtener perfil completo por slug (público)
 * @public Sin autenticación
 * @note Usa función PL/pgSQL optimizada
 * @returns {perfil, servicios, profesionales, reseñas, stats}
 */
router.get('/perfiles/slug/:slug',
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.obtenerPerfilPorSlug),
    PerfilesMarketplaceController.obtenerPorSlug
);

/**
 * GET /api/v1/marketplace/perfiles/:id
 * Obtener perfil por ID (privado)
 * @requires auth - admin o propietario
 * @requires tenant
 */
router.get('/perfiles/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.obtenerPerfil),
    PerfilesMarketplaceController.obtenerPorId
);

/**
 * GET /api/v1/marketplace/perfiles/:id/estadisticas
 * Obtener estadísticas de analytics del perfil
 * @requires auth - admin o propietario
 * @requires tenant
 * Query params:
 * - fecha_inicio (opcional): YYYY-MM-DD
 * - fecha_fin (opcional): YYYY-MM-DD
 */
router.get('/perfiles/:id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.estadisticasPerfil),
    PerfilesMarketplaceController.obtenerEstadisticas
);

// ===================================================================
// RESEÑAS
// ===================================================================

/**
 * POST /api/v1/marketplace/resenas
 * Crear reseña de cliente
 * @requires auth - cliente con cita completada
 * @requires tenant
 * Body:
 * - cita_id (requerido): ID de la cita
 * - fecha_cita (requerido): Fecha de la cita (YYYY-MM-DD)
 * - rating (requerido): Rating 1-5 estrellas
 * - titulo (opcional): Título de la reseña
 * - comentario (opcional): Comentario detallado
 * - profesional_id (opcional): ID del profesional
 */
router.post('/resenas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.crearReseña),
    ReseñasMarketplaceController.crear
);

/**
 * POST /api/v1/marketplace/resenas/:id/responder
 * Responder a una reseña (solo el negocio)
 * @requires auth - admin o propietario
 * @requires tenant
 * Body:
 * - respuesta_negocio (requerido): Respuesta del negocio
 */
router.post('/resenas/:id/responder',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['admin', 'propietario']),
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.responderReseña),
    ReseñasMarketplaceController.responder
);

/**
 * PATCH /api/v1/marketplace/resenas/:id/moderar
 * Moderar reseña (cambiar estado)
 * @requires auth - admin o propietario
 * @requires tenant
 * Body:
 * - estado (requerido): pendiente|publicada|reportada|oculta
 * - motivo_reporte (opcional): Motivo si estado es reportada u oculta
 */
router.patch('/resenas/:id/moderar',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireRole(['admin', 'propietario']),
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.moderarReseña),
    ReseñasMarketplaceController.moderar
);

/**
 * GET /api/v1/marketplace/resenas/negocio/:organizacion_id
 * Listar reseñas de un negocio
 * @public Acceso público (solo muestra publicadas por defecto)
 * @note Si auth y mismo negocio, puede ver todas sus reseñas
 * Query params:
 * - estado (opcional): pendiente|publicada|reportada|oculta (default: publicada)
 * - rating_minimo (opcional): Rating mínimo (1-5)
 * - pagina (opcional): Número de página (default: 1)
 * - limite (opcional): Items por página (default: 10, max: 50)
 */
router.get('/resenas/negocio/:organizacion_id',
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.listarReseñas),
    ReseñasMarketplaceController.listar
);

// ===================================================================
// ANALYTICS
// ===================================================================

/**
 * POST /api/v1/marketplace/analytics
 * Registrar evento de analytics (público)
 * @public Sin autenticación
 * @note Fire-and-forget tracking
 * @note IP hasheada con SHA256 (GDPR)
 * Body:
 * - organizacion_id (requerido): ID de la organización
 * - evento_tipo (requerido): vista_perfil|clic_agendar|clic_telefono|clic_sitio_web|clic_instagram|clic_facebook
 * - fuente (opcional): Fuente de tráfico
 * - pais_visitante (opcional): País del visitante
 * - ciudad_visitante (opcional): Ciudad del visitante
 */
router.post('/analytics',
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.registrarEvento),
    AnalyticsMarketplaceController.registrarEvento
);

/**
 * GET /api/v1/marketplace/analytics/:organizacion_id
 * Obtener analytics de un perfil
 * @requires auth - admin o propietario
 * @requires tenant
 * Query params:
 * - fecha_inicio (opcional): YYYY-MM-DD
 * - fecha_fin (opcional): YYYY-MM-DD
 * - evento_tipo (opcional): Filtrar por tipo de evento
 * - agrupar_por (opcional): dia|semana|mes|evento (default: dia)
 */
router.get('/analytics/:organizacion_id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.obtenerAnalytics),
    AnalyticsMarketplaceController.obtener
);

/**
 * GET /api/v1/marketplace/analytics/:organizacion_id/estadisticas
 * Obtener estadísticas generales de analytics
 * @requires auth - admin o propietario
 * @requires tenant
 * Query params:
 * - periodo (opcional): 7dias|30dias|90dias|año (default: 30dias)
 */
router.get('/analytics/:organizacion_id/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.estadisticasAnalytics),
    AnalyticsMarketplaceController.obtenerEstadisticas
);

/**
 * DELETE /api/v1/marketplace/analytics/limpiar
 * Limpiar datos antiguos de analytics (solo super_admin)
 * @requires auth - solo super_admin
 * Query params:
 * - dias_antiguedad (requerido): Días de antigüedad mínima (mínimo 90)
 */
router.delete('/analytics/limpiar',
    auth.authenticateToken,
    auth.requireRole(['super_admin']),
    rateLimiting.apiRateLimit,
    validate(marketplaceSchemas.limpiarAnalytics),
    AnalyticsMarketplaceController.limpiar
);

module.exports = router;
