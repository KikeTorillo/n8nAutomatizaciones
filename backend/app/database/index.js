/**
 * Database Models Index
 * Exportación centralizada de todos los modelos de datos
 * Plataforma SaaS Multi-Tenant para Automatización de Agendamiento
 */

const ClienteModel = require('./cliente.model');
const CitaModel = require('./citas');
const OrganizacionModel = require('./organizacion.model');
const ProfesionalModel = require('./profesional.model');
const ServicioModel = require('./servicio.model');
const UsuarioModel = require('./usuario.model');

module.exports = {
    ClienteModel,
    CitaModel,
    OrganizacionModel,
    ProfesionalModel,
    ServicioModel,
    UsuarioModel,
};