/**
 * @fileoverview Re-export de Middleware de Autenticación
 * @description Este archivo re-exporta desde el módulo auth para compatibilidad
 * @version 3.0.0 - Migrado a modules/auth
 *
 * NOTA: El código original fue movido a modules/auth/middleware/auth.js
 * Este archivo existe solo para mantener compatibilidad con imports existentes.
 */

module.exports = require('../modules/auth/middleware/auth');
