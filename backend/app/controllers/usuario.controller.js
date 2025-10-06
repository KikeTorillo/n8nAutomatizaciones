const UsuarioModel = require('../database/usuario.model');
const { ResponseHelper } = require('../utils/helpers');
const { asyncHandler } = require('../middleware');

class UsuarioController {
    static crear = asyncHandler(async (req, res) => {
        const usuarioData = {
            ...req.body,
            organizacion_id: req.tenant.organizacionId
        };

        const nuevoUsuario = await UsuarioModel.crear(usuarioData);

        return ResponseHelper.success(res, nuevoUsuario, 'Usuario creado exitosamente', 201);
    });

    static obtenerPorId = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const usuario = await UsuarioModel.buscarPorIdConRLS(parseInt(id), req.tenant.organizacionId);

        if (!usuario) {
            return ResponseHelper.error(res, 'Usuario no encontrado', 404);
        }

        return ResponseHelper.success(res, usuario, 'Usuario obtenido exitosamente');
    });

    static listar = asyncHandler(async (req, res) => {
        const filtros = {
            rol: req.query.rol || null,
            activo: req.query.activo !== undefined ? req.query.activo === 'true' : null,
            email_verificado: req.query.email_verificado !== undefined ? req.query.email_verificado === 'true' : null,
            buscar: req.query.buscar || null
        };

        const paginacion = {
            page: parseInt(req.query.page) || 1,
            limit: Math.min(parseInt(req.query.limit) || 10, 100),
            order_by: req.query.order_by || 'creado_en',
            order_direction: req.query.order_direction || 'DESC'
        };

        const resultado = await UsuarioModel.listarPorOrganizacion(
            req.tenant.organizacionId,
            filtros,
            paginacion
        );

        return ResponseHelper.success(res, resultado, 'Usuarios obtenidos exitosamente');
    });

    static actualizar = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const esAdmin = ['super_admin', 'admin', 'propietario'].includes(req.user.rol);
        const esPropioUsuario = parseInt(id) === req.user.userId;

        if (!esAdmin && !esPropioUsuario) {
            return ResponseHelper.error(res, 'Solo puedes actualizar tu propio perfil', 403);
        }

        const usuarioActualizado = await UsuarioModel.actualizarPerfil(
            parseInt(id),
            req.body,
            req.tenant.organizacionId,
            req.user.userId
        );

        if (!usuarioActualizado) {
            return ResponseHelper.error(res, 'Usuario no encontrado', 404);
        }

        return ResponseHelper.success(res, usuarioActualizado, 'Usuario actualizado exitosamente');
    });

    static cambiarRol = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { rol } = req.body;

        if (!['admin', 'propietario', 'super_admin'].includes(req.user.rol)) {
            return ResponseHelper.error(res, 'No tienes permisos para cambiar roles', 403);
        }

        const resultado = await UsuarioModel.cambiarRol(
            parseInt(id),
            rol,
            req.tenant.organizacionId,
            req.user.userId
        );

        return ResponseHelper.success(res, resultado, 'Rol de usuario cambiado exitosamente');
    });

    static desbloquear = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (!['admin', 'propietario', 'super_admin'].includes(req.user.rol)) {
            return ResponseHelper.error(res, 'No tienes permisos para desbloquear usuarios', 403);
        }

        const usuarioDesbloqueado = await UsuarioModel.desbloquearUsuario(
            parseInt(id),
            req.user.userId
        );

        return ResponseHelper.success(res, usuarioDesbloqueado, 'Usuario desbloqueado exitosamente');
    });

    static obtenerBloqueados = asyncHandler(async (req, res) => {
        if (!['admin', 'propietario', 'super_admin'].includes(req.user.rol)) {
            return ResponseHelper.error(res, 'No tienes permisos para ver usuarios bloqueados', 403);
        }

        const usuariosBloqueados = await UsuarioModel.obtenerUsuariosBloqueados(req.tenant.organizacionId);

        return ResponseHelper.success(res, usuariosBloqueados, 'Usuarios bloqueados obtenidos exitosamente');
    });

    static verificarBloqueo = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (req.user.rol === 'super_admin') {
            // Super admin puede verificar cualquier usuario
        } else if (parseInt(id) === req.user.userId) {
            // Usuario puede verificar su propio estado
        } else if (['admin', 'propietario'].includes(req.user.rol)) {
            // Admins pueden verificar usuarios de su organización
        } else {
            return ResponseHelper.error(res, 'No tienes permisos para verificar este usuario', 403);
        }

        const estadoBloqueo = await UsuarioModel.verificarBloqueo(
            parseInt(id),
            req.user.rol
        );

        if (!estadoBloqueo) {
            return ResponseHelper.error(res, 'Usuario no encontrado', 404);
        }

        return ResponseHelper.success(res, estadoBloqueo, 'Estado de bloqueo obtenido exitosamente');
    });
}

module.exports = UsuarioController;