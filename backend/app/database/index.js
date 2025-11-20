/**
 * Database Models Index
 * Exportación centralizada de todos los modelos de datos
 * Plataforma SaaS Multi-Tenant para Automatización de Agendamiento
 */

const ClienteModel = require('../templates/scheduling-saas/models/cliente.model');
const CitaModel = require('../templates/scheduling-saas/models/citas');
const OrganizacionModel = require('./organizacion.model');
const ProfesionalModel = require('../templates/scheduling-saas/models/profesional.model');
const ServicioModel = require('../templates/scheduling-saas/models/servicio.model');
const UsuarioModel = require('./usuario.model');

module.exports = {
    ClienteModel,
    CitaModel,
    OrganizacionModel,
    ProfesionalModel,
    ServicioModel,
    UsuarioModel,
};