const UsuarioModel = require('../models/usuario.model');
const InvitacionModel = require('../models/invitacion.model');
const emailService = require('../../../services/emailService');
const { ResponseHelper } = require('../../../utils/helpers');
const { asyncHandler } = require('../../../middleware');

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
        const esAdmin = req.user.nivel_jerarquia >= 80;
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

        if (!req.user.nivel_jerarquia >= 80) {
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

        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permisos para desbloquear usuarios', 403);
        }

        const usuarioDesbloqueado = await UsuarioModel.desbloquearUsuario(
            parseInt(id),
            req.user.userId,
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, usuarioDesbloqueado, 'Usuario desbloqueado exitosamente');
    });

    static obtenerBloqueados = asyncHandler(async (req, res) => {
        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permisos para ver usuarios bloqueados', 403);
        }

        const usuariosBloqueados = await UsuarioModel.obtenerUsuariosBloqueados(req.tenant.organizacionId);

        return ResponseHelper.success(res, usuariosBloqueados, 'Usuarios bloqueados obtenidos exitosamente');
    });

    static verificarBloqueo = asyncHandler(async (req, res) => {
        const { id } = req.params;

        if (req.user.rol_codigo === 'super_admin') {
            // Super admin puede verificar cualquier usuario
        } else if (parseInt(id) === req.user.userId) {
            // Usuario puede verificar su propio estado
        } else if (req.user.nivel_jerarquia >= 80) {
            // Admins pueden verificar usuarios de su organización
        } else {
            return ResponseHelper.error(res, 'No tienes permisos para verificar este usuario', 403);
        }

        const estadoBloqueo = await UsuarioModel.verificarBloqueo(
            parseInt(id),
            req.user.rol_codigo
        );

        if (!estadoBloqueo) {
            return ResponseHelper.error(res, 'Usuario no encontrado', 404);
        }

        return ResponseHelper.success(res, estadoBloqueo, 'Estado de bloqueo obtenido exitosamente');
    });

    // ====================================================================
    // GESTIÓN DE USUARIOS ESTILO ODOO - Dic 2025
    // ====================================================================

    /**
     * Crear invitación para usuario directo (sin profesional)
     * POST /usuarios/directo
     * Dic 2025: Cambiado para usar sistema de invitaciones
     */
    static crearDirecto = asyncHandler(async (req, res) => {
        // Solo admin/propietario pueden crear usuarios
        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permisos para crear usuarios', 403);
        }

        const { email, nombre, apellidos, rol } = req.body;

        // Crear invitación para usuario directo
        const invitacion = await InvitacionModel.crearParaUsuarioDirecto({
            organizacion_id: req.tenant.organizacionId,
            email,
            nombre,
            apellidos,
            rol: rol || 'empleado',
            creado_por: req.user.id
        });

        // Enviar email de invitación
        try {
            await emailService.enviarInvitacionUsuarioDirecto({
                email: invitacion.email,
                nombre: invitacion.nombre_sugerido,
                token: invitacion.token,
                organizacion_nombre: req.user.nombre_comercial || 'la organización',
                rol: invitacion.rol,
                expira_en: invitacion.expira_en
            });
        } catch (emailError) {
            console.error('Error enviando email de invitación:', emailError);
            // No fallamos la operación, la invitación se creó
        }

        return ResponseHelper.success(res, {
            invitacion: {
                id: invitacion.id,
                email: invitacion.email,
                nombre: invitacion.nombre_sugerido,
                rol: invitacion.rol,
                estado: invitacion.estado,
                expira_en: invitacion.expira_en
            },
            mensaje: 'Se ha enviado un correo de invitación al usuario'
        }, 'Invitación enviada exitosamente', 201);
    });

    /**
     * Cambiar estado activo de usuario (y profesional vinculado)
     * PATCH /usuarios/:id/estado
     */
    static cambiarEstado = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;

        // Solo admin/propietario pueden cambiar estado
        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permisos para cambiar el estado de usuarios', 403);
        }

        const resultado = await UsuarioModel.cambiarEstadoActivo(
            parseInt(id),
            activo,
            req.tenant.organizacionId,
            req.user.userId
        );

        const mensaje = activo
            ? 'Usuario activado exitosamente'
            : 'Usuario desactivado exitosamente';

        return ResponseHelper.success(res, resultado, mensaje);
    });

    /**
     * Vincular o desvincular profesional a usuario
     * PATCH /usuarios/:id/vincular-profesional
     */
    static vincularProfesional = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { profesional_id } = req.body;

        // Solo admin/propietario pueden vincular profesionales
        if (!req.user.nivel_jerarquia >= 80) {
            return ResponseHelper.error(res, 'No tienes permisos para vincular profesionales', 403);
        }

        const resultado = await UsuarioModel.vincularProfesional(
            parseInt(id),
            profesional_id,
            req.tenant.organizacionId,
            req.user.id
        );

        const mensaje = profesional_id
            ? 'Profesional vinculado exitosamente'
            : 'Profesional desvinculado exitosamente';

        return ResponseHelper.success(res, resultado, mensaje);
    });

    /**
     * Obtener profesionales sin usuario vinculado (para selector)
     * GET /usuarios/profesionales-disponibles
     */
    static obtenerProfesionalesDisponibles = asyncHandler(async (req, res) => {
        const profesionales = await UsuarioModel.obtenerProfesionalesSinUsuario(
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, profesionales, 'Profesionales disponibles obtenidos exitosamente');
    });

    /**
     * Obtener usuarios sin profesional vinculado (para vincular al crear profesional)
     * GET /usuarios/sin-profesional
     * Dic 2025: Para flujo de crear profesional y vincular a usuario existente
     */
    static obtenerUsuariosSinProfesional = asyncHandler(async (req, res) => {
        const usuarios = await UsuarioModel.obtenerUsuariosSinProfesional(
            req.tenant.organizacionId
        );

        return ResponseHelper.success(res, usuarios, 'Usuarios sin profesional obtenidos exitosamente');
    });
}

module.exports = UsuarioController;