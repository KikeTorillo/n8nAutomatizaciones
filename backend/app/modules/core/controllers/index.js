/**
 * @fileoverview Exports centralizados de Controllers del módulo CORE
 * @version 1.0.0
 */

module.exports = {
  AuthController: require('./auth.controller'),
  PagosController: require('./pagos.controller'),
  PlanesController: require('./planes.controller'),
  SubscripcionesController: require('./subscripciones.controller'),
  SuperadminController: require('./superadmin.controller'),
  WebhooksController: require('./webhooks.controller')
};
