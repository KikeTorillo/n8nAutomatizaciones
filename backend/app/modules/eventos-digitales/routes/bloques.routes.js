/**
 * ====================================================================
 * RUTAS - BLOQUES INVITACIÓN
 * ====================================================================
 * Endpoints para gestión de bloques del editor de invitaciones.
 *
 * BASE: /api/v1/eventos-digitales/eventos/:id/bloques
 *
 * ENDPOINTS:
 * - GET    /                      - Obtener bloques del evento
 * - PUT    /                      - Guardar todos los bloques
 * - POST   /                      - Agregar nuevo bloque
 * - PUT    /:bloqueId             - Actualizar bloque específico
 * - DELETE /:bloqueId             - Eliminar bloque
 * - POST   /:bloqueId/duplicar    - Duplicar bloque
 * - PUT    /reordenar             - Reordenar bloques
 *
 * Fecha creación: 3 Febrero 2026
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // Para acceder a :id del padre

const BloquesController = require('../controllers/bloques.controller');
const validation = require('../../../middleware/validation');
const {
    guardarBloquesSchema,
    agregarBloqueSchema,
    actualizarBloqueSchema,
    reordenarBloquesSchema,
} = require('../schemas/bloques.schemas');

// GET /api/v1/eventos-digitales/eventos/:id/bloques
// Obtener bloques del evento
router.get(
    '/',
    BloquesController.obtener
);

// PUT /api/v1/eventos-digitales/eventos/:id/bloques
// Guardar todos los bloques (reemplaza)
router.put(
    '/',
    validation.validateBody(guardarBloquesSchema),
    BloquesController.guardar
);

// POST /api/v1/eventos-digitales/eventos/:id/bloques
// Agregar nuevo bloque
router.post(
    '/',
    validation.validateBody(agregarBloqueSchema),
    BloquesController.agregar
);

// PUT /api/v1/eventos-digitales/eventos/:id/bloques/reordenar
// Reordenar bloques (debe ir antes de /:bloqueId)
router.put(
    '/reordenar',
    validation.validateBody(reordenarBloquesSchema),
    BloquesController.reordenar
);

// PUT /api/v1/eventos-digitales/eventos/:id/bloques/:bloqueId
// Actualizar bloque específico
router.put(
    '/:bloqueId',
    validation.validateBody(actualizarBloqueSchema),
    BloquesController.actualizar
);

// DELETE /api/v1/eventos-digitales/eventos/:id/bloques/:bloqueId
// Eliminar bloque
router.delete(
    '/:bloqueId',
    BloquesController.eliminar
);

// POST /api/v1/eventos-digitales/eventos/:id/bloques/:bloqueId/duplicar
// Duplicar bloque
router.post(
    '/:bloqueId/duplicar',
    BloquesController.duplicar
);

module.exports = router;
