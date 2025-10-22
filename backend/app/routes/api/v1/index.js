const express = require('express');

const authRouter = require('./auth');
const organizacionesRouter = require('./organizaciones');
const profesionalesRouter = require('./profesionales');
const clientesRouter = require('./clientes');
const serviciosRouter = require('./servicios');
const citasRouter = require('./citas');
const usuariosRouter = require('./usuarios');
const bloqueosHorariosRouter = require('./bloqueos-horarios');
const tiposBloqueoRouter = require('./tipos-bloqueo');
const tiposProfesionalRouter = require('./tipos-profesional');
const horariosProfesionalesRouter = require('./horarios-profesionales');
const planesRouter = require('./planes');

function routerApi(app) {
    const router = express.Router();

    app.use('/api/v1', router);

    // Rutas de autenticación y gestión de contraseñas
    router.use('/auth', authRouter);

    // Rutas públicas
    router.use('/planes', planesRouter);

    // Rutas de recursos
    router.use('/organizaciones', organizacionesRouter);
    router.use('/profesionales', profesionalesRouter);
    router.use('/clientes', clientesRouter);
    router.use('/servicios', serviciosRouter);
    router.use('/horarios-profesionales', horariosProfesionalesRouter);
    router.use('/bloqueos-horarios', bloqueosHorariosRouter);
    router.use('/tipos-bloqueo', tiposBloqueoRouter);
    router.use('/tipos-profesional', tiposProfesionalRouter);
    router.use('/citas', citasRouter);

    // Rutas de gestión de usuarios
    router.use('/usuarios', usuariosRouter);
}

module.exports = routerApi;
