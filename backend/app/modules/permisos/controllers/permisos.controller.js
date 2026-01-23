const PermisosModel = require('../models/permisos.model');
const asyncHandler = require('../../../middleware/asyncHandler');
const { ResponseHelper } = require('../../../utils/helpers');
const logger = require('../../../utils/logger');

/**
 * Controller de Permisos
 *
 * Endpoints para gestionar el sistema de permisos normalizados:
 * - Catálogo de permisos
 * - Permisos por rol
 * - Override por usuario/sucursal
 * - Resolución de permisos
 */
class PermisosController {

    // ========================================
    // CATÁLOGO DE PERMISOS
    // ========================================

    /**
     * Listar catálogo de permisos
     * @route GET /api/v1/permisos/catalogo
     */
    static listarCatalogo = asyncHandler(async (req, res) => {
        const { modulo, categoria } = req.query;

        const permisos = await PermisosModel.listarCatalogo({
            modulo,
            categoria
        });

        ResponseHelper.success(res, permisos, 'Catálogo de permisos obtenido');
    });

    /**
     * Listar módulos disponibles
     * @route GET /api/v1/permisos/modulos
     */
    static listarModulos = asyncHandler(async (req, res) => {
        const modulos = await PermisosModel.listarModulos();
        ResponseHelper.success(res, modulos, 'Módulos obtenidos');
    });

    // ========================================
    // PERMISOS POR ROL
    // ========================================

    /**
     * Listar permisos de un rol
     * @route GET /api/v1/permisos/roles/:rol
     */
    static listarPermisosPorRol = asyncHandler(async (req, res) => {
        const { rol } = req.params;

        // Validar rol
        const rolesValidos = ['admin', 'propietario', 'empleado', 'bot', 'cliente'];
        if (!rolesValidos.includes(rol)) {
            return ResponseHelper.error(res, 'Rol no válido', 400);
        }

        const permisos = await PermisosModel.listarPermisosPorRol(rol);
        ResponseHelper.success(res, permisos, `Permisos del rol ${rol} obtenidos`);
    });

    /**
     * Actualizar permisos de un rol
     * @route PUT /api/v1/permisos/roles/:rol
     * @body {permisos: [{permisoId, valor}]}
     */
    static actualizarPermisosRol = asyncHandler(async (req, res) => {
        const { rol } = req.params;
        const { permisos } = req.body;

        // Solo admin/propietario puede modificar permisos de rol
        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permiso para modificar roles', 403);
        }

        // No permitir modificar super_admin
        if (rol === 'super_admin') {
            return ResponseHelper.error(res, 'No se pueden modificar permisos de super_admin', 403);
        }

        const count = await PermisosModel.actualizarPermisosRol(rol, permisos);

        logger.info('[PermisosController] Permisos de rol actualizados', {
            rol,
            cantidad: count,
            modificado_por: req.user.id
        });

        ResponseHelper.success(res, { actualizados: count }, `${count} permisos actualizados para rol ${rol}`);
    });

    /**
     * Asignar un permiso específico a un rol
     * @route POST /api/v1/permisos/roles/:rol/permisos
     * @body {permisoId, valor}
     */
    static asignarPermisoRol = asyncHandler(async (req, res) => {
        const { rol } = req.params;
        const { permisoId, valor } = req.body;

        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permiso para modificar roles', 403);
        }

        if (rol === 'super_admin') {
            return ResponseHelper.error(res, 'No se pueden modificar permisos de super_admin', 403);
        }

        const permiso = await PermisosModel.asignarPermisoRol(rol, permisoId, valor);
        ResponseHelper.success(res, permiso, 'Permiso asignado al rol');
    });

    /**
     * Eliminar permiso de un rol (vuelve a default)
     * @route DELETE /api/v1/permisos/roles/:rol/permisos/:permisoId
     */
    static eliminarPermisoRol = asyncHandler(async (req, res) => {
        const { rol, permisoId } = req.params;

        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permiso para modificar roles', 403);
        }

        if (rol === 'super_admin') {
            return ResponseHelper.error(res, 'No se pueden modificar permisos de super_admin', 403);
        }

        const eliminado = await PermisosModel.eliminarPermisoRol(rol, parseInt(permisoId));

        if (eliminado) {
            ResponseHelper.success(res, null, 'Permiso eliminado del rol (usará valor default)');
        } else {
            ResponseHelper.error(res, 'Permiso no encontrado en el rol', 404);
        }
    });

    // ========================================
    // PERMISOS POR USUARIO/SUCURSAL
    // ========================================

    /**
     * Listar overrides de un usuario en una sucursal
     * @route GET /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId
     */
    static listarPermisosUsuarioSucursal = asyncHandler(async (req, res) => {
        const { usuarioId, sucursalId } = req.params;
        const organizacionId = req.user.organizacion_id;

        const permisos = await PermisosModel.listarPermisosUsuarioSucursal(
            parseInt(usuarioId),
            parseInt(sucursalId),
            organizacionId
        );

        ResponseHelper.success(res, permisos, 'Overrides de permisos obtenidos');
    });

    /**
     * Asignar override de permiso a usuario/sucursal
     * @route POST /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId
     * @body {permisoId, valor, motivo?, fechaInicio?, fechaFin?}
     */
    static asignarPermisoUsuarioSucursal = asyncHandler(async (req, res) => {
        const { usuarioId, sucursalId } = req.params;
        const { permisoId, valor, motivo, fechaInicio, fechaFin } = req.body;
        const organizacionId = req.user.organizacion_id;

        // Verificar permiso para asignar overrides
        const puedeAsignar = await PermisosModel.tienePermiso(
            req.user.id,
            parseInt(sucursalId),
            'configuracion.roles'
        );

        // Admin siempre puede
        if (!puedeAsignar && !req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permiso para asignar permisos', 403);
        }

        const override = await PermisosModel.asignarPermisoUsuarioSucursal({
            usuarioId: parseInt(usuarioId),
            sucursalId: parseInt(sucursalId),
            permisoId,
            valor,
            motivo,
            fechaInicio,
            fechaFin
        }, organizacionId, req.user.id);

        ResponseHelper.success(res, override, 'Override de permiso asignado', 201);
    });

    /**
     * Eliminar override de permiso usuario/sucursal
     * @route DELETE /api/v1/permisos/usuarios/:usuarioId/sucursales/:sucursalId/permisos/:permisoId
     */
    static eliminarPermisoUsuarioSucursal = asyncHandler(async (req, res) => {
        const { usuarioId, sucursalId, permisoId } = req.params;
        const organizacionId = req.user.organizacion_id;

        // Verificar permiso
        if (!req.user.nivel_jerarquia >= 80) {
            const puedeEliminar = await PermisosModel.tienePermiso(
                req.user.id,
                parseInt(sucursalId),
                'configuracion.roles'
            );
            if (!puedeEliminar) {
                return ResponseHelper.error(res, 'No tienes permiso para eliminar overrides', 403);
            }
        }

        const eliminado = await PermisosModel.eliminarPermisoUsuarioSucursal(
            parseInt(usuarioId),
            parseInt(sucursalId),
            parseInt(permisoId),
            organizacionId
        );

        if (eliminado) {
            ResponseHelper.success(res, null, 'Override eliminado (usará permiso de rol)');
        } else {
            ResponseHelper.error(res, 'Override no encontrado', 404);
        }
    });

    // ========================================
    // RESOLUCIÓN DE PERMISOS
    // ========================================

    /**
     * Verificar si el usuario actual tiene un permiso
     * @route GET /api/v1/permisos/verificar/:codigo
     * @query sucursalId - ID de la sucursal
     */
    static verificarPermiso = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const sucursalId = req.query.sucursalId || req.user.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(res, 'Se requiere sucursalId', 400);
        }

        const tiene = await PermisosModel.tienePermiso(
            req.user.id,
            parseInt(sucursalId),
            codigo
        );

        ResponseHelper.success(res, { permiso: codigo, tiene }, null);
    });

    /**
     * Obtener valor de un permiso específico
     * @route GET /api/v1/permisos/valor/:codigo
     * @query sucursalId - ID de la sucursal
     */
    static obtenerValorPermiso = asyncHandler(async (req, res) => {
        const { codigo } = req.params;
        const sucursalId = req.query.sucursalId || req.user.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(res, 'Se requiere sucursalId', 400);
        }

        const valor = await PermisosModel.obtenerPermiso(
            req.user.id,
            parseInt(sucursalId),
            codigo
        );

        ResponseHelper.success(res, { permiso: codigo, valor }, null);
    });

    /**
     * Obtener todos los permisos del usuario actual
     * @route GET /api/v1/permisos/mis-permisos
     * @query sucursalId - ID de la sucursal
     */
    static obtenerMisPermisos = asyncHandler(async (req, res) => {
        const sucursalId = req.query.sucursalId || req.user.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(res, 'Se requiere sucursalId', 400);
        }

        const permisos = await PermisosModel.obtenerTodosPermisos(
            req.user.id,
            parseInt(sucursalId)
        );

        ResponseHelper.success(res, permisos, 'Permisos obtenidos');
    });

    /**
     * Obtener resumen de permisos agrupados por módulo
     * Útil para el frontend (sidebar, menú)
     * @route GET /api/v1/permisos/resumen
     * @query sucursalId - ID de la sucursal
     */
    static obtenerResumen = asyncHandler(async (req, res) => {
        const sucursalId = req.query.sucursalId || req.user.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(res, 'Se requiere sucursalId', 400);
        }

        const resumen = await PermisosModel.obtenerResumenPermisos(
            req.user.id,
            parseInt(sucursalId)
        );

        ResponseHelper.success(res, resumen, 'Resumen de permisos obtenido');
    });

    /**
     * Obtener permisos de un módulo específico
     * @route GET /api/v1/permisos/modulos/:modulo
     * @query sucursalId - ID de la sucursal
     */
    static obtenerPermisosModulo = asyncHandler(async (req, res) => {
        const { modulo } = req.params;
        const sucursalId = req.query.sucursalId || req.user.sucursal_id;

        if (!sucursalId) {
            return ResponseHelper.error(res, 'Se requiere sucursalId', 400);
        }

        const permisos = await PermisosModel.obtenerPermisosModulo(
            req.user.id,
            parseInt(sucursalId),
            modulo
        );

        ResponseHelper.success(res, permisos, `Permisos del módulo ${modulo} obtenidos`);
    });
}

module.exports = PermisosController;
