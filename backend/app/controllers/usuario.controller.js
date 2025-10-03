/**
 * Controller de Usuarios
 * Gestión de operaciones CRUD para usuarios con aislamiento multi-tenant
 * Incluye manejo de errores, validaciones y logging
 */

const UsuarioModel = require('../database/usuario.model');
const logger = require('../utils/logger');
const { ResponseHelper } = require('../utils/helpers');

class UsuarioController {
    /**
     * Crear nuevo usuario
     * POST /api/v1/usuarios
     */
    static async crear(req, res) {
        try {
            const usuarioData = {
                ...req.body,
                organizacion_id: req.tenant.organizacionId
            };

            // Crear usuario en la base de datos
            const nuevoUsuario = await UsuarioModel.crear(usuarioData);

            ResponseHelper.success(res, nuevoUsuario, 'Usuario creado exitosamente', 201);

        } catch (error) {
            logger.error('Error al crear usuario via API:', {
                error: error.message,
                stack: error.stack,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('email ya está registrado')) {
                return ResponseHelper.error(res, error.message, 409);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener usuario por ID
     * GET /api/v1/usuarios/:id
     */
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const usuario = await UsuarioModel.buscarPorId(parseInt(id));

            if (!usuario) {
                return ResponseHelper.error(res, 'Usuario no encontrado', 404);
            }

            // Verificar que el usuario pertenece a la organización correcta
            if (usuario.organizacion_id !== req.tenant.organizacionId) {
                return ResponseHelper.error(res, 'Usuario no encontrado', 404);
            }

            ResponseHelper.success(res, usuario, 'Usuario obtenido exitosamente');

        } catch (error) {
            logger.error('Error al obtener usuario por ID:', {
                error: error.message,
                stack: error.stack,
                id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Listar usuarios por organización
     * GET /api/v1/usuarios
     */
    static async listar(req, res) {
        try {
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

            ResponseHelper.success(res, resultado, 'Usuarios obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al listar usuarios:', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Actualizar perfil de usuario
     * PUT /api/v1/usuarios/:id
     */
    static async actualizar(req, res) {
        try {
            const { id } = req.params;

            // Verificar que el usuario existe y pertenece a la organización
            const usuarioExistente = await UsuarioModel.buscarPorId(parseInt(id));

            if (!usuarioExistente) {
                return ResponseHelper.error(res, 'Usuario no encontrado', 404);
            }

            if (usuarioExistente.organizacion_id !== req.tenant.organizacionId) {
                return ResponseHelper.error(res, 'Usuario no encontrado', 404);
            }

            // Solo se puede actualizar su propio perfil (no super_admin/admin)
            if (!['super_admin', 'admin', 'propietario'].includes(req.user.rol) && parseInt(id) !== req.user.userId) {
                return ResponseHelper.error(res, 'Solo puedes actualizar tu propio perfil', 403);
            }

            const usuarioActualizado = await UsuarioModel.actualizarPerfil(parseInt(id), req.body);

            ResponseHelper.success(res, usuarioActualizado, 'Usuario actualizado exitosamente');

        } catch (error) {
            logger.error('Error al actualizar usuario:', {
                error: error.message,
                stack: error.stack,
                id: req.params.id,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('No hay campos válidos para actualizar')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Cambiar rol de usuario (solo admins)
     * PATCH /api/v1/usuarios/:id/rol
     */
    static async cambiarRol(req, res) {
        try {
            const { id } = req.params;
            const { rol } = req.body;

            // Solo admins y super_admins pueden cambiar roles
            if (!['admin', 'propietario', 'super_admin'].includes(req.user.rol)) {
                return ResponseHelper.error(res, 'No tienes permisos para cambiar roles', 403);
            }

            const resultado = await UsuarioModel.cambiarRol(
                parseInt(id),
                rol,
                req.tenant.organizacionId,
                req.user.userId
            );

            ResponseHelper.success(res, resultado, 'Rol de usuario cambiado exitosamente');

        } catch (error) {
            logger.error('Error al cambiar rol de usuario:', {
                error: error.message,
                stack: error.stack,
                id: req.params.id,
                body: req.body,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('Rol no válido') ||
                error.message.includes('Usuario no encontrado') ||
                error.message.includes('ya tiene este rol')) {
                return ResponseHelper.error(res, error.message, 400);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Desbloquear usuario (solo admins)
     * PATCH /api/v1/usuarios/:id/desbloquear
     */
    static async desbloquear(req, res) {
        try {
            const { id } = req.params;

            // Solo admins y super_admins pueden desbloquear usuarios
            if (!['admin', 'propietario', 'super_admin'].includes(req.user.rol)) {
                return ResponseHelper.error(res, 'No tienes permisos para desbloquear usuarios', 403);
            }

            // Desbloquear usuario
            const usuarioDesbloqueado = await UsuarioModel.desbloquearUsuario(
                parseInt(id),
                req.user.userId
            );

            ResponseHelper.success(res, usuarioDesbloqueado, 'Usuario desbloqueado exitosamente');

        } catch (error) {
            logger.error('Error al desbloquear usuario:', {
                error: error.message,
                stack: error.stack,
                id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            if (error.message.includes('Usuario no encontrado')) {
                return ResponseHelper.error(res, error.message, 404);
            }

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Obtener usuarios bloqueados de la organización
     * GET /api/v1/usuarios/bloqueados
     */
    static async obtenerBloqueados(req, res) {
        try {
            // Solo admins y super_admins pueden ver usuarios bloqueados
            if (!['admin', 'propietario', 'super_admin'].includes(req.user.rol)) {
                return ResponseHelper.error(res, 'No tienes permisos para ver usuarios bloqueados', 403);
            }

            const usuariosBloqueados = await UsuarioModel.obtenerUsuariosBloqueados(req.tenant.organizacionId);

            ResponseHelper.success(res, usuariosBloqueados, 'Usuarios bloqueados obtenidos exitosamente');

        } catch (error) {
            logger.error('Error al obtener usuarios bloqueados:', {
                error: error.message,
                stack: error.stack,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }

    /**
     * Verificar estado de bloqueo de un usuario
     * GET /api/v1/usuarios/:id/bloqueo
     */
    static async verificarBloqueo(req, res) {
        try {
            const { id } = req.params;

            // Verificar permisos (solo self-access o admins)
            if (req.user.rol === 'super_admin') {
                // Super admin puede verificar cualquier usuario
            } else if (parseInt(id) === req.user.userId) {
                // Usuario puede verificar su propio estado
            } else if (['admin', 'propietario'].includes(req.user.rol)) {
                // Admins pueden verificar usuarios de su organización
            } else {
                return ResponseHelper.error(res, 'No tienes permisos para verificar este usuario', 403);
            }

            // Verificar bloqueo
            const estadoBloqueo = await UsuarioModel.verificarBloqueo(
                parseInt(id),
                req.user.rol
            );

            if (!estadoBloqueo) {
                return ResponseHelper.error(res, 'Usuario no encontrado', 404);
            }

            ResponseHelper.success(res, estadoBloqueo, 'Estado de bloqueo obtenido exitosamente');

        } catch (error) {
            logger.error('Error al verificar bloqueo de usuario:', {
                error: error.message,
                stack: error.stack,
                id: req.params.id,
                organizacion_id: req.tenant?.organizacionId,
                ip: req.ip
            });

            ResponseHelper.error(res, 'Error interno del servidor', 500);
        }
    }
}

module.exports = UsuarioController;