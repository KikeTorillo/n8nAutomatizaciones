const express = require('express');

const authRouter = require('./auth');
const organizacionesRouter = require('./organizaciones');

// Solo en desarrollo: rutas de testing
const testRouter = process.env.NODE_ENV !== 'production' ? require('./test') : null;

function routerApi(app) {
    const router = express.Router();

    app.use('/api/v1', router);

    // Rutas de autenticación (sin prefijo adicional)
    router.use('/auth', authRouter);

    // Otras rutas
    router.use('/organizaciones', organizacionesRouter);
  

    // Rutas de testing solo en desarrollo
    if (testRouter) {
        router.use('/test', testRouter);
    }
}

module.exports = routerApi;
