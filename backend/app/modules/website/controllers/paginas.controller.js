const { WebsitePaginasModel, WebsiteConfigModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * ====================================================================
 * CONTROLLER - WEBSITE PÁGINAS
 * ====================================================================
 *
 * Gestiona las páginas del sitio web de cada organización.
 *
 * ENDPOINTS (6):
 * • POST   /paginas           - Crear página
 * • GET    /paginas           - Listar páginas del sitio
 * • GET    /paginas/:id       - Obtener página por ID
 * • PUT    /paginas/:id       - Actualizar página
 * • PUT    /paginas/orden     - Reordenar páginas
 * • DELETE /paginas/:id       - Eliminar página
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsitePaginasController {

    /**
     * Crear nueva página
     * POST /api/v1/website/paginas
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el website_id pertenece a la organización
        const config = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);
        if (!config) {
            return ResponseHelper.error(
                res,
                'No hay sitio web configurado para esta organización',
                404
            );
        }

        // Verificar disponibilidad del slug en el sitio
        if (req.body.slug) {
            const slugDisponible = await WebsitePaginasModel.verificarSlugDisponible(
                config.id,
                req.body.slug
            );
            if (!slugDisponible) {
                return ResponseHelper.error(
                    res,
                    'Este slug ya está en uso en este sitio. Elige otro.',
                    409
                );
            }
        }

        const datosPagina = {
            ...req.body,
            website_id: config.id
        };

        const paginaCreada = await WebsitePaginasModel.crear(datosPagina, organizacionId);

        return ResponseHelper.success(
            res,
            paginaCreada,
            'Página creada exitosamente',
            201
        );
    });

    /**
     * Listar páginas del sitio
     * GET /api/v1/website/paginas
     *
     * @requires auth - cualquier rol de la organización
     * @requires tenant - organizacionId desde RLS context
     */
    static listar = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;

        // Obtener config del sitio
        const config = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);
        if (!config) {
            return ResponseHelper.success(
                res,
                [],
                'No hay sitio web configurado para esta organización'
            );
        }

        const paginas = await WebsitePaginasModel.listar(config.id, organizacionId);

        return ResponseHelper.success(
            res,
            paginas,
            'Páginas obtenidas exitosamente'
        );
    });

    /**
     * Obtener página por ID
     * GET /api/v1/website/paginas/:id
     *
     * @requires auth - cualquier rol de la organización
     * @requires tenant - organizacionId desde RLS context
     */
    static obtener = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const pagina = await WebsitePaginasModel.obtenerPorId(id, organizacionId);

        if (!pagina) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        return ResponseHelper.success(
            res,
            pagina,
            'Página obtenida exitosamente'
        );
    });

    /**
     * Actualizar página
     * PUT /api/v1/website/paginas/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Obtener página actual para verificar website_id
        const paginaActual = await WebsitePaginasModel.obtenerPorId(id, organizacionId);
        if (!paginaActual) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        // Si se está cambiando el slug, verificar disponibilidad
        if (req.body.slug && req.body.slug !== paginaActual.slug) {
            const config = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);
            const slugDisponible = await WebsitePaginasModel.verificarSlugDisponible(
                config.id,
                req.body.slug,
                id
            );
            if (!slugDisponible) {
                return ResponseHelper.error(
                    res,
                    'Este slug ya está en uso en este sitio. Elige otro.',
                    409
                );
            }
        }

        const paginaActualizada = await WebsitePaginasModel.actualizar(
            id,
            req.body,
            organizacionId
        );

        return ResponseHelper.success(
            res,
            paginaActualizada,
            'Página actualizada exitosamente'
        );
    });

    /**
     * Reordenar páginas
     * PUT /api/v1/website/paginas/orden
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @body {ordenamiento: [{id, orden}, ...]}
     */
    static reordenar = asyncHandler(async (req, res) => {
        const { ordenamiento } = req.body;
        const organizacionId = req.tenant.organizacionId;

        // Obtener config del sitio
        const config = await WebsiteConfigModel.obtenerPorOrganizacion(organizacionId);
        if (!config) {
            return ResponseHelper.error(
                res,
                'No hay sitio web configurado para esta organización',
                404
            );
        }

        await WebsitePaginasModel.reordenar(config.id, ordenamiento, organizacionId);

        // Obtener lista actualizada
        const paginas = await WebsitePaginasModel.listar(config.id, organizacionId);

        return ResponseHelper.success(
            res,
            paginas,
            'Páginas reordenadas exitosamente'
        );
    });

    /**
     * Eliminar página
     * DELETE /api/v1/website/paginas/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const eliminada = await WebsitePaginasModel.eliminar(id, organizacionId);

        if (!eliminada) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        return ResponseHelper.success(
            res,
            { id },
            'Página eliminada exitosamente'
        );
    });
}

module.exports = WebsitePaginasController;
