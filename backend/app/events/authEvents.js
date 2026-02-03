/**
 * @fileoverview Re-export de Auth Events
 * @description Este archivo re-exporta desde el módulo auth para compatibilidad
 * @version 2.0.0 - Migrado a modules/auth
 *
 * NOTA: El código original fue movido a modules/auth/events/authEvents.js
 * Este archivo existe solo para mantener compatibilidad con imports existentes.
 */

module.exports = require('../modules/auth/events/authEvents');
