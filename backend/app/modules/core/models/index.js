/**
 * @fileoverview Exports centralizados de Models del módulo CORE
 * @version 2.2.0
 * @updated Ene 2026 - Eliminados PlanesModel y SubscripcionModel (sistema antiguo)
 * @updated Dic 2025 - ClienteModel movido a su propio módulo clientes/
 */

module.exports = {
  OrganizacionModel: require('./organizacion.model'),
  UsuarioModel: require('./usuario.model'),
  RolesModel: require('./roles.model')
};
