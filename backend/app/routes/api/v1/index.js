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
const modulosRouter = require('../../../modules/core/routes/modulos');
const ubicacionesRouter = require('../../../modules/core/routes/ubicaciones');
const invitacionesRouter = require('./invitaciones');

// ========================================
// PENDIENTE DE MIGRAR (mercadopago faltó)
// ========================================
const mercadopagoRouter = require('./mercadopago');

// ========================================
// MÓDULO CORE - Clientes (Nov 2025 - Migrado desde Agendamiento)
// ========================================
const clientesRouter = require('./clientes');

// ========================================
// MÓDULO AGENDAMIENTO - Migrado a modules/agendamiento
// ========================================
const profesionalesRouter = require('../../../modules/agendamiento/routes/profesionales');
const serviciosRouter = require('../../../modules/agendamiento/routes/servicios');
const citasRouter = require('../../../modules/agendamiento/routes/citas');
const bloqueosHorariosRouter = require('../../../modules/agendamiento/routes/bloqueos-horarios');
const tiposBloqueoRouter = require('../../../modules/agendamiento/routes/tipos-bloqueo');
const tiposProfesionalRouter = require('../../../modules/agendamiento/routes/tipos-profesional');
const horariosProfesionalesRouter = require('../../../modules/agendamiento/routes/horarios-profesionales');
const chatbotsRouter = require('../../../modules/agendamiento/routes/chatbots');
const disponibilidadRouter = require('../../../modules/agendamiento/routes/disponibilidad');

// ========================================
// MÓDULO INVENTARIO - Migrado a modules/inventario
// ========================================
const inventarioRouter = require('../../../modules/inventario/routes');

// ========================================
// MÓDULO POS - Migrado a modules/pos
// ========================================
const posRouter = require('../../../modules/pos/routes');

// ========================================
// MÓDULO MARKETPLACE - Migrado a modules/marketplace
// ========================================
const marketplaceRouter = require('../../../modules/marketplace/routes');

// ========================================
// MÓDULO COMISIONES - Migrado a modules/comisiones
// ========================================
const comisionesRouter = require('../../../modules/comisiones/routes');

// ========================================
// MÓDULO RECORDATORIOS - Nov 2025
// ========================================
const recordatoriosRouter = require('../../../modules/recordatorios/routes/recordatorios.routes');

// ========================================
// MÓDULO STORAGE - Dic 2025
// ========================================
const storageRouter = require('../../../modules/storage/routes');

// ========================================
// MÓDULO EVENTOS DIGITALES - Dic 2025
// Invitaciones para bodas, XV años, bautizos, etc.
// ========================================
const {
    eventosRoutes,
    invitadosRoutes,
    ubicacionesRoutes: eventosUbicacionesRoutes,
    mesaRegalosRoutes,
    felicitacionesRoutes,
    plantillasRoutes,
    publicRoutes: eventosPublicRoutes
} = require('../../../modules/eventos-digitales/routes');

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
    router.use('/ubicaciones', ubicacionesRouter);  // Catálogos geográficos (Nov 2025)

    // Rutas de módulos (gestión de módulos activos)
    router.use('/modulos', modulosRouter);

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

    // Rutas de recordatorios automáticos
    router.use('/recordatorios', recordatoriosRouter);

    // Rutas de marketplace público
    router.use('/marketplace', marketplaceRouter);

    // Rutas de inventario y punto de venta
    router.use('/inventario', inventarioRouter);
    router.use('/pos', posRouter);

    // Rutas de gestión de usuarios
    router.use('/usuarios', usuariosRouter);

    // Rutas de invitaciones (Nov 2025 - Sistema Profesional-Usuario)
    router.use('/invitaciones', invitacionesRouter);

    // Rutas de pagos y webhooks (Mercado Pago)
    router.use('/pagos', pagosRouter);
    router.use('/webhooks', webhooksRouter);
    router.use('/subscripciones', subscripcionesRouter);
    router.use('/mercadopago', mercadopagoRouter);

    // Rutas de storage (MinIO) - Dic 2025
    router.use('/storage', storageRouter);

    // Rutas de eventos digitales (invitaciones) - Dic 2025
    router.use('/eventos-digitales', eventosRoutes);              // Gestión de eventos
    router.use('/eventos-digitales', invitadosRoutes);            // Gestión de invitados
    router.use('/eventos-digitales', eventosUbicacionesRoutes);   // Ubicaciones de eventos
    router.use('/eventos-digitales', mesaRegalosRoutes);          // Mesa de regalos
    router.use('/eventos-digitales', felicitacionesRoutes);       // Felicitaciones
    router.use('/eventos-digitales', plantillasRoutes);           // Plantillas
    router.use('/public', eventosPublicRoutes);                   // Rutas públicas (RSVP)
}

module.exports = routerApi;
