const { WebsiteConfigModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const websiteCacheService = require('../services/websiteCache.service');
const WebsitePreviewService = require('../services/preview.service');

/**
 * ====================================================================
 * CONTROLLER - WEBSITE CONFIG
 * ====================================================================
 *
 * Gestiona la configuración del sitio web de cada organización.
 *
 * ENDPOINTS (6):
 * - POST   /config                       - Crear configuración del sitio
 * - GET    /config                       - Obtener configuración actual
 * - PUT    /config/:id                   - Actualizar configuración
 * - POST   /config/:id/publicar          - Publicar/despublicar sitio
 * - GET    /config/slug/:slug/disponible - Verificar disponibilidad slug
 * - DELETE /config/:id                   - Eliminar sitio web
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Singleton por organización, verificación de slug único,
 * método custom publicar(), no sigue patrón CRUD estándar.
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsiteConfigController {

    /**
     * Crear configuración del sitio web
     * POST /api/v1/website/config
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Verificar que la organización no tenga ya un sitio
        const configExistente = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);
        if (configExistente) {
            return ResponseHelper.error(
                res,
                'Esta organización ya tiene un sitio web configurado',
                409
            );
        }

        // Verificar disponibilidad del slug
        const slugDisponible = await WebsiteConfigModel.verificarSlugDisponible(req.body.slug);
        if (!slugDisponible) {
            return ResponseHelper.error(
                res,
                'Este slug ya está en uso. Elige otro.',
                409
            );
        }

        const configCreada = await WebsiteConfigModel.crear(req.body, organizacionId);

        return ResponseHelper.success(
            res,
            configCreada,
            'Configuración del sitio web creada exitosamente',
            201
        );
    });

    /**
     * Obtener configuración del sitio web
     * GET /api/v1/website/config
     *
     * @requires auth - cualquier rol de la organización
     * @requires tenant - organizacionId desde RLS context
     */
    static obtener = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        const config = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);

        if (!config) {
            return ResponseHelper.success(
                res,
                null,
                'No hay sitio web configurado para esta organización'
            );
        }

        return ResponseHelper.success(
            res,
            config,
            'Configuración del sitio obtenida exitosamente'
        );
    });

    /**
     * Actualizar configuración del sitio
     * PUT /api/v1/website/config/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;
        const slugAnterior = req.body._slugAnterior; // Para invalidar caché del slug viejo

        // Si se está cambiando el slug, verificar disponibilidad
        if (req.body.slug) {
            const slugDisponible = await WebsiteConfigModel.verificarSlugDisponible(
                req.body.slug,
                id
            );
            if (!slugDisponible) {
                return ResponseHelper.error(
                    res,
                    'Este slug ya está en uso. Elige otro.',
                    409
                );
            }
        }

        const configActualizada = await WebsiteConfigModel.actualizar(
            id,
            req.body,
            organizacionId
        );

        if (!configActualizada) {
            return ResponseHelper.error(
                res,
                'Configuración no encontrada',
                404
            );
        }

        // Invalidar caché del sitio al actualizar (si está publicado)
        if (configActualizada.publicado && configActualizada.slug) {
            websiteCacheService.invalidarSitio(configActualizada.slug).catch(err => {
                console.warn('[WebsiteConfigController] Error invalidando caché:', err.message);
            });
            // Si cambió el slug, invalidar también el slug anterior
            if (slugAnterior && slugAnterior !== configActualizada.slug) {
                websiteCacheService.invalidarSitio(slugAnterior).catch(err => {
                    console.warn('[WebsiteConfigController] Error invalidando caché slug anterior:', err.message);
                });
            }
        }

        return ResponseHelper.success(
            res,
            configActualizada,
            'Configuración actualizada exitosamente'
        );
    });

    /**
     * Publicar o despublicar sitio
     * POST /api/v1/website/config/:id/publicar
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static publicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { publicar } = req.body;
        const organizacionId = req.tenant.organizacionId;

        const configActualizada = await WebsiteConfigModel.publicar(
            id,
            publicar,
            organizacionId
        );

        if (!configActualizada) {
            return ResponseHelper.error(
                res,
                'Configuración no encontrada',
                404
            );
        }

        // Invalidar caché del sitio al publicar/despublicar
        if (configActualizada.slug) {
            websiteCacheService.invalidarSitio(configActualizada.slug).catch(err => {
                console.warn('[WebsiteConfigController] Error invalidando caché:', err.message);
            });
        }

        const mensaje = publicar
            ? 'Sitio web publicado exitosamente. Ahora es accesible públicamente.'
            : 'Sitio web despublicado. Ya no es accesible públicamente.';

        return ResponseHelper.success(
            res,
            configActualizada,
            mensaje
        );
    });

    /**
     * Verificar disponibilidad de slug
     * GET /api/v1/website/config/slug/:slug/disponible
     *
     * @requires auth - cualquier rol
     */
    static verificarSlug = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const excludeId = req.query.exclude || null;

        const disponible = await WebsiteConfigModel.verificarSlugDisponible(slug, excludeId);

        return ResponseHelper.success(
            res,
            { slug, disponible },
            disponible ? 'Slug disponible' : 'Slug no disponible'
        );
    });

    /**
     * Eliminar sitio web
     * DELETE /api/v1/website/config/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const eliminado = await WebsiteConfigModel.eliminar(id, organizacionId);

        if (!eliminado) {
            return ResponseHelper.error(
                res,
                'Configuración no encontrada',
                404
            );
        }

        return ResponseHelper.success(
            res,
            { id },
            'Sitio web eliminado exitosamente'
        );
    });

    // ====================================================================
    // PREVIEW
    // ====================================================================

    /**
     * Generar token de preview
     * POST /api/v1/website/config/:id/preview
     *
     * @requires auth - admin
     * @requires tenant
     */
    static generarPreview = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { duracion_horas = 1 } = req.body;

        const preview = await WebsitePreviewService.generarToken(id, duracion_horas);

        return ResponseHelper.success(
            res,
            preview,
            'Token de preview generado exitosamente'
        );
    });

    /**
     * Obtener info de preview activo
     * GET /api/v1/website/config/:id/preview
     *
     * @requires auth - cualquier rol
     * @requires tenant
     */
    static obtenerPreview = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const preview = await WebsitePreviewService.obtenerInfoPreview(id, organizacionId);

        if (!preview) {
            return ResponseHelper.success(
                res,
                { activo: false },
                'No hay preview activo'
            );
        }

        return ResponseHelper.success(res, preview);
    });

    /**
     * Revocar token de preview
     * DELETE /api/v1/website/config/:id/preview
     *
     * @requires auth - admin
     * @requires tenant
     */
    static revocarPreview = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await WebsitePreviewService.revocarToken(id);

        return ResponseHelper.success(
            res,
            { revocado: true },
            'Token de preview revocado'
        );
    });
}

module.exports = WebsiteConfigController;
