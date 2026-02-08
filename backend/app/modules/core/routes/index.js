/**
 * @fileoverview Routes del Módulo Core
 * @description Exporta todas las rutas del módulo core
 * @version 2.1.0
 * @date Febrero 2026
 *
 * NOTA: authRouter movido a modules/auth (ver módulo auth)
 */

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
const imagesRouter = require('./images.routes');

module.exports = {
  // auth: authRouter, // Movido a modules/auth
  organizaciones: organizacionesRouter,
  usuarios: usuariosRouter,
  // planes: planesRouter,  // v1 deprecated
  // subscripciones: subscripcionesRouter,  // v1 deprecated
  // pagos: pagosRouter,  // v1 deprecated
  // webhooks: webhooksRouter,  // v1 deprecated - usar suscripciones-negocio
  superadmin: superadminRouter,
  monedas: monedasRouter,
  roles: rolesRouter,
  images: imagesRouter
};
