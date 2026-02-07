/**
 * ====================================================================
 * ROUTES - COMBOS / KITS Y MODIFICADORES
 * ====================================================================
 */

const express = require('express');
const CombosController = require('../controllers/combos.controller');
const { auth, tenant, rateLimiting, modules } = require('../../../middleware');

const router = express.Router();

// ===================================================================
// COMBOS / KITS
// ===================================================================

/**
 * GET /api/v1/inventario/combos
 * Listar combos
 */
router.get('/combos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.listarCombos
);

/**
 * GET /api/v1/inventario/combos/verificar/:productoId
 * Verificar si un producto es combo
 */
router.get('/combos/verificar/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.verificarCombo
);

/**
 * GET /api/v1/inventario/combos/:productoId
 * Obtener combo por producto ID
 */
router.get('/combos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.obtenerCombo
);

/**
 * POST /api/v1/inventario/combos
 * Crear combo
 */
router.post('/combos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.crearCombo
);

/**
 * PUT /api/v1/inventario/combos/:productoId
 * Actualizar combo
 */
router.put('/combos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.actualizarCombo
);

/**
 * DELETE /api/v1/inventario/combos/:productoId
 * Eliminar combo
 */
router.delete('/combos/:productoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.eliminarCombo
);

/**
 * GET /api/v1/inventario/combos/:productoId/precio
 * Calcular precio de combo
 */
router.get('/combos/:productoId/precio',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.calcularPrecio
);

/**
 * GET /api/v1/inventario/combos/:productoId/stock
 * Verificar stock de componentes
 */
router.get('/combos/:productoId/stock',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.verificarStock
);

// ===================================================================
// MODIFICADORES - GRUPOS
// ===================================================================

/**
 * GET /api/v1/inventario/modificadores/grupos
 * Listar grupos de modificadores
 */
router.get('/modificadores/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.listarGrupos
);

/**
 * POST /api/v1/inventario/modificadores/grupos
 * Crear grupo de modificadores
 */
router.post('/modificadores/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.crearGrupo
);

/**
 * PUT /api/v1/inventario/modificadores/grupos/:id
 * Actualizar grupo de modificadores
 */
router.put('/modificadores/grupos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.actualizarGrupo
);

/**
 * DELETE /api/v1/inventario/modificadores/grupos/:id
 * Eliminar grupo de modificadores
 */
router.delete('/modificadores/grupos/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.eliminarGrupo
);

// ===================================================================
// MODIFICADORES - ITEMS
// ===================================================================

/**
 * POST /api/v1/inventario/modificadores
 * Crear modificador
 */
router.post('/modificadores',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.crearModificador
);

/**
 * PUT /api/v1/inventario/modificadores/:id
 * Actualizar modificador
 */
router.put('/modificadores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.actualizarModificador
);

/**
 * DELETE /api/v1/inventario/modificadores/:id
 * Eliminar modificador
 */
router.delete('/modificadores/:id',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.eliminarModificador
);

// ===================================================================
// MODIFICADORES - ASIGNACIONES A PRODUCTOS
// ===================================================================

/**
 * GET /api/v1/inventario/productos/:productoId/modificadores
 * Obtener modificadores de un producto
 */
router.get('/productos/:productoId/modificadores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.obtenerModificadoresProducto
);

/**
 * GET /api/v1/inventario/productos/:productoId/tiene-modificadores
 * Verificar si un producto tiene modificadores
 */
router.get('/productos/:productoId/tiene-modificadores',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.tieneModificadores
);

/**
 * GET /api/v1/inventario/productos/:productoId/grupos
 * Listar asignaciones de grupos a producto
 */
router.get('/productos/:productoId/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    rateLimiting.userRateLimit,
    CombosController.listarAsignacionesProducto
);

/**
 * POST /api/v1/inventario/productos/:productoId/grupos
 * Asignar grupo a producto
 */
router.post('/productos/:productoId/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.asignarGrupoAProducto
);

/**
 * DELETE /api/v1/inventario/productos/:productoId/grupos/:grupoId
 * Eliminar asignacion de grupo a producto
 */
router.delete('/productos/:productoId/grupos/:grupoId',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.eliminarAsignacionProducto
);

/**
 * POST /api/v1/inventario/categorias/:categoriaId/grupos
 * Asignar grupo a categoria
 */
router.post('/categorias/:categoriaId/grupos',
    auth.authenticateToken,
    tenant.setTenantContext,
    modules.requireModule('inventario'),
    tenant.verifyTenantActive,
    rateLimiting.userRateLimit,
    CombosController.asignarGrupoACategoria
);

module.exports = router;
