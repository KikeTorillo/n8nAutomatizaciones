const express = require('express');

// ========================================
// MÓDULO CORE - Migrado a modules/core
// ========================================
const authRouter = require('../../../modules/core/routes/auth');
const setupRouter = require('../../../modules/core/routes/setup');
const superadminRouter = require('../../../modules/core/routes/superadmin');
const organizacionesRouter = require('../../../modules/core/routes/organizaciones');
const usuariosRouter = require('../../../modules/core/routes/usuarios');
const planesRouter = require('../../../modules/core/routes/planes');
const pagosRouter = require('../../../modules/core/routes/pagos');
const webhooksRouter = require('../../../modules/core/routes/webhooks');
const subscripcionesRouter = require('../../../modules/core/routes/subscripciones');

// ========================================
// PENDIENTE DE MIGRAR (mercadopago faltó)
// ========================================
const mercadopagoRouter = require('./mercadopago');

// ========================================
// MÓDULO AGENDAMIENTO - Pendiente migrar
// ========================================
const profesionalesRouter = require('../../../templates/scheduling-saas/routes/api/v1/profesionales');
const clientesRouter = require('../../../templates/scheduling-saas/routes/api/v1/clientes');
const serviciosRouter = require('../../../templates/scheduling-saas/routes/api/v1/servicios');
const citasRouter = require('../../../templates/scheduling-saas/routes/api/v1/citas');
const bloqueosHorariosRouter = require('../../../templates/scheduling-saas/routes/api/v1/bloqueos-horarios');
const tiposBloqueoRouter = require('../../../templates/scheduling-saas/routes/api/v1/tipos-bloqueo');
const tiposProfesionalRouter = require('../../../templates/scheduling-saas/routes/api/v1/tipos-profesional');
const horariosProfesionalesRouter = require('../../../templates/scheduling-saas/routes/api/v1/horarios-profesionales');
const chatbotsRouter = require('../../../templates/scheduling-saas/routes/api/v1/chatbots');
const disponibilidadRouter = require('../../../templates/scheduling-saas/routes/api/v1/disponibilidad');

// ========================================
// OTROS MÓDULOS - Pendiente migrar
// ========================================
const comisionesRouter = require('../../../templates/scheduling-saas/routes/api/v1/comisiones');
const marketplaceRouter = require('../../../templates/scheduling-saas/routes/api/v1/marketplace');
const inventarioRouter = require('../../../templates/scheduling-saas/routes/api/v1/inventario');
const posRouter = require('../../../templates/scheduling-saas/routes/api/v1/pos');

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

    // Rutas de comisiones profesionales
    router.use('/comisiones', comisionesRouter);

    // Rutas de marketplace público
    router.use('/marketplace', marketplaceRouter);

    // Rutas de inventario y punto de venta
    router.use('/inventario', inventarioRouter);
    router.use('/pos', posRouter);

    // Rutas de gestión de usuarios
    router.use('/usuarios', usuariosRouter);

    // Rutas de pagos y webhooks (Mercado Pago)
    router.use('/pagos', pagosRouter);
    router.use('/webhooks', webhooksRouter);
    router.use('/subscripciones', subscripcionesRouter);
    router.use('/mercadopago', mercadopagoRouter);
}

module.exports = routerApi;
