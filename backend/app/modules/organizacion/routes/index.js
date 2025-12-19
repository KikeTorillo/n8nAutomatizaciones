/**
 * @fileoverview Routes del Módulo Organización
 * @description Re-exporta todas las rutas del módulo de organización
 * @version 1.0.0
 * @date Diciembre 2025
 */

const departamentosRouter = require('./departamentos');
const puestosRouter = require('./puestos');
const categoriasProfesionalRouter = require('./categorias-profesional');

module.exports = {
    departamentos: departamentosRouter,
    puestos: puestosRouter,
    'categorias-profesional': categoriasProfesionalRouter
};
