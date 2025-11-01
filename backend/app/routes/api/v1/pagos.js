/**
 * ====================================================================
 * ROUTES - PAGOS
 * ====================================================================
 *
 * Rutas para operaciones de pagos y suscripciones de Mercado Pago.
 *
 * STACK DE MIDDLEWARE:
 * 1. auth.authenticateToken
 * 2. tenant.setTenantContext
 * 3. rateLimiting
 * 4. validation
 * 5. Controller
 *
 * @module routes/api/v1/pagos
 */

const express = require('express');
const PagosController = require('../../../controllers/pagos.controller');
const { auth, tenant, validation, rateLimiting } = require('../../../middleware');
const pagosSchemas = require('../../../schemas/pagos.schemas');

const router = express.Router();

/**
 * Crear suscripción en Mercado Pago
 * POST /api/v1/pagos/crear-suscripcion
 *
 * Auth: admin, propietario
 * Body: { plan_codigo, payer_email? }
 *
 * Respuesta: { subscription_id, checkout_url, plan }
 */
router.post('/crear-suscripcion',
  auth.authenticateToken,
  tenant.setTenantContext,
  auth.requireRole(['super_admin', 'admin', 'propietario']),
  rateLimiting.apiRateLimit,
  validation.validate(pagosSchemas.crearSuscripcion),
  PagosController.crearSuscripcion
);

/**
 * Obtener historial de pagos
 * GET /api/v1/pagos/historial
 *
 * Auth: Todos los usuarios autenticados
 * Query: { limite?, pagina? }
 *
 * Respuesta: { pagos, paginacion }
 */
router.get('/historial',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  validation.validate(pagosSchemas.obtenerHistorial),
  PagosController.obtenerHistorial
);

/**
 * Obtener método de pago actual
 * GET /api/v1/pagos/metodo-pago
 *
 * Auth: Todos los usuarios autenticados
 *
 * Respuesta: { metodo_pago }
 */
router.get('/metodo-pago',
  auth.authenticateToken,
  tenant.setTenantContext,
  rateLimiting.apiRateLimit,
  PagosController.obtenerMetodoPago
);

module.exports = router;
