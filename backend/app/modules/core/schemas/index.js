/**
 * @fileoverview Exports centralizados de Schemas del módulo CORE
 * @version 1.1.0
 *
 * NOTA (Ene 2026): Schemas de pagos/suscripciones legacy eliminados.
 * Ver módulo suscripciones-negocio para la implementación actual.
 */

module.exports = {
  authSchemas: require('./auth.schemas'),
  organizacionSchemas: require('./organizacion.schemas'),
  usuarioSchemas: require('./usuario.schemas'),
  rolesSchemas: require('./roles.schemas'),
  monedasSchemas: require('./monedas.schemas'),
  modulosSchemas: require('./modulos.schemas')
  // NOTA: pagosSchemas, subscripcionesSchemas eliminados
  // Ver: backend/app/modules/suscripciones-negocio/schemas/
};
