/**
 * ====================================================================
 * MÓDULO WEBSITE - EXPORTACIÓN DE ROUTES
 * ====================================================================
 *
 * Exporta todas las rutas del módulo website.
 *
 * Routes:
 * • websiteRouter - Rutas privadas (requieren auth)
 * • publicRouter - Rutas públicas (sin auth)
 *
 * Fecha creación: 6 Diciembre 2025
 */

const websiteRouter = require('./website.routes');
const publicRouter = require('./public.routes');

module.exports = {
    websiteRouter,
    publicRouter
};
