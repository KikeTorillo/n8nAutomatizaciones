/**
 * @fileoverview Controlador de Autenticación para API SaaS
 * @description Maneja login, registro, refresh tokens y operaciones de autenticación
 * @version 3.0.0 - Migrado a asyncHandler
 */

const UsuarioModel = require('../models/usuario.model');
const jwt = require('jsonwebtoken');
const { addToTokenBlacklist } = require('../../../middleware/auth');
const { ResponseHelper } = require('../../../utils/helpers');
const PasswordHelper = require('../../../utils/passwordHelper');
const asyncHandler = require('../../../middleware/asyncHandler');

class AuthController {

    static login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        const resultado = await UsuarioModel.autenticar(email, password, ipAddress);

        res.cookie('refreshToken', resultado.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const responseData = {
            usuario: resultado.usuario,
            accessToken: resultado.accessToken,
            expiresIn: resultado.expiresIn
        };

        if (process.env.NODE_ENV !== 'production') {
            responseData.refreshToken = resultado.refreshToken;
        }

        return ResponseHelper.success(res, responseData, 'Login exitoso');
    });

    static register = asyncHandler(async (req, res) => {
        const usuario = await UsuarioModel.crear(req.body);

        const usuarioData = {
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
        };

        return ResponseHelper.success(res, usuarioData, 'Usuario registrado exitosamente', 201);
    });

    static refresh = asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return ResponseHelper.unauthorized(res, 'Refresh token requerido');
        }

        const resultado = await UsuarioModel.refrescarToken(refreshToken);

        return ResponseHelper.success(res, {
            accessToken: resultado.accessToken,
            expiresIn: resultado.expiresIn
        }, 'Token refrescado exitosamente');
    });

    static logout = asyncHandler(async (req, res) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.decode(token);
            if (decoded?.exp) {
                // ✅ FIX: Calcular segundos restantes hasta expiración (no timestamp completo)
                // decoded.exp es timestamp Unix (ej: 1762400432)
                // Necesitamos: segundos desde AHORA hasta expiración
                const secondsUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);

                // Solo blacklist si el token aún no expiró
                if (secondsUntilExpiry > 0) {
                    await addToTokenBlacklist(token, secondsUntilExpiry);
                }
            }
        }

        res.clearCookie('refreshToken');

        return ResponseHelper.success(res, null, 'Logout exitoso');
    });

    static me = asyncHandler(async (req, res) => {
        const usuario = await UsuarioModel.buscarPorId(req.user.id);

        if (!usuario) {
            return ResponseHelper.notFound(res, 'Usuario no encontrado');
        }

        const usuarioData = {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                telefono: usuario.telefono,
                rol: usuario.rol,
                organizacion_id: usuario.organizacion_id,
                email_verificado: usuario.email_verificado,
                // Datos de la organización (para filtros de tipos profesionales, etc.)
                categoria_id: usuario.categoria_id || null,
                categoria_codigo: usuario.categoria_codigo || null,
                nombre_comercial: usuario.nombre_comercial || null,
                plan_actual: usuario.plan_actual || null
            }
        };

        return ResponseHelper.success(res, usuarioData, 'Información del usuario');
    });

    static cambiarPassword = asyncHandler(async (req, res) => {
        const { passwordAnterior, passwordNueva } = req.body;

        await UsuarioModel.cambiarPassword(req.user.id, passwordAnterior, passwordNueva);

        return ResponseHelper.success(res, null, 'Contraseña cambiada exitosamente');
    });

    static actualizarPerfil = asyncHandler(async (req, res) => {
        const usuarioActualizado = await UsuarioModel.actualizarPerfil(req.user.id, req.body);

        return ResponseHelper.success(res, { usuario: usuarioActualizado }, 'Perfil actualizado exitosamente');
    });

    static recuperarPassword = asyncHandler(async (req, res) => {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        const resultado = await UsuarioModel.resetPassword(email, ipAddress);

        const responseData = {
            token_enviado: resultado.token_enviado,
            ...(resultado.expires_at && { expires_at: resultado.expires_at }),
            ...(process.env.NODE_ENV !== 'production' && resultado.reset_token && {
                reset_token: resultado.reset_token
            })
        };

        return ResponseHelper.success(res, responseData, resultado.mensaje);
    });

    static verificarEmail = asyncHandler(async (req, res) => {
        const { token } = req.params;

        const resultado = await UsuarioModel.verificarEmail(token);

        if (!resultado.verificado && !resultado.ya_verificado) {
            return ResponseHelper.error(res, resultado.mensaje, 400, {
                verificado: false,
                ya_verificado: false
            });
        }

        return ResponseHelper.success(res, {
            verificado: resultado.verificado || false,
            ya_verificado: resultado.ya_verificado || false,
            email: resultado.email
        }, resultado.mensaje);
    });

    static crearPrimerAdmin = asyncHandler(async (req, res) => {
        const hayUsuarios = await UsuarioModel.existenUsuarios();
        if (hayUsuarios) {
            return ResponseHelper.error(res, 'Ya existen usuarios en el sistema. No se puede crear el primer admin.', 400);
        }

        const userData = { ...req.body, rol: 'super_admin' };
        const usuario = await UsuarioModel.crear(userData);

        return ResponseHelper.success(res, {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                rol: usuario.rol,
                activo: usuario.activo,
                creado_en: usuario.creado_en
            }
        }, 'Primer usuario super_admin creado exitosamente', 201);
    });

    static validarTokenReset = asyncHandler(async (req, res) => {
        const { token } = req.params;

        const resultado = await UsuarioModel.validarTokenReset(token);

        if (!resultado.valido) {
            return ResponseHelper.error(res, resultado.mensaje, 400, {
                valido: false,
                ...(resultado.expiro_hace_minutos && {
                    expiro_hace_minutos: resultado.expiro_hace_minutos
                })
            });
        }

        return ResponseHelper.success(res, {
            valido: true,
            email: resultado.email,
            expira_en_minutos: resultado.expira_en_minutos,
            expira_en: resultado.expira_en
        }, 'Token válido');
    });

    static confirmarResetPassword = asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { passwordNueva } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        const resultado = await UsuarioModel.confirmarResetPassword(token, passwordNueva, ipAddress);

        return ResponseHelper.success(res, {
            success: true,
            email: resultado.email,
            mensaje: resultado.mensaje
        }, 'Contraseña actualizada exitosamente');
    });

    static evaluarFortalezaPassword = asyncHandler(async (req, res) => {
        const { password } = req.body;

        const evaluacion = PasswordHelper.evaluarFortaleza(password);

        return ResponseHelper.success(res, evaluacion, 'Fortaleza de contraseña evaluada');
    });
}

module.exports = AuthController;