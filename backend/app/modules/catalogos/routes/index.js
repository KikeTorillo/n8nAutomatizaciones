/**
 * @fileoverview Routes del Módulo Catálogos
 * @description Re-exporta todas las rutas del módulo de catálogos
 * @version 1.0.0
 * @date Enero 2026
 *
 * Rutas incluidas:
 * - /ubicaciones-trabajo: Catálogo de ubicaciones para trabajo híbrido
 */

const ubicacionesTrabajoRouter = require('./ubicaciones-trabajo');

module.exports = {
  'ubicaciones-trabajo': ubicacionesTrabajoRouter
};
