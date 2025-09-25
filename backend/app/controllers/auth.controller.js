/**
 * @fileoverview Controlador de Autenticación para API SaaS
 * @description Maneja login, registro, refresh tokens y operaciones de autenticación
 * @author SaaS Agendamiento
 * @version 1.0.0
 */

const UsuarioModel = require('../database/usuario.model');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const { addToTokenBlacklist } = require('../middleware/auth');

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

            // Respuesta exitosa (incluir refreshToken en body para development/testing)
            const responseData = {
                usuario: resultado.usuario,
                accessToken: resultado.accessToken,
                expiresIn: resultado.expiresIn
            };

            // En desarrollo, incluir refreshToken en el response para testing con Bruno
            if (process.env.NODE_ENV !== 'production') {
                responseData.refreshToken = resultado.refreshToken;
            }

            res.status(200).json({
                success: true,
                message: 'Login exitoso',
                data: responseData
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
            // Obtener el token del header Authorization
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);

                // Decodificar el token para obtener información de expiración
                try {
                    const decoded = jwt.decode(token);
                    if (decoded && decoded.exp) {
                        // Agregar token a la blacklist con tiempo de expiración
                        await addToTokenBlacklist(token, decoded.exp);
                        logger.info('Token agregado a blacklist durante logout', {
                            userId: req.user?.id,
                            tokenExp: new Date(decoded.exp * 1000).toISOString()
                        });
                    }
                } catch (tokenError) {
                    logger.warn('Error procesando token durante logout', {
                        error: tokenError.message,
                        userId: req.user?.id
                    });
                    // Continuar con logout aunque haya error con el token
                }
            }

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

    /**
     * Registrar usuario automáticamente para organización (super_admin o admin org)
     * @route POST /api/v1/auth/registrar-usuario-org
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async registrarUsuarioOrganizacion(req, res) {
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

            const { organizacion_id, rol, opciones = {} } = req.body;
            const userData = req.body.usuario_data;

            // Validaciones de permisos
            if (!['super_admin', 'admin', 'propietario'].includes(req.user.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear usuarios en organizaciones'
                });
            }

            // Si no es super_admin, solo puede crear usuarios en su propia organización
            if (req.user.rol !== 'super_admin' && req.user.organizacion_id !== organizacion_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo puede crear usuarios en su propia organización'
                });
            }

            // Crear usuario para organización
            const resultado = await UsuarioModel.crearUsuarioOrganizacion(
                organizacion_id,
                userData,
                rol,
                opciones
            );

            logger.info('Usuario creado para organización via API', {
                usuario_id: resultado.usuario.id,
                organizacion_id: organizacion_id,
                rol: rol,
                creado_por: req.user.id,
                admin_email: req.user.email
            });

            res.status(201).json({
                success: true,
                message: 'Usuario creado exitosamente para la organización',
                data: {
                    usuario: resultado.usuario,
                    organizacion: resultado.organizacion,
                    configuracion_rls: resultado.configuracion_rls,
                    email_bienvenida: resultado.email_bienvenida
                }
            });

        } catch (error) {
            logger.error('Error creando usuario para organización', {
                error: error.message,
                body: req.body,
                admin_id: req.user?.id
            });

            let statusCode = 500;
            let message = 'Error interno del servidor';

            if (error.message.includes('no encontrada')) {
                statusCode = 404;
                message = error.message;
            } else if (error.message.includes('ya está registrado')) {
                statusCode = 409;
                message = error.message;
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Recuperar contraseña por email y organización
     * @route POST /api/v1/auth/recuperar-password
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async recuperarPassword(req, res) {
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

            const { email, organizacion_id } = req.body;

            // Generar token de reset
            const resultado = await UsuarioModel.resetPassword(email, organizacion_id);

            // Log de auditoría (sin revelar si el usuario existe)
            logger.info('Solicitud de reset password procesada', {
                email: email,
                organizacion_id: organizacion_id,
                token_enviado: resultado.token_enviado,
                ip: req.ip
            });

            // Siempre devolver la misma respuesta por seguridad
            res.status(200).json({
                success: true,
                message: resultado.mensaje,
                data: {
                    token_enviado: resultado.token_enviado,
                    ...(resultado.expires_at && { expires_at: resultado.expires_at }),
                    // Solo en desarrollo incluir el token
                    ...(process.env.NODE_ENV !== 'production' && resultado.reset_token && {
                        reset_token: resultado.reset_token
                    })
                }
            });

        } catch (error) {
            logger.error('Error en recuperar password', {
                error: error.message,
                email: req.body.email,
                organizacion_id: req.body.organizacion_id
            });

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    /**
     * Verificar email con token de verificación
     * @route GET /api/v1/auth/verificar-email/:token
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async verificarEmail(req, res) {
        try {
            const { token } = req.params;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token de verificación requerido'
                });
            }

            // Verificar email
            const resultado = await UsuarioModel.verificarEmail(token);

            if (resultado.ya_verificado) {
                return res.status(200).json({
                    success: true,
                    message: resultado.mensaje,
                    data: {
                        ya_verificado: true,
                        usuario: resultado.usuario
                    }
                });
            }

            logger.info('Email verificado exitosamente via API', {
                usuario_id: resultado.usuario.id,
                email: resultado.usuario.email
            });

            res.status(200).json({
                success: true,
                message: resultado.mensaje,
                data: {
                    verificado: resultado.verificado,
                    usuario: resultado.usuario
                }
            });

        } catch (error) {
            logger.error('Error en verificación de email', {
                error: error.message,
                token: req.params.token ? 'presente' : 'ausente'
            });

            let statusCode = 400;
            let message = 'Token de verificación inválido o expirado';

            if (error.message.includes('no encontrado')) {
                statusCode = 404;
                message = 'Usuario no encontrado';
            }

            res.status(statusCode).json({
                success: false,
                message: message
            });
        }
    }

    /**
     * Cambiar rol de usuario (solo administradores)
     * @route PUT /api/v1/auth/cambiar-rol
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async cambiarRol(req, res) {
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

            const { usuario_id, nuevo_rol, organizacion_id } = req.body;
            const adminId = req.user.id;

            // Validaciones de permisos
            if (!['super_admin', 'admin', 'propietario'].includes(req.user.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para cambiar roles de usuarios'
                });
            }

            // Si no es super_admin, solo puede modificar usuarios de su organización
            if (req.user.rol !== 'super_admin') {
                const orgIdTarget = organizacion_id || req.user.organizacion_id;
                if (req.user.organizacion_id !== orgIdTarget) {
                    return res.status(403).json({
                        success: false,
                        message: 'Solo puede modificar usuarios de su propia organización'
                    });
                }
            }

            // Cambiar rol
            const resultado = await UsuarioModel.cambiarRol(
                usuario_id,
                nuevo_rol,
                organizacion_id || req.user.organizacion_id,
                adminId
            );

            logger.info('Rol de usuario cambiado via API', {
                usuario_modificado: usuario_id,
                rol_anterior: resultado.cambio.rol_anterior,
                rol_nuevo: resultado.cambio.rol_nuevo,
                admin_id: adminId,
                organizacion_id: organizacion_id
            });

            res.status(200).json({
                success: true,
                message: 'Rol cambiado exitosamente',
                data: {
                    usuario: resultado.usuario,
                    cambio: resultado.cambio
                }
            });

        } catch (error) {
            logger.error('Error cambiando rol de usuario', {
                error: error.message,
                body: req.body,
                admin_id: req.user?.id
            });

            let statusCode = 500;
            let message = 'Error interno del servidor';

            if (error.message.includes('no encontrado')) {
                statusCode = 404;
                message = error.message;
            } else if (error.message.includes('no válido') || error.message.includes('ya tiene este rol')) {
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
     * Listar usuarios por organización (administradores)
     * @route GET /api/v1/auth/usuarios-organizacion
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    static async listarUsuariosOrganizacion(req, res) {
        try {
            // Validaciones de permisos
            if (!['super_admin', 'admin', 'propietario'].includes(req.user.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para listar usuarios'
                });
            }

            // Determinar organización
            let organizacionId = req.user.organizacion_id;
            if (req.user.rol === 'super_admin' && req.query.organizacion_id) {
                organizacionId = parseInt(req.query.organizacion_id);
            }

            // Configurar filtros y paginación
            const filtros = {
                rol: req.query.rol,
                activo: req.query.activo ? req.query.activo === 'true' : null,
                email_verificado: req.query.email_verificado ? req.query.email_verificado === 'true' : null,
                buscar: req.query.buscar
            };

            const paginacion = {
                page: parseInt(req.query.page) || 1,
                limit: Math.min(parseInt(req.query.limit) || 10, 50),
                order_by: req.query.order_by || 'creado_en',
                order_direction: req.query.order_direction || 'DESC'
            };

            // Listar usuarios
            const resultado = await UsuarioModel.listarPorOrganizacion(
                organizacionId,
                filtros,
                paginacion
            );

            logger.info('Lista de usuarios obtenida', {
                organizacion_id: organizacionId,
                admin_id: req.user.id,
                total_usuarios: resultado.pagination.total,
                filtros: filtros
            });

            res.status(200).json({
                success: true,
                message: 'Lista de usuarios obtenida exitosamente',
                data: {
                    usuarios: resultado.data,
                    pagination: resultado.pagination,
                    filtros_aplicados: resultado.filtros_aplicados,
                    resumen: resultado.resumen
                }
            });

        } catch (error) {
            logger.error('Error listando usuarios de organización', {
                error: error.message,
                admin_id: req.user?.id,
                query: req.query
            });

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;