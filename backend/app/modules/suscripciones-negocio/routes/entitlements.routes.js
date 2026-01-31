/**
 * ====================================================================
 * ENTITLEMENTS ROUTES
 * ====================================================================
 * Rutas para gestión de entitlements de planes de Nexo Team.
 * Todas las rutas requieren autenticación y rol SuperAdmin (nivel >= 100).
 *
 * GET  /entitlements/planes     - Lista planes con sus entitlements
 * PUT  /entitlements/planes/:id - Actualiza entitlements de un plan
 *
 * @module suscripciones-negocio/routes/entitlements
 */

const express = require('express');
const router = express.Router();
const EntitlementsController = require('../controllers/entitlements.controller');
const { auth } = require('../../../middleware');
const { validate } = require('../../../middleware/validation');
const schemas = require('../schemas/entitlements.schemas');

/**
 * Middleware: Solo SuperAdmin (nivel_jerarquia >= 100)
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.nivel_jerarquia < 100) {
        return res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requiere rol SuperAdmin.'
        });
    }
    next();
};

/**
 * GET /entitlements/planes
 * Lista todos los planes de Nexo Team con sus entitlements
 */
router.get('/planes',
    auth.authenticateToken,
    requireSuperAdmin,
    EntitlementsController.listarPlanesNexoTeam
);

/**
 * PUT /entitlements/planes/:id
 * Actualiza los entitlements de un plan específico
 */
router.put('/planes/:id',
    auth.authenticateToken,
    requireSuperAdmin,
    validate(schemas.actualizarEntitlements),
    EntitlementsController.actualizarEntitlements
);

module.exports = router;
