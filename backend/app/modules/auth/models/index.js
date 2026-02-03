/**
 * @fileoverview Exportaciones de modelos del módulo Auth
 * @description Re-exporta todos los modelos de autenticación
 */

const AuthModel = require('./auth.model');
const ActivacionModel = require('./activacion.model');

module.exports = {
    AuthModel,
    ActivacionModel
};
