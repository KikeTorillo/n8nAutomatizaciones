const express = require('express');

const authRouter = require('./auth');
const organizacionesRouter = require('./organizaciones');
const profesionalesRouter = require('./profesionales');
const clientesRouter = require('./clientes');

function routerApi(app) {
    const router = express.Router();

    app.use('/api/v1', router);

    // Rutas de autenticación (sin prefijo adicional)
    router.use('/auth', authRouter);
    router.use('/organizaciones', organizacionesRouter);
    router.use('/profesionales', profesionalesRouter);
    router.use('/clientes', clientesRouter);
}

module.exports = routerApi;
