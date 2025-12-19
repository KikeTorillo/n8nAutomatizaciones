/**
 * @fileoverview API v1 Routes - Auto-registro dinámico
 * @description Usa RouteLoader para cargar rutas automáticamente desde manifests
 * @version 2.0.0
 * @date Diciembre 2025
 *
 * ARQUITECTURA:
 * - RouteLoader descubre módulos con manifest.json
 * - Cada manifest define sus rutas en el campo "routes"
 * - Rutas legacy se mantienen para compatibilidad
 *
 * Para agregar un nuevo módulo:
 * 1. Crear manifest.json con campo "routes"
 * 2. Crear routes/index.js que exporte los routers
 * 3. El RouteLoader lo detectará automáticamente
 */

const express = require('express');
const RouteLoader = require('../../../core/RouteLoader');

/**
 * Configura todas las rutas de la API v1
 * @param {Express.Application} app - Aplicación Express
 */
function routerApi(app) {
  const router = express.Router();

  // Montar en /api/v1
  app.use('/api/v1', router);

  // Cargar todas las rutas dinámicamente
  RouteLoader.registerAllRoutes(router);

  // En desarrollo, imprimir resumen
  if (process.env.NODE_ENV !== 'production') {
    RouteLoader.printSummary();
  }
}

module.exports = routerApi;
