const express = require('express');

const authRouter = require('./auth');
const setupRouter = require('./setup');
const superadminRouter = require('./superadmin');
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
const chatbotsRouter = require('./chatbots');
const disponibilidadRouter = require('./disponibilidad');

function routerApi(app) {
    const router = express.Router();

    app.use('/api/v1', router);

    // Rutas de autenticación y gestión de contraseñas
    router.use('/auth', authRouter);

    // Rutas de setup inicial (creación de super admin)
    router.use('/setup', setupRouter);

    // Rutas de super administrador (protegidas)
    router.use('/superadmin', superadminRouter);

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
    router.use('/disponibilidad', disponibilidadRouter);

    // Rutas de chatbots de IA
    router.use('/chatbots', chatbotsRouter);

    // Rutas de gestión de usuarios
    router.use('/usuarios', usuariosRouter);
}

module.exports = routerApi;
