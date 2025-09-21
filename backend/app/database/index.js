/**
 * Database Models Index
 * Exportación centralizada de todos los modelos de datos
 * Plataforma SaaS Multi-Tenant para Automatización de Agendamiento
 */

const OrganizacionModel = require('./organizacion.model');
const PlantillaServicioModel = require('./plantilla-servicio.model');
const ServicioModel = require('./servicio.model');



module.exports = {
    OrganizacionModel,
    PlantillaServicioModel,
    ServicioModel,
};