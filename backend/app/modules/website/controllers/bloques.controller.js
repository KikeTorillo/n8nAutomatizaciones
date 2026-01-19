const { WebsiteBloquesModel, WebsitePaginasModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

/**
 * ====================================================================
 * CONTROLLER - WEBSITE BLOQUES
 * ====================================================================
 *
 * Gestiona los bloques de contenido de cada página.
 *
 * ENDPOINTS (9):
 * - POST   /bloques                       - Crear bloque
 * - GET    /paginas/:paginaId/bloques     - Listar bloques de una página
 * - GET    /bloques/:id                   - Obtener bloque por ID
 * - PUT    /bloques/:id                   - Actualizar bloque
 * - PUT    /paginas/:paginaId/bloques/orden - Reordenar bloques
 * - POST   /bloques/:id/duplicar          - Duplicar bloque
 * - DELETE /bloques/:id                   - Eliminar bloque
 * - GET    /bloques/tipos/:tipo/default   - Contenido default por tipo
 * - GET    /bloques/tipos                 - Listar tipos disponibles
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: 5+ métodos custom (duplicar, reordenar, obtenerDefault, listarTipos),
 * depende de paginaId, validación de tipos de bloque.
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsiteBloquesController {

    /**
     * Crear nuevo bloque
     * POST /api/v1/website/bloques
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static crear = asyncHandler(async (req, res) => {
        const organizacionId = req.tenant.organizacionId;
        const { pagina_id, tipo, contenido, estilos, orden, visible } = req.body;

        // Verificar que la página pertenece a la organización
        const pagina = await WebsitePaginasModel.obtenerPorId(pagina_id, organizacionId);
        if (!pagina) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        // Validar tipo de bloque
        if (!WebsiteBloquesModel.TIPOS_VALIDOS.includes(tipo)) {
            return ResponseHelper.error(
                res,
                `Tipo de bloque inválido. Tipos permitidos: ${WebsiteBloquesModel.TIPOS_VALIDOS.join(', ')}`,
                400
            );
        }

        // Si no hay contenido, usar el default para el tipo
        const contenidoFinal = contenido || WebsiteBloquesModel.obtenerContenidoDefault(tipo);

        const bloqueCreado = await WebsiteBloquesModel.crear({
            pagina_id,
            tipo,
            contenido: contenidoFinal,
            estilos: estilos || {},
            orden,
            visible
        }, organizacionId);

        return ResponseHelper.success(
            res,
            bloqueCreado,
            'Bloque creado exitosamente',
            201
        );
    });

    /**
     * Listar bloques de una página
     * GET /api/v1/website/paginas/:paginaId/bloques
     *
     * @requires auth - cualquier rol de la organización
     * @requires tenant - organizacionId desde RLS context
     */
    static listar = asyncHandler(async (req, res) => {
        const { paginaId } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que la página pertenece a la organización
        const pagina = await WebsitePaginasModel.obtenerPorId(paginaId, organizacionId);
        if (!pagina) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        const bloques = await WebsiteBloquesModel.listar(paginaId, organizacionId);

        return ResponseHelper.success(
            res,
            bloques,
            'Bloques obtenidos exitosamente'
        );
    });

    /**
     * Obtener bloque por ID
     * GET /api/v1/website/bloques/:id
     *
     * @requires auth - cualquier rol de la organización
     * @requires tenant - organizacionId desde RLS context
     */
    static obtener = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const bloque = await WebsiteBloquesModel.obtenerPorId(id, organizacionId);

        if (!bloque) {
            return ResponseHelper.error(
                res,
                'Bloque no encontrado',
                404
            );
        }

        return ResponseHelper.success(
            res,
            bloque,
            'Bloque obtenido exitosamente'
        );
    });

    /**
     * Actualizar bloque
     * PUT /api/v1/website/bloques/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Validar tipo si se está actualizando
        if (req.body.tipo && !WebsiteBloquesModel.TIPOS_VALIDOS.includes(req.body.tipo)) {
            return ResponseHelper.error(
                res,
                `Tipo de bloque inválido. Tipos permitidos: ${WebsiteBloquesModel.TIPOS_VALIDOS.join(', ')}`,
                400
            );
        }

        const bloqueActualizado = await WebsiteBloquesModel.actualizar(
            id,
            req.body,
            organizacionId
        );

        if (!bloqueActualizado) {
            return ResponseHelper.error(
                res,
                'Bloque no encontrado',
                404
            );
        }

        return ResponseHelper.success(
            res,
            bloqueActualizado,
            'Bloque actualizado exitosamente'
        );
    });

    /**
     * Reordenar bloques de una página
     * PUT /api/v1/website/paginas/:paginaId/bloques/orden
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     * @body {ordenamiento: [{id, orden}, ...]}
     */
    static reordenar = asyncHandler(async (req, res) => {
        const { paginaId } = req.params;
        const { ordenamiento } = req.body;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que la página pertenece a la organización
        const pagina = await WebsitePaginasModel.obtenerPorId(paginaId, organizacionId);
        if (!pagina) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        await WebsiteBloquesModel.reordenar(paginaId, ordenamiento, organizacionId);

        // Obtener lista actualizada
        const bloques = await WebsiteBloquesModel.listar(paginaId, organizacionId);

        return ResponseHelper.success(
            res,
            bloques,
            'Bloques reordenados exitosamente'
        );
    });

    /**
     * Duplicar bloque
     * POST /api/v1/website/bloques/:id/duplicar
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static duplicar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        // Verificar que el bloque existe y pertenece a la organización
        const bloqueOriginal = await WebsiteBloquesModel.obtenerPorId(id, organizacionId);
        if (!bloqueOriginal) {
            return ResponseHelper.error(
                res,
                'Bloque no encontrado',
                404
            );
        }

        const bloqueDuplicado = await WebsiteBloquesModel.duplicar(id, organizacionId);

        return ResponseHelper.success(
            res,
            bloqueDuplicado,
            'Bloque duplicado exitosamente',
            201
        );
    });

    /**
     * Eliminar bloque
     * DELETE /api/v1/website/bloques/:id
     *
     * @requires auth - admin o propietario
     * @requires tenant - organizacionId desde RLS context
     */
    static eliminar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const organizacionId = req.tenant.organizacionId;

        const eliminado = await WebsiteBloquesModel.eliminar(id, organizacionId);

        if (!eliminado) {
            return ResponseHelper.error(
                res,
                'Bloque no encontrado',
                404
            );
        }

        return ResponseHelper.success(
            res,
            { id },
            'Bloque eliminado exitosamente'
        );
    });

    /**
     * Obtener contenido por defecto para un tipo de bloque
     * GET /api/v1/website/bloques/tipos/:tipo/default
     *
     * @requires auth - cualquier rol
     */
    static obtenerDefault = asyncHandler(async (req, res) => {
        const { tipo } = req.params;

        if (!WebsiteBloquesModel.TIPOS_VALIDOS.includes(tipo)) {
            return ResponseHelper.error(
                res,
                `Tipo de bloque inválido. Tipos permitidos: ${WebsiteBloquesModel.TIPOS_VALIDOS.join(', ')}`,
                400
            );
        }

        const contenidoDefault = WebsiteBloquesModel.obtenerContenidoDefault(tipo);

        return ResponseHelper.success(
            res,
            { tipo, contenido: contenidoDefault },
            'Contenido por defecto obtenido exitosamente'
        );
    });

    /**
     * Listar tipos de bloques disponibles
     * GET /api/v1/website/bloques/tipos
     *
     * @requires auth - cualquier rol
     */
    static listarTipos = asyncHandler(async (req, res) => {
        const tipos = WebsiteBloquesModel.TIPOS_VALIDOS.map(tipo => ({
            tipo,
            descripcion: {
                hero: 'Banner principal con imagen/video',
                servicios: 'Cards de servicios',
                testimonios: 'Reseñas de clientes',
                equipo: 'Staff/profesionales',
                cta: 'Call to action',
                contacto: 'Formulario + info de contacto',
                footer: 'Pie de página',
                texto: 'Contenido HTML libre',
                galeria: 'Galería de imágenes',
                video: 'Video embebido',
                separador: 'Separador visual'
            }[tipo]
        }));

        return ResponseHelper.success(
            res,
            tipos,
            'Tipos de bloques obtenidos exitosamente'
        );
    });
}

module.exports = WebsiteBloquesController;
