/**
 * @fileoverview Routes del Módulo Clientes
 * @description Re-exporta todas las rutas del módulo de clientes
 * @version 1.0.0
 * @date Diciembre 2025
 */

const clientesRouter = require('./clientes');

module.exports = {
  clientes: clientesRouter
};
