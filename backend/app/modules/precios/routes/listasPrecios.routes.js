/**
 * ====================================================================
 * ROUTES - LISTAS DE PRECIOS
 * ====================================================================
 *
 * Endpoints para gestión de listas de precios.
 * Módulo: Precios (Fase 5)
 *
 * ENDPOINTS:
 * - GET    /api/v1/listas-precios                    - Listar listas
 * - GET    /api/v1/listas-precios/:id                - Obtener lista
 * - POST   /api/v1/listas-precios                    - Crear lista
 * - PUT    /api/v1/listas-precios/:id                - Actualizar lista
 * - DELETE /api/v1/listas-precios/:id                - Eliminar lista
 * - GET    /api/v1/listas-precios/:id/items          - Listar items
 * - POST   /api/v1/listas-precios/:id/items          - Crear item
 * - PUT    /api/v1/listas-precios/items/:itemId      - Actualizar item
 * - DELETE /api/v1/listas-precios/items/:itemId      - Eliminar item
 * - GET    /api/v1/listas-precios/precio/:productoId - Obtener precio
 * - POST   /api/v1/listas-precios/precios-carrito    - Precios de carrito
 * - POST   /api/v1/listas-precios/:id/asignar-cliente  - Asignar a cliente
 * - POST   /api/v1/listas-precios/:id/asignar-clientes - Asignar bulk
 * - GET    /api/v1/listas-precios/:id/clientes       - Listar clientes
 */

const express = require('express');
const router = express.Router();
const ListasPreciosController = require('../controllers/listasPrecios.controller');
const { auth, tenant, rateLimiting } = require('../../../middleware');

// Middleware de autenticación y tenant
router.use(auth.authenticateToken);
router.use(tenant.setTenantContext);

// ========================================================================
// RESOLUCIÓN DE PRECIOS (sin requerir permisos especiales)
// ========================================================================

// Obtener precio de un producto
router.get('/precio/:productoId', rateLimiting.userRateLimit, ListasPreciosController.obtenerPrecio);

// Obtener precios de carrito (bulk)
router.post('/precios-carrito', rateLimiting.userRateLimit, ListasPreciosController.obtenerPreciosCarrito);

// ========================================================================
// CRUD DE LISTAS (requiere permisos)
// ========================================================================

// Listar listas de precios
router.get('/', rateLimiting.userRateLimit, ListasPreciosController.listar);

// Obtener lista por ID
router.get('/:id', rateLimiting.userRateLimit, ListasPreciosController.obtenerPorId);

// Crear lista
router.post('/', rateLimiting.userRateLimit, ListasPreciosController.crear);

// Actualizar lista
router.put('/:id', rateLimiting.userRateLimit, ListasPreciosController.actualizar);

// Eliminar lista
router.delete('/:id', rateLimiting.userRateLimit, ListasPreciosController.eliminar);

// ========================================================================
// ITEMS DE LISTA
// ========================================================================

// Listar items de una lista
router.get('/:id/items', rateLimiting.userRateLimit, ListasPreciosController.listarItems);

// Crear item
router.post('/:id/items', rateLimiting.userRateLimit, ListasPreciosController.crearItem);

// Actualizar item
router.put('/items/:itemId', rateLimiting.userRateLimit, ListasPreciosController.actualizarItem);

// Eliminar item
router.delete('/items/:itemId', rateLimiting.userRateLimit, ListasPreciosController.eliminarItem);

// ========================================================================
// ASIGNACIÓN A CLIENTES
// ========================================================================

// Listar clientes de una lista
router.get('/:id/clientes', rateLimiting.userRateLimit, ListasPreciosController.listarClientes);

// Asignar lista a un cliente
router.post('/:id/asignar-cliente', rateLimiting.userRateLimit, ListasPreciosController.asignarCliente);

// Asignar lista a múltiples clientes
router.post('/:id/asignar-clientes', rateLimiting.userRateLimit, ListasPreciosController.asignarClientesBulk);

module.exports = router;
