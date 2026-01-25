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
 * • WebsiteContactosModel - Contactos del formulario público
 *
 * Fecha creación: 6 Diciembre 2025
 * Actualizado: 25 Enero 2026
 */

const WebsiteConfigModel = require('./config.model');
const WebsitePaginasModel = require('./paginas.model');
const WebsiteBloquesModel = require('./bloques.model');
const WebsiteContactosModel = require('./contactos.model');

module.exports = {
    WebsiteConfigModel,
    WebsitePaginasModel,
    WebsiteBloquesModel,
    WebsiteContactosModel,
};
