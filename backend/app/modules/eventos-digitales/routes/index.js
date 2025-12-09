/**
 * ====================================================================
 * RUTAS - MÓDULO EVENTOS DIGITALES
 * ====================================================================
 * Punto de entrada para todas las rutas del módulo.
 * Exporta routers separados para rutas autenticadas y públicas.
 *
 * Fecha creación: 4 Diciembre 2025
 */

const eventosRoutes = require('./eventos.routes');
const invitadosRoutes = require('./invitados.routes');
const ubicacionesRoutes = require('./ubicaciones.routes');
const mesaRegalosRoutes = require('./mesa-regalos.routes');
const felicitacionesRoutes = require('./felicitaciones.routes');
const plantillasRoutes = require('./plantillas.routes');
const mesasRoutes = require('./mesas.routes');
const publicRoutes = require('./public.routes');

module.exports = {
    eventosRoutes,
    invitadosRoutes,
    ubicacionesRoutes,
    mesaRegalosRoutes,
    felicitacionesRoutes,
    plantillasRoutes,
    mesasRoutes,
    publicRoutes
};
