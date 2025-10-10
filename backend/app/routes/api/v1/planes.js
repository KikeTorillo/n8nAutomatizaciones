const express = require('express');
const PlanController = require('../../../controllers/planes.controller');
const { rateLimiting } = require('../../../middleware');

const router = express.Router();

// GET /api/v1/planes - Listar todos los planes
router.get('/',
    rateLimiting.apiRateLimit,
    PlanController.listar
);

// GET /api/v1/planes/:id - Obtener un plan por ID
router.get('/:id',
    rateLimiting.apiRateLimit,
    PlanController.obtenerPorId
);

module.exports = router;
