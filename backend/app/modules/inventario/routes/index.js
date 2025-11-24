/**
 * @fileoverview Routes del Módulo Inventario
 * @description Re-exporta las rutas existentes de inventario (PoC)
 * En producción, estas rutas estarían directamente en este módulo
 */

// Por ahora, re-exportamos las rutas existentes
// Esto permite probar el ModuleRegistry sin mover todo el código
const inventarioRouter = require('../../../templates/scheduling-saas/routes/api/v1/inventario');

module.exports = inventarioRouter;
