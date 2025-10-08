const express = require('express');
const UsuarioController = require('../../../controllers/usuario.controller');
const { auth, tenant, rateLimiting, validation } = require('../../../middleware');
const usuarioSchemas = require('../../../schemas/usuario.schemas');

const router = express.Router();

// ========== Rutas Privadas ==========
router.post('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    auth.requireAdminRole,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.crear),
    UsuarioController.crear
);

router.get('/',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.listar),
    UsuarioController.listar
);

router.get('/bloqueados',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.obtenerBloqueados),
    UsuarioController.obtenerBloqueados
);

router.get('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.obtenerPorId),
    UsuarioController.obtenerPorId
);

router.get('/:id/bloqueo',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.verificarBloqueo),
    UsuarioController.verificarBloqueo
);

router.put('/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.apiRateLimit,
    validation.validate(usuarioSchemas.actualizar),
    UsuarioController.actualizar
);

router.patch('/:id/rol',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.cambiarRol),
    UsuarioController.cambiarRol
);

router.patch('/:id/desbloquear',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.heavyOperationRateLimit,
    validation.validate(usuarioSchemas.desbloquear),
    UsuarioController.desbloquear
);

module.exports = router;