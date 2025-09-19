/**
 * @fileoverview Controlador de Autenticación para API SaaS
 * @description Maneja login, registro, refresh tokens y operaciones de autenticación
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const UsuarioModel = require('../database/usuario.model');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Controlador de Autenticación
 * @class AuthController
 */
class AuthController {

    /**
     * Login de usuario con email y contraseña
     * @route POST /api/v1/auth/login
     * @param {Object} req - Request object
     * @param {Object} req.body - Datos del login
     * @param {string} req.body.email - Email del usuario
     * @param {string} req.body.password - Contraseña del usuario
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async login(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress;

            // Intentar autenticación
            const resultado = await UsuarioModel.autenticar(email, password, ipAddress);

            // Log exitoso
            logger.info('Login exitoso', {
                userId: resultado.usuario.id,
                email: resultado.usuario.email,
                organizacionId: resultado.usuario.organizacion_id,
                ip: ipAddress
            });

            // Configurar cookie httpOnly para refresh token
            res.cookie('refreshToken', resultado.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
            });

            // Respuesta exitosa
            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: {
                    usuario: resultado.usuario,
                    accessToken: resultado.accessToken,
                    expiresIn: resultado.expiresIn
                }
            });

        } catch (error) {
            logger.error('Error en login', {
                error: error.message,
                email: req.body.email,
                ip: req.ip
            });

            // Determinar código de estado basado en el error
            let statusCode = 401;
            if (error.message.includes('bloqueado')) {
                statusCode = 423; // Locked
            } else if (error.message.includes('suspendida')) {
                statusCode = 403; // Forbidden
            }

            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * Registro de nuevo usuario
     * @route POST /api/v1/auth/register
     * @param {Object} req - Request object
     * @param {Object} req.body - Datos del registro
     * @param {string} req.body.email - Email único del usuario
     * @param {string} req.body.password - Contraseña (mínimo 8 caracteres)
     * @param {string} req.body.nombre - Nombre del usuario
     * @param {string} [req.body.apellidos] - Apellidos del usuario
     * @param {string} [req.body.telefono] - Teléfono del usuario
     * @param {string} [req.body.rol] - Rol del usuario (default: empleado)
     * @param {number} [req.body.organizacion_id] - ID de organización (requerido excepto super_admin)
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async register(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const userData = req.body;

            // Validación adicional: si no es super_admin, requiere organizacion_id
            if (userData.rol !== 'super_admin' && !userData.organizacion_id) {
                return res.status(400).json({
                    success: false,
                    message: 'organizacion_id es requerido para este rol'
                });
            }

            // Crear usuario
            const usuario = await UsuarioModel.crear(userData);

            // Log exitoso
            logger.info('Usuario registrado exitosamente', {
                userId: usuario.id,
                email: usuario.email,
                rol: usuario.rol,
                organizacionId: usuario.organizacion_id
            });

            // Respuesta exitosa (sin datos sensibles)
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    usuario: {
                        id: usuario.id,
                        email: usuario.email,
                        nombre: usuario.nombre,
                        apellidos: usuario.apellidos,
                        rol: usuario.rol,
                        organizacion_id: usuario.organizacion_id,
                        activo: usuario.activo,
                        creado_en: usuario.creado_en
                    }
                }
            });

        } catch (error) {
            logger.error('Error en registro', {
                error: error.message,
                email: req.body.email
            });

            // Manejar errores específicos
            let statusCode = 500;
            let message = 'Error interno del servidor';

            if (error.message.includes('ya está registrado')) {
                statusCode = 409; // Conflict
                message = error.message;
            } else if (error.message.includes('23505')) { // Duplicate key
                statusCode = 409;
                message = 'El email ya está registrado en el sistema';
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Refrescar access token usando refresh token
     * @route POST /api/v1/auth/refresh
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async refresh(req, res) {
        try {
            // Obtener refresh token de cookie o body
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token requerido'
                });
            }

            // Refrescar token
            const resultado = await UsuarioModel.refrescarToken(refreshToken);

            // Log exitoso
            logger.info('Token refrescado exitosamente');

            res.status(200).json({
                success: true,
                message: 'Token refrescado exitosamente',
                data: {
                    accessToken: resultado.accessToken,
                    expiresIn: resultado.expiresIn
                }
            });

        } catch (error) {
            logger.error('Error al refrescar token', {
                error: error.message
            });

            // Limpiar cookie si el refresh token es inválido
            res.clearCookie('refreshToken');

            res.status(401).json({
                success: false,
                message: 'Token de refresco inválido'
            });
        }
    }

    /**
     * Logout - Limpiar tokens
     * @route POST /api/v1/auth/logout
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async logout(req, res) {
        try {
            // Limpiar cookie del refresh token
            res.clearCookie('refreshToken');

            // Log logout
            if (req.user) {
                logger.info('Logout exitoso', {
                    userId: req.user.id,
                    email: req.user.email
                });
            }

            res.status(200).json({
                success: true,
                message: 'Logout exitoso'
            });

        } catch (error) {
            logger.error('Error en logout', {
                error: error.message
            });

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Obtener información del usuario actual
     * @route GET /api/v1/auth/me
     * @param {Object} req - Request object (con req.user del middleware)
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async me(req, res) {
        try {
            // El usuario ya viene del middleware de autenticación
            const usuario = await UsuarioModel.buscarPorId(req.user.id);

            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Información del usuario',
                data: {
                    usuario: {
                        id: usuario.id,
                        email: usuario.email,
                        nombre: usuario.nombre,
                        apellidos: usuario.apellidos,
                        telefono: usuario.telefono,
                        rol: usuario.rol,
                        organizacion_id: usuario.organizacion_id,
                        email_verificado: usuario.email_verificado
                    }
                }
            });

        } catch (error) {
            logger.error('Error al obtener información del usuario', {
                error: error.message,
                userId: req.user?.id
            });

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Cambiar contraseña del usuario actual
     * @route POST /api/v1/auth/change-password
     * @param {Object} req - Request object
     * @param {Object} req.body - Datos del cambio
     * @param {string} req.body.passwordAnterior - Contraseña actual
     * @param {string} req.body.passwordNueva - Nueva contraseña
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async cambiarPassword(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { passwordAnterior, passwordNueva } = req.body;
            const userId = req.user.id;

            // Cambiar contraseña
            await UsuarioModel.cambiarPassword(userId, passwordAnterior, passwordNueva);

            // Log exitoso
            logger.info('Contraseña cambiada exitosamente', {
                userId: userId,
                email: req.user.email
            });

            res.status(200).json({
                success: true,
                message: 'Contraseña cambiada exitosamente'
            });

        } catch (error) {
            logger.error('Error al cambiar contraseña', {
                error: error.message,
                userId: req.user?.id
            });

            let statusCode = 500;
            let message = 'Error interno del servidor';

            if (error.message.includes('incorrecta')) {
                statusCode = 400;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Actualizar perfil del usuario actual
     * @route PUT /api/v1/auth/profile
     * @param {Object} req - Request object
     * @param {Object} req.body - Datos a actualizar
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async actualizarPerfil(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const userId = req.user.id;
            const datos = req.body;

            // Actualizar perfil
            const usuarioActualizado = await UsuarioModel.actualizarPerfil(userId, datos);

            // Log exitoso
            logger.info('Perfil actualizado exitosamente', {
                userId: userId,
                camposActualizados: Object.keys(datos)
            });

            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: {
                    usuario: usuarioActualizado
                }
            });

        } catch (error) {
            logger.error('Error al actualizar perfil', {
                error: error.message,
                userId: req.user?.id
            });

            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    /**
     * Desbloquear usuario (solo administradores)
     * @route POST /api/v1/auth/unlock-user
     * @param {Object} req - Request object
     * @param {Object} req.body - Datos del desbloqueo
     * @param {number} req.body.userId - ID del usuario a desbloquear
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async desbloquearUsuario(req, res) {
        try {
            // Validar errores de entrada
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors.array()
                });
            }

            const { userId } = req.body;
            const adminId = req.user.id;

            // Verificar que el usuario autenticado sea admin o super_admin
            if (!['admin', 'super_admin', 'propietario'].includes(req.user.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para desbloquear usuarios'
                });
            }

            // Desbloquear usuario
            const usuarioDesbloqueado = await UsuarioModel.desbloquearUsuario(userId, adminId);

            // Log exitoso
            logger.info('Usuario desbloqueado exitosamente', {
                usuarioDesbloqueado: userId,
                administrador: adminId,
                adminEmail: req.user.email
            });

            res.status(200).json({
                success: true,
                message: 'Usuario desbloqueado exitosamente',
                data: {
                    usuario: usuarioDesbloqueado
                }
            });

        } catch (error) {
            logger.error('Error al desbloquear usuario', {
                error: error.message,
                userId: req.body.userId,
                adminId: req.user?.id
            });

            let statusCode = 500;
            let message = 'Error interno del servidor';

            if (error.message.includes('no encontrado')) {
                statusCode = 404;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Obtener lista de usuarios bloqueados (solo administradores)
     * @route GET /api/v1/auth/blocked-users
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async obtenerUsuariosBloqueados(req, res) {
        try {
            // Verificar permisos de administrador
            if (!['admin', 'super_admin', 'propietario'].includes(req.user.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para ver usuarios bloqueados'
                });
            }

            // Para super_admin, mostrar de todas las organizaciones
            // Para otros roles, solo de su organización
            let organizacionId = req.user.organizacion_id;
            if (req.user.rol === 'super_admin' && req.query.organizacion_id) {
                organizacionId = parseInt(req.query.organizacion_id);
            }

            const usuariosBloqueados = await UsuarioModel.obtenerUsuariosBloqueados(organizacionId);

            res.status(200).json({
                success: true,
                message: 'Lista de usuarios bloqueados',
                data: {
                    usuarios: usuariosBloqueados,
                    total: usuariosBloqueados.length
                }
            });

        } catch (error) {
            logger.error('Error al obtener usuarios bloqueados', {
                error: error.message,
                adminId: req.user?.id
            });

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Verificar estado de bloqueo de un usuario
     * @route GET /api/v1/auth/check-lock/:userId
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @returns {Promise<void>}
     */
    static async verificarBloqueo(req, res) {
        try {
            const { userId } = req.params;

            // Verificar permisos (solo admin puede ver otros usuarios, o el mismo usuario)
            if (req.user.id !== parseInt(userId) && !['admin', 'super_admin', 'propietario'].includes(req.user.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para verificar este usuario'
                });
            }

            const estadoBloqueo = await UsuarioModel.verificarBloqueo(userId);

            if (!estadoBloqueo) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Estado de bloqueo del usuario',
                data: {
                    esta_bloqueado: estadoBloqueo.esta_bloqueado,
                    intentos_fallidos: estadoBloqueo.intentos_fallidos,
                    minutos_restantes: Math.ceil(estadoBloqueo.minutos_restantes || 0),
                    bloqueado_hasta: estadoBloqueo.bloqueado_hasta
                }
            });

        } catch (error) {
            logger.error('Error al verificar bloqueo', {
                error: error.message,
                userId: req.params.userId,
                requesterId: req.user?.id
            });

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;