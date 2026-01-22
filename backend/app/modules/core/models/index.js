/**
 * @fileoverview Exports centralizados de Models del módulo CORE
 * @version 2.1.0
 * @updated Dic 2025 - ClienteModel movido a su propio módulo clientes/
 */

module.exports = {
  OrganizacionModel: require('./organizacion.model'),
  PlanesModel: require('./planes.model'),
  SubscripcionModel: require('./subscripcion.model'),
  UsuarioModel: require('./usuario.model'),
  RolesModel: require('./roles.model')
};
