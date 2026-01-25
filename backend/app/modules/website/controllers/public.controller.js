const {
    WebsiteConfigModel,
    WebsitePaginasModel,
    WebsiteBloquesModel,
    WebsiteContactosModel,
} = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const RLSContextManager = require('../../../utils/rlsContextManager');
const NotificacionesService = require('../../notificaciones/services/notificaciones.service');

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
     * @body {nombre, email, telefono, mensaje, pagina_origen}
     * @returns Confirmación del mensaje recibido
     */
    static enviarContacto = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { nombre, email, telefono, mensaje, pagina_origen } = req.body;

        // Validación básica
        if (!nombre || nombre.trim().length < 2) {
            return ResponseHelper.error(
                res,
                'El nombre es requerido (mínimo 2 caracteres)',
                400
            );
        }

        if (!email && !telefono) {
            return ResponseHelper.error(
                res,
                'Se requiere al menos un medio de contacto (email o teléfono)',
                400
            );
        }

        // Verificar que el sitio existe
        const config = await WebsiteConfigModel.obtenerPorSlug(slug);
        if (!config) {
            return ResponseHelper.error(
                res,
                'Sitio no encontrado',
                404
            );
        }

        // Obtener metadatos del request
        const ip_origen = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
        const user_agent = req.headers['user-agent'];

        // Crear contacto en la base de datos
        const contacto = await WebsiteContactosModel.crear({
            website_id: config.id,
            organizacion_id: config.organizacion_id,
            nombre: nombre.trim(),
            email: email?.trim() || null,
            telefono: telefono?.trim() || null,
            mensaje: mensaje?.trim() || null,
            pagina_origen: pagina_origen || null,
            ip_origen,
            user_agent,
        });

        console.log('[WebsitePublicController.enviarContacto] Contacto guardado', {
            contacto_id: contacto.id,
            sitio_slug: slug,
            organizacion_id: config.organizacion_id,
            nombre,
        });

        // Enviar notificación al propietario
        try {
            await NotificacionesService.enviarNotificacion({
                organizacionId: config.organizacion_id,
                tipo: 'website_contacto',
                titulo: `Nuevo contacto desde ${config.nombre_sitio || 'tu sitio web'}`,
                mensaje: `${nombre} te ha enviado un mensaje${email ? ` (${email})` : ''}${telefono ? ` - Tel: ${telefono}` : ''}`,
                datos: {
                    contacto_id: contacto.id,
                    nombre,
                    email,
                    telefono,
                    mensaje: mensaje?.substring(0, 200),
                },
                // Enviar a admins de la organización
                canales: ['app', 'email'],
                destinatarios: 'admins',
            });
        } catch (notifError) {
            // No fallar si la notificación falla
            console.warn('[WebsitePublicController.enviarContacto] Error enviando notificación:', notifError.message);
        }

        return ResponseHelper.success(
            res,
            {
                recibido: true,
                contacto_id: contacto.id,
                fecha: contacto.creado_en,
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
