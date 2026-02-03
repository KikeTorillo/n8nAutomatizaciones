/**
 * @fileoverview Exportaciones de schemas del módulo Auth
 * @description Re-exporta todos los schemas de validación de autenticación
 */

const authSchemas = require('./auth.schemas');
const activacionSchemas = require('./activacion.schemas');

module.exports = {
    authSchemas,
    activacionSchemas
};
