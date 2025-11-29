/**
 * @fileoverview Exports centralizados de Models del módulo CORE
 * @version 2.0.0
 * @updated Nov 2025 - Agregado ClienteModel (migración desde Agendamiento)
 */

module.exports = {
  ClienteModel: require('./cliente.model'),
  OrganizacionModel: require('./organizacion.model'),
  PlanesModel: require('./planes.model'),
  SubscripcionModel: require('./subscripcion.model'),
  UsuarioModel: require('./usuario.model')
};
