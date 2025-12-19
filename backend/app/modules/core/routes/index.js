/**
 * @fileoverview Routes del Módulo Core
 * @description Exporta todas las rutas del módulo core
 * @version 2.0.0
 * @date Diciembre 2025
 */

const authRouter = require('./auth');
const organizacionesRouter = require('./organizaciones');
const usuariosRouter = require('./usuarios');
const planesRouter = require('./planes');
const subscripcionesRouter = require('./subscripciones');
const pagosRouter = require('./pagos');
const webhooksRouter = require('./webhooks');
const superadminRouter = require('./superadmin');

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
