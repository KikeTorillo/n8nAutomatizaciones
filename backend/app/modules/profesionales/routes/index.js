/**
 * @fileoverview Routes del Módulo Profesionales
 * @description Re-exporta todas las rutas del módulo de profesionales
 * @version 1.0.0
 * @date Diciembre 2025
 */

const profesionalesRouter = require('./profesionales');

module.exports = {
  profesionales: profesionalesRouter
};
