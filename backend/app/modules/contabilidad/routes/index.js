const express = require('express');
const contabilidadRoutes = require('./contabilidad');

const router = express.Router();

// Montar rutas de contabilidad
router.use('/', contabilidadRoutes);

module.exports = router;
