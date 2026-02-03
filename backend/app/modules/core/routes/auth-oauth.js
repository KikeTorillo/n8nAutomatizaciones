/**
 * @fileoverview Rutas de OAuth
 * @description Maneja autenticación con proveedores externos (Google, etc.)
 * @version 1.0.0
 */

const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { rateLimiting, validation } = require('../../../middleware');
const activacionSchemas = require('../../../schemas/activacion.schemas');

const router = express.Router();

// ========== OAuth Google ==========

// Login/Registro con Google
router.post('/oauth/google',
    rateLimiting.authRateLimit,
    validation.validate(activacionSchemas.oauthGoogle),
    AuthController.oauthGoogle
);

// Futuros providers OAuth pueden agregarse aquí:
// router.post('/oauth/microsoft', ...);
// router.post('/oauth/apple', ...);

module.exports = router;
