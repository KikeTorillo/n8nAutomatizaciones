/**
 * @fileoverview Exports centralizados de Controllers del módulo CORE
 * @version 1.1.0
 *
 * NOTA (Ene 2026): Sistema de pagos/suscripciones legacy eliminado.
 * Ver módulo suscripciones-negocio para la implementación actual.
 */

module.exports = {
  AuthController: require('../../auth/controllers/auth.controller'),
  SuperadminController: require('./superadmin.controller'),
  RolesController: require('./roles.controller'),
  OrganizacionController: require('./organizacion.controller'),
  UsuarioController: require('./usuario.controller'),
  MonedasController: require('./monedas.controller'),
  ModulosController: require('./modulos.controller'),
  UbicacionesController: require('./ubicaciones.controller'),
  InvitacionController: require('./invitacion.controller')
  // NOTA: PagosController, PlanesController, SubscripcionesController eliminados
  // Ver: backend/app/modules/suscripciones-negocio/
};
