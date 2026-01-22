/**
 * @fileoverview Routes del Módulo Core
 * @description Exporta todas las rutas del módulo core
 * @version 2.0.0
 * @date Diciembre 2025
 */

const authRouter = require('./auth');
const organizacionesRouter = require('./organizaciones');
const usuariosRouter = require('./usuarios');
// NOTA: Sistema suscripciones v1 eliminado en Fase 0 (22 Ene 2026)
// Ver nuevo módulo: suscripciones-negocio
// const planesRouter = require('./planes');
// const subscripcionesRouter = require('./subscripciones');
// const pagosRouter = require('./pagos');
// const webhooksRouter = require('./webhooks');
const superadminRouter = require('./superadmin');
const monedasRouter = require('./monedas.routes');
const rolesRouter = require('./roles');

module.exports = {
  auth: authRouter,
  organizaciones: organizacionesRouter,
  usuarios: usuariosRouter,
  // planes: planesRouter,  // v1 deprecated
  // subscripciones: subscripcionesRouter,  // v1 deprecated
  // pagos: pagosRouter,  // v1 deprecated
  // webhooks: webhooksRouter,  // v1 deprecated - usar suscripciones-negocio
  superadmin: superadminRouter,
  monedas: monedasRouter,
  roles: rolesRouter
};
