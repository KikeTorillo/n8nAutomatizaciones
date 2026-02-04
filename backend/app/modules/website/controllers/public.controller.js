const {
    WebsiteConfigModel,
    WebsitePaginasModel,
} = require('../models');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');
const websiteCacheService = require('../services/websiteCache.service');
const WebsitePreviewService = require('../services/preview.service');
const ContactosService = require('../services/contactos.service');
const ErpDataService = require('../services/erp-data.service');

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

        // 1. Intentar obtener del caché
        const cached = await websiteCacheService.getSitio(slug);
        if (cached.found) {
            return ResponseHelper.success(
                res,
                cached.valor,
                'Sitio obtenido exitosamente'
            );
        }

        // 2. No está en caché, consultar BD
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

        // 3. Construir respuesta
        const respuesta = {
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
        };

        // 4. Guardar en caché (async, no bloqueante)
        websiteCacheService.setSitio(slug, respuesta).catch(err => {
            console.warn('[WebsitePublicController] Error guardando en caché:', err.message);
        });

        return ResponseHelper.success(
            res,
            respuesta,
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

        // 1. Intentar obtener del caché
        const cached = await websiteCacheService.getPagina(slug, pagina);
        if (cached.found) {
            return ResponseHelper.success(
                res,
                cached.valor,
                'Página obtenida exitosamente'
            );
        }

        // 2. No está en caché, consultar BD
        const paginaData = await WebsitePaginasModel.obtenerPorSlug(slug, pagina);

        if (!paginaData) {
            return ResponseHelper.error(
                res,
                'Página no encontrada',
                404
            );
        }

        // 3. Construir respuesta
        const respuesta = {
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
        };

        // 4. Guardar en caché (async, no bloqueante)
        websiteCacheService.setPagina(slug, pagina, respuesta).catch(err => {
            console.warn('[WebsitePublicController] Error guardando página en caché:', err.message);
        });

        return ResponseHelper.success(
            res,
            respuesta,
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

        // Verificar que el sitio existe
        const config = await WebsiteConfigModel.obtenerPorSlug(slug);
        if (!config) {
            return ResponseHelper.error(res, 'Sitio no encontrado', 404);
        }

        // Extraer metadatos del request
        const metadata = ContactosService.extraerMetadatos(req);

        // Crear contacto usando el servicio
        const { contacto, nombreSanitizado, mensajeSanitizado } = await ContactosService.crearContacto({
            websiteId: config.id,
            organizacionId: config.organizacion_id,
            nombre,
            email,
            telefono,
            mensaje,
            paginaOrigen: pagina_origen
        }, metadata);

        // Enviar notificación a admins (async, no bloqueante)
        ContactosService.notificarAdmins({
            organizacionId: config.organizacion_id,
            nombreSitio: config.nombre_sitio,
            contacto: {
                nombre: nombreSanitizado,
                email,
                telefono,
                mensaje: mensajeSanitizado
            },
            contactoId: contacto.id
        });

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
     * @query {string} categorias - Categorías separadas por coma
     * @query {string} ids - IDs de servicios separados por coma
     * @returns Lista de servicios activos de la organización
     */
    static obtenerServicios = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { categorias, ids } = req.query;

        // Obtener config para validar que existe y obtener organizacion_id
        const config = await WebsiteConfigModel.obtenerPorSlug(slug);
        if (!config) {
            return ResponseHelper.error(res, 'Sitio no encontrado', 404);
        }

        // Delegar a ErpDataService
        const servicios = await ErpDataService.obtenerServiciosPublicos(
            config.organizacion_id,
            { categorias, ids }
        );

        return ResponseHelper.success(
            res,
            { servicios },
            'Servicios obtenidos exitosamente'
        );
    });

    /**
     * Obtener profesionales públicos de la organización
     * GET /api/v1/public/sitio/:slug/profesionales
     *
     * @public Sin autenticación requerida
     * @query {string} departamentos - IDs de departamentos separados por coma
     * @query {string} ids - IDs de profesionales separados por coma
     * @returns Lista de profesionales activos de la organización
     */
    static obtenerProfesionales = asyncHandler(async (req, res) => {
        const { slug } = req.params;
        const { departamentos, ids } = req.query;

        // Obtener config para validar que existe y obtener organizacion_id
        const config = await WebsiteConfigModel.obtenerPorSlug(slug);
        if (!config) {
            return ResponseHelper.error(res, 'Sitio no encontrado', 404);
        }

        // Delegar a ErpDataService
        const profesionales = await ErpDataService.obtenerProfesionalesPublicos(
            config.organizacion_id,
            { departamentos, ids }
        );

        return ResponseHelper.success(
            res,
            { profesionales },
            'Profesionales obtenidos exitosamente'
        );
    });

    /**
     * Obtener sitio via token de preview
     * GET /api/v1/public/preview/:token
     *
     * @public Sin autenticación, requiere token válido
     * @returns Sitio completo (incluso si no está publicado)
     */
    static obtenerPreview = asyncHandler(async (req, res) => {
        const { token } = req.params;

        // Validar token
        const websiteId = await WebsitePreviewService.validarToken(token);

        if (!websiteId) {
            return ResponseHelper.error(
                res,
                'Token de preview inválido o expirado',
                404
            );
        }

        // Obtener sitio completo
        const sitio = await WebsitePreviewService.obtenerSitioParaPreview(websiteId);

        if (!sitio) {
            return ResponseHelper.error(
                res,
                'Sitio no encontrado',
                404
            );
        }

        return ResponseHelper.success(
            res,
            sitio,
            'Preview obtenido exitosamente'
        );
    });
}

module.exports = WebsitePublicController;
