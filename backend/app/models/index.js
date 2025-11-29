/**
 * Database Models Index
 * Exportación centralizada de todos los modelos de datos
 * Plataforma SaaS Multi-Tenant para Automatización de Agendamiento
 */

const ClienteModel = require('../modules/core/models/cliente.model');
const CitaModel = require('../modules/agendamiento/models/citas');
const OrganizacionModel = require('../modules/core/models/organizacion.model');
const ProfesionalModel = require('../modules/agendamiento/models/profesional.model');
const ServicioModel = require('../modules/agendamiento/models/servicio.model');
const UsuarioModel = require('../modules/core/models/usuario.model');

module.exports = {
    ClienteModel,
    CitaModel,
    OrganizacionModel,
    ProfesionalModel,
    ServicioModel,
    UsuarioModel,
};