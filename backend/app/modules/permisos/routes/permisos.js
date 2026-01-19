const express = require('express');
const router = express.Router();
const PermisosController = require('../controllers/permisos.controller');
const { auth, validation } = require('../../../middleware');
const permisosSchemas = require('../schemas/permisos.schema');

/**
 * Rutas de Permisos
 * Base: /api/v1/permisos
 *
 * Todas las rutas requieren autenticación
 * Actualizado Ene 2026: Validación Joi en TODOS los endpoints
 */

// ========================================
// CATÁLOGO DE PERMISOS (público para usuarios autenticados)
// ========================================

/**
 * @route GET /api/v1/permisos/catalogo
 * @desc Listar catálogo de permisos
 * @query modulo - Filtrar por módulo
 * @query categoria - Filtrar por categoría
 */
router.get('/catalogo',
    auth.authenticateToken,
    validation.validate(permisosSchemas.listarCatalogoSchema),
    PermisosController.listarCatalogo
);

/**
 * @route GET /api/v1/permisos/modulos
 * @desc Listar módulos disponibles
 */
router.get('/modulos',
    auth.authenticateToken,
    validation.validate(permisosSchemas.listarModulosSchema),
    PermisosController.listarModulos
);

// ========================================
// MIS PERMISOS (usuario actual)
// ========================================

/**
 * @route GET /api/v1/permisos/mis-permisos
 * @desc Obtener todos los permisos del usuario actual
 * @query sucursalId - ID de la sucursal
 */
router.get('/mis-permisos',
    auth.authenticateToken,
    validation.validate(permisosSchemas.misPermisosSchema),
    PermisosController.obtenerMisPermisos
);

/**
 * @route GET /api/v1/permisos/resumen
 * @desc Obtener resumen de permisos agrupados por módulo
 * @query sucursalId - ID de la sucursal
 */
router.get('/resumen',
    auth.authenticateToken,
    validation.validate(permisosSchemas.resumenSchema),
    PermisosController.obtenerResumen
);

/**
 * @route GET /api/v1/permisos/verificar/:codigo
 * @desc Verificar si el usuario tiene un permiso específico
 * @query sucursalId - ID de la sucursal
 */
router.get('/verificar/:codigo',
    auth.authenticateToken,
    validation.validate(permisosSchemas.verificarPermisoSchema),
    PermisosController.verificarPermiso
);

/**
 * @route GET /api/v1/permisos/valor/:codigo
 * @desc Obtener valor de un permiso específico
 * @query sucursalId - ID de la sucursal
 */
router.get('/valor/:codigo',
    auth.authenticateToken,
    validation.validate(permisosSchemas.valorPermisoSchema),
    PermisosController.obtenerValorPermiso
);

/**
 * @route GET /api/v1/permisos/modulos/:modulo
 * @desc Obtener permisos de un módulo específico
 * @query sucursalId - ID de la sucursal
 */
router.get('/modulos/:modulo',
    auth.authenticateToken,
    validation.validate(permisosSchemas.permisosModuloSchema),
    PermisosController.obtenerPermisosModulo
);

// ========================================
// PERMISOS POR ROL (requiere admin)
// ========================================

/**
 * @route GET /api/v1/permisos/roles/:rol
 * @desc Listar permisos de un rol
 */
router.get('/roles/:rol',
    auth.authenticateToken,
    validation.validate(permisosSchemas.listarPermisosPorRolSchema),
    PermisosController.listarPermisosPorRol
);

/**
 * @route PUT /api/v1/permisos/roles/:rol
 * @desc Actualizar múltiples permisos de un rol
 * @body {permisos: [{permisoId, valor}]}
 */
router.put('/roles/:rol',
    auth.authenticateToken,
    validation.validate(permisosSchemas.actualizarPermisosRolSchema),
    PermisosController.actualizarPermisosRol
);

/**
 * @route POST /api/v1/permisos/roles/:rol/permisos
 * @desc Asignar un permiso específico a un rol
 * @body {permisoId, valor}
 */
router.post('/roles/:rol/permisos',
    auth.authenticateToken,
    validation.validate(permisosSchemas.asignarPermisoRolSchema),
    PermisosController.asignarPermisoRol
);

/**
 * @route DELETE /api/v1/permisos/roles/:rol/permisos/:permisoId
 * @desc Eliminar permiso de un rol (vuelve a default)
 */
router.delete('/roles/:rol/permisos/:permisoId',
    auth.authenticateToken,
    validation.validate(permisosSchemas.eliminarPermisoRolSchema),
    PermisosController.eliminarPermisoRol
);

// ========================================
// PERMISOS POR USUARIO/SUCURSAL (overrides)
// ========================================

/**
 * @route GET /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId
 * @desc Listar overrides de un usuario en una sucursal
 */
router.get('/usuarios/:usuarioId/sucursales/:sucursalId',
    auth.authenticateToken,
    validation.validate(permisosSchemas.listarPermisosUsuarioSucursalSchema),
    PermisosController.listarPermisosUsuarioSucursal
);

/**
 * @route POST /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId
 * @desc Asignar override de permiso a usuario/sucursal
 * @body {permisoId, valor, motivo?, fechaInicio?, fechaFin?}
 */
router.post('/usuarios/:usuarioId/sucursales/:sucursalId',
    auth.authenticateToken,
    validation.validate(permisosSchemas.asignarPermisoUsuarioSucursalSchema),
    PermisosController.asignarPermisoUsuarioSucursal
);

/**
 * @route DELETE /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId/permisos/:permisoId
 * @desc Eliminar override de permiso usuario/sucursal
 */
router.delete('/usuarios/:usuarioId/sucursales/:sucursalId/permisos/:permisoId',
    auth.authenticateToken,
    validation.validate(permisosSchemas.eliminarPermisoUsuarioSucursalSchema),
    PermisosController.eliminarPermisoUsuarioSucursal
);

module.exports = router;
