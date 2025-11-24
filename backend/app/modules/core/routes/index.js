/**
 * @fileoverview Routes del Módulo Core
 * @description Re-exporta las rutas core existentes (PoC)
 */

const authRouter = require('../../../routes/api/v1/auth');
const organizacionesRouter = require('../../../routes/api/v1/organizaciones');
const usuariosRouter = require('../../../routes/api/v1/usuarios');
const planesRouter = require('../../../routes/api/v1/planes');
const subscripcionesRouter = require('../../../routes/api/v1/subscripciones');
const pagosRouter = require('../../../routes/api/v1/pagos');
const webhooksRouter = require('../../../routes/api/v1/webhooks');
const superadminRouter = require('../../../routes/api/v1/superadmin');

module.exports = {
  auth: authRouter,
  organizaciones: organizacionesRouter,
  usuarios: usuariosRouter,
  planes: planesRouter,
  subscripciones: subscripcionesRouter,
  pagos: pagosRouter,
  webhooks: webhooksRouter,
  superadmin: superadminRouter
};
