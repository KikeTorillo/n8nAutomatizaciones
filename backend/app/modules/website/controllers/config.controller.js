const { WebsiteConfigModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

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
}

module.exports = WebsiteConfigController;
