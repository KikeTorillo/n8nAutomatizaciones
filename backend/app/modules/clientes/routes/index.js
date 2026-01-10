/**
 * @fileoverview Routes del Módulo Clientes
 * @description Re-exporta todas las rutas del módulo de clientes
 * @version 1.2.0
 * @date Enero 2026 - Agregado etiquetas, oportunidades
 */

const clientesRouter = require('./clientes');
const etiquetasRouter = require('./etiquetas');
const oportunidadesRouter = require('./oportunidades');

module.exports = {
  clientes: clientesRouter,
  etiquetas: etiquetasRouter,
  oportunidades: oportunidadesRouter
};
