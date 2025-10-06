const express = require('express');

const authRouter = require('./auth');
const organizacionesRouter = require('./organizaciones');
const profesionalesRouter = require('./profesionales');
const clientesRouter = require('./clientes');
const serviciosRouter = require('./servicios');
const horariosRouter = require('./horarios');
const citasRouter = require('./citas');
const usuariosRouter = require('./usuarios');
const bloqueosHorariosRouter = require('./bloqueos-horarios');

function routerApi(app) {
    const router = express.Router();

    app.use('/api/v1', router);

    // Rutas de autenticación y gestión de contraseñas
    router.use('/auth', authRouter);

    // Rutas de recursos
    router.use('/organizaciones', organizacionesRouter);
    router.use('/profesionales', profesionalesRouter);
    router.use('/clientes', clientesRouter);
    router.use('/servicios', serviciosRouter);
    router.use('/horarios', horariosRouter);
    router.use('/bloqueos-horarios', bloqueosHorariosRouter);
    router.use('/citas', citasRouter);

    // Rutas de gestión de usuarios
    router.use('/usuarios', usuariosRouter);
}

module.exports = routerApi;
