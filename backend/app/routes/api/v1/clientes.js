const express = require('express');
const ClienteController = require('../../../controllers/cliente.controller');
const { auth, tenant, validation, rateLimiting, subscription } = require('../../../middleware');
const clienteSchemas = require('../../../templates/scheduling-saas/schemas/cliente.schemas');

const router = express.Router();

router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    subscription.checkActiveSubscription,       // ✅ Verificar suscripción activa
    subscription.checkResourceLimit('clientes'), // ✅ Verificar límite de clientes
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.crear),
    ClienteController.crear
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.listar),
    ClienteController.listar
);

router.get('/estadisticas',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.obtenerEstadisticas),
    ClienteController.obtenerEstadisticas
);

router.get('/buscar-telefono',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorTelefono),
    ClienteController.buscarPorTelefono
);

router.get('/buscar-nombre',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscarPorNombre),
    ClienteController.buscarPorNombre
);

router.get('/buscar',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.buscar),
    ClienteController.buscar
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.obtenerPorId),
    ClienteController.obtenerPorId
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(clienteSchemas.actualizar),
    ClienteController.actualizar
);

router.patch('/:id/estado',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin', 'manager']),
    validation.validate(clienteSchemas.cambiarEstado),
    ClienteController.cambiarEstado
);

router.delete('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    auth.requireRole(['super_admin', 'admin', 'organizacion_admin']),
    validation.validate(clienteSchemas.eliminar),
    ClienteController.eliminar
);

module.exports = router;
