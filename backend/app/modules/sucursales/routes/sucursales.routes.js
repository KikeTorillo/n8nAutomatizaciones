const express = require('express');
const router = express.Router();
const SucursalesController = require('../controllers/sucursales.controller');
const asyncHandler = require('../../../middleware/asyncHandler');
const { authenticateToken, requireRole } = require('../../../middleware/auth');
const { setTenantContext } = require('../../../middleware/tenant');

// Aplicar middleware de autenticación y tenant a todas las rutas
router.use(authenticateToken);
router.use(setTenantContext);

// ========================================
// RUTAS DE SUCURSALES
// ========================================

/**
 * GET /api/v1/sucursales
 * Listar sucursales de la organización
 * Acceso: Todos los usuarios autenticados
 */
router.get('/', asyncHandler(SucursalesController.listar));

/**
 * GET /api/v1/sucursales/matriz
 * Obtener sucursal matriz
 * Acceso: Todos los usuarios autenticados
 */
router.get('/matriz', asyncHandler(SucursalesController.obtenerMatriz));

/**
 * GET /api/v1/sucursales/usuario/:usuarioId
 * Obtener sucursales de un usuario
 * Acceso: Admin o el mismo usuario
 */
router.get('/usuario/:usuarioId', asyncHandler(SucursalesController.obtenerSucursalesUsuario));

/**
 * GET /api/v1/sucursales/metricas
 * Obtener métricas consolidadas para dashboard multi-sucursal
 * Query params: sucursal_id, fecha_desde, fecha_hasta
 * Acceso: Admin y Propietario
 */
router.get('/metricas',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.obtenerMetricas)
);

/**
 * GET /api/v1/sucursales/:id
 * Obtener sucursal por ID
 * Acceso: Todos los usuarios autenticados
 */
router.get('/:id', asyncHandler(SucursalesController.obtenerPorId));

/**
 * POST /api/v1/sucursales
 * Crear nueva sucursal
 * Acceso: Admin y Propietario
 */
router.post('/',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.crear)
);

/**
 * PUT /api/v1/sucursales/:id
 * Actualizar sucursal
 * Acceso: Admin y Propietario
 */
router.put('/:id',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.actualizar)
);

/**
 * DELETE /api/v1/sucursales/:id
 * Eliminar sucursal (soft delete)
 * Acceso: Admin y Propietario
 */
router.delete('/:id',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.eliminar)
);

// ========================================
// RUTAS DE USUARIOS DE SUCURSAL
// ========================================

/**
 * GET /api/v1/sucursales/:id/usuarios
 * Obtener usuarios de una sucursal
 * Acceso: Admin y Propietario
 */
router.get('/:id/usuarios',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.obtenerUsuarios)
);

/**
 * POST /api/v1/sucursales/:id/usuarios
 * Asignar usuario a sucursal
 * Acceso: Admin y Propietario
 */
router.post('/:id/usuarios',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.asignarUsuario)
);

// ========================================
// RUTAS DE PROFESIONALES DE SUCURSAL
// ========================================

/**
 * GET /api/v1/sucursales/:id/profesionales
 * Obtener profesionales de una sucursal
 * Acceso: Todos los usuarios autenticados
 */
router.get('/:id/profesionales', asyncHandler(SucursalesController.obtenerProfesionales));

/**
 * POST /api/v1/sucursales/:id/profesionales
 * Asignar profesional a sucursal
 * Acceso: Admin y Propietario
 */
router.post('/:id/profesionales',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.asignarProfesional)
);

// ========================================
// RUTAS DE TRANSFERENCIAS DE STOCK
// ========================================

/**
 * GET /api/v1/sucursales/transferencias
 * Listar transferencias de stock
 * Acceso: Admin, Propietario y Empleado
 */
router.get('/transferencias/lista', asyncHandler(SucursalesController.listarTransferencias));

/**
 * GET /api/v1/sucursales/transferencias/:id
 * Obtener transferencia por ID
 * Acceso: Todos los usuarios autenticados
 */
router.get('/transferencias/:id', asyncHandler(SucursalesController.obtenerTransferencia));

/**
 * POST /api/v1/sucursales/transferencias
 * Crear nueva transferencia
 * Acceso: Admin y Propietario
 */
router.post('/transferencias',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.crearTransferencia)
);

/**
 * POST /api/v1/sucursales/transferencias/:id/items
 * Agregar item a transferencia
 * Acceso: Admin y Propietario
 */
router.post('/transferencias/:id/items',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.agregarItemTransferencia)
);

/**
 * DELETE /api/v1/sucursales/transferencias/:id/items/:itemId
 * Eliminar item de transferencia
 * Acceso: Admin y Propietario
 */
router.delete('/transferencias/:id/items/:itemId',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.eliminarItemTransferencia)
);

/**
 * POST /api/v1/sucursales/transferencias/:id/enviar
 * Enviar transferencia (borrador -> enviado)
 * Acceso: Admin y Propietario
 */
router.post('/transferencias/:id/enviar',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.enviarTransferencia)
);

/**
 * POST /api/v1/sucursales/transferencias/:id/recibir
 * Recibir transferencia (enviado -> recibido)
 * Acceso: Admin, Propietario y Empleado (solo destino)
 */
router.post('/transferencias/:id/recibir',
    asyncHandler(SucursalesController.recibirTransferencia)
);

/**
 * POST /api/v1/sucursales/transferencias/:id/cancelar
 * Cancelar transferencia
 * Acceso: Admin y Propietario
 */
router.post('/transferencias/:id/cancelar',
    requireRole(['admin', 'propietario']),
    asyncHandler(SucursalesController.cancelarTransferencia)
);

module.exports = router;
