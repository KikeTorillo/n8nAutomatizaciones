/**
 * ====================================================================
 * MÓDULO WEBSITE - EXPORTACIÓN DE CONTROLLERS
 * ====================================================================
 *
 * Exporta todos los controllers del módulo website.
 *
 * Controllers:
 * • WebsiteConfigController - Configuración del sitio
 * • WebsitePaginasController - Páginas del sitio
 * • WebsiteBloquesController - Bloques de contenido
 * • WebsitePublicController - Endpoints públicos
 *
 * Fecha creación: 6 Diciembre 2025
 */

const WebsiteConfigController = require('./config.controller');
const WebsitePaginasController = require('./paginas.controller');
const WebsiteBloquesController = require('./bloques.controller');
const WebsitePublicController = require('./public.controller');

module.exports = {
    WebsiteConfigController,
    WebsitePaginasController,
    WebsiteBloquesController,
    WebsitePublicController
};
