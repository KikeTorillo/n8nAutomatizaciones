/**
 * ====================================================================
 * MÓDULO WEBSITE - EXPORTACIÓN DE MODELOS
 * ====================================================================
 *
 * Exporta todos los modelos del módulo website para uso en controllers.
 *
 * Modelos:
 * • WebsiteConfigModel - Configuración del sitio
 * • WebsitePaginasModel - Páginas del sitio
 * • WebsiteBloquesModel - Bloques de contenido
 *
 * Fecha creación: 6 Diciembre 2025
 */

const WebsiteConfigModel = require('./config.model');
const WebsitePaginasModel = require('./paginas.model');
const WebsiteBloquesModel = require('./bloques.model');

module.exports = {
    WebsiteConfigModel,
    WebsitePaginasModel,
    WebsiteBloquesModel
};
