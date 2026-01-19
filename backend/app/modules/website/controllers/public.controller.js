const { WebsiteConfigModel, WebsitePaginasModel, WebsiteBloquesModel } = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const RLSContextManager = require('../../../utils/rlsContextManager');

/**
 * ====================================================================
 * CONTROLLER - WEBSITE PÚBLICO
 * ====================================================================
 *
 * Endpoints públicos para renderizar el sitio web sin autenticación.
 * Accesible via nexo.com/sitio/{slug}
 *
 * ENDPOINTS (4):
 * - GET  /sitio/:slug           - Obtener sitio completo con menú
 * - GET  /sitio/:slug/:pagina   - Obtener página con bloques
 * - POST /sitio/:slug/contacto  - Enviar formulario de contacto
 * - GET  /sitio/:slug/servicios - Obtener servicios públicos
 *
 * NO MIGRADO A BaseCrudController - Ene 2026
 * Razón: Endpoints públicos sin autenticación, no es CRUD de entidades.
 *
 * Fecha creación: 6 Diciembre 2025
 */
class WebsitePublicController {

    /**
     * Obtener sitio completo por slug
     * GET /api/v1/public/sitio/:slug
     *
     * @public Sin autenticación requerida
     * @returns Configuración del sitio + menú de navegación + página de inicio
     */
    static obtenerSitio = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        const config = await WebsiteConfigModel.obtenerPorSlug(slug);

        if (!config) {
            return ResponseHelper.error(
                res,
                'Sitio no encontrado',
                404
            );
        }

        // Obtener página de inicio (primera página por orden)
        const paginaInicio = await WebsitePaginasModel.obtenerPaginaInicio(slug);

        return ResponseHelper.success(
            res,
            {
                config: {
                    id: config.id,
                    slug: config.slug,
                    nombre_sitio: config.nombre_sitio,
                    nombre_organizacion: config.nombre_organizacion,
                    descripcion_seo: config.descripcion_seo,
                    keywords_seo: config.keywords_seo,
                    favicon_url: config.favicon_url,
                    logo_url: config.logo_url || config.organizacion_logo,
                    logo_alt: config.logo_alt,
                    // Tema
                    color_primario: config.color_primario,
                    color_secundario: config.color_secundario,
                    color_acento: config.color_acento,
                    color_texto: config.color_texto,
                    color_fondo: config.color_fondo,
                    fuente_titulos: config.fuente_titulos,
                    fuente_cuerpo: config.fuente_cuerpo,
                    // Redes sociales
                    redes_sociales: config.redes_sociales
                },
                menu: config.paginas_menu || [],
                pagina_inicio: paginaInicio ? {
                    id: paginaInicio.id,
                    titulo: paginaInicio.titulo,
                    bloques: paginaInicio.bloques || []
                } : null
            },
            'Sitio obtenido exitosamente'
        );
    });

    /**
     * Obtener página específica con bloques
     * GET /api/v1/public/sitio/:slug/:pagina
     *
     * @public Sin autenticación requerida
     * @returns Página con todos sus bloques visibles
     */
    static obtenerPagina = asyncHandler(async (req, res) => {
        const { slug, pagina } = req.params;

        const paginaData = await WebsitePaginasModel.obtenerPorSlug(slug, pagina);

        if (!paginaData) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        return ResponseHelper.success(
            res,
            {
                pagina: {
                    id: paginaData.id,
                    slug: paginaData.slug,
                    titulo: paginaData.titulo,
                    descripcion_seo: paginaData.descripcion_seo,
                    bloques: paginaData.bloques || []
                },
                tema: {
                    color_primario: paginaData.color_primario,
                    color_secundario: paginaData.color_secundario,
                    color_acento: paginaData.color_acento,
                    color_texto: paginaData.color_texto,
                    color_fondo: paginaData.color_fondo,
                    fuente_titulos: paginaData.fuente_titulos,
                    fuente_cuerpo: paginaData.fuente_cuerpo,
                    logo_url: paginaData.logo_url,
                    redes_sociales: paginaData.redes_sociales
                }
            },
            'Página obtenida exitosamente'
        );
    });

    /**
     * Enviar formulario de contacto
     * POST /api/v1/public/sitio/:slug/contacto
     *
     * @public Sin autenticación requerida
     * @body {nombre, email, telefono, mensaje}
     * @todo Implementar creación de lead/notificación
     */
    static enviarContacto = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { nombre, email, telefono, mensaje } = req.body;

        // Verificar que el sitio existe
        const config = await WebsiteConfigModel.obtenerPorSlug(slug);
        if (!config) {
            return ResponseHelper.error(
                res,
                'Sitio no encontrado',
                404
            );
        }

        // TODO: Implementar en Fase 4
        // - Crear registro en tabla de leads/contactos
        // - Enviar notificación al propietario (email, push, etc.)
        // - Integrar con n8n para automatizaciones

        // Por ahora, solo logueamos y confirmamos
        console.log('[WebsitePublicController.enviarContacto] Contacto recibido', {
            sitio_slug: slug,
            organizacion_id: config.organizacion_id,
            nombre,
            email,
            telefono,
            mensaje: mensaje?.substring(0, 100)
        });

        return ResponseHelper.success(
            res,
            {
                recibido: true,
                fecha: new Date().toISOString()
            },
            'Mensaje enviado exitosamente. Te contactaremos pronto.'
        );
    });

    /**
     * Obtener servicios públicos de la organización
     * GET /api/v1/public/sitio/:slug/servicios
     *
     * @public Sin autenticación requerida
     * @returns Lista de servicios activos de la organización
     */
    static obtenerServicios = asyncHandler(async (req, res) => {
        const { slug } = req.params;

        // Obtener config para validar que existe y obtener organizacion_id
        const config = await WebsiteConfigModel.obtenerPorSlug(slug);
        if (!config) {
            return ResponseHelper.error(res, 'Sitio no encontrado', 404);
        }

        // Obtener servicios activos de la organización
        const servicios = await RLSContextManager.withBypass(async (db) => {
            const query = `
                SELECT
                    s.id,
                    s.nombre,
                    s.descripcion,
                    s.precio,
                    s.duracion_minutos,
                    s.imagen_url
                FROM servicios s
                WHERE s.organizacion_id = $1
                AND s.activo = true
                ORDER BY s.nombre ASC
            `;
            const result = await db.query(query, [config.organizacion_id]);
            return result.rows;
        });

        return ResponseHelper.success(
            res,
            { servicios },
            'Servicios obtenidos exitosamente'
        );
    });
}

module.exports = WebsitePublicController;
