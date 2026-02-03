/**
 * @fileoverview Controlador de Autenticación para API SaaS
 * @description Maneja login, registro, refresh tokens y operaciones de autenticación
 * @version 4.0.0 - Refactorizado con servicios desacoplados
 */

const UsuarioModel = require('../../core/models/usuario.model');
const AuthModel = require('../models/auth.model');
const { AUTH_CONFIG } = require('../models/auth.model');
const ActivacionModel = require('../models/activacion.model');
const GoogleOAuthService = require('../services/oauth/google.service');
const bcrypt = require('bcryptjs');
const { addToTokenBlacklist } = require('../middleware/auth');
const { ResponseHelper } = require('../../../utils/helpers');
const PasswordHelper = require('../utils/passwordHelper');
const asyncHandler = require('../../../middleware/asyncHandler');
const emailService = require('../../../services/emailService');
const JwtService = require('../services/jwtService');
const OnboardingService = require('../services/onboardingService');

/**
 * Opciones de cookie para refreshToken - configuración centralizada
 * - httpOnly: No accesible desde JavaScript (previene XSS)
 * - secure: Solo HTTPS en producción
 * - sameSite: Previene CSRF
 * - maxAge: 7 días de duración
 */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 días
};

class AuthController {

    static login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Usar AuthModel para autenticación
        const resultado = await AuthModel.autenticar(email, password, ipAddress);

        res.cookie('refreshToken', resultado.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        const responseData = {
            usuario: resultado.usuario,
            accessToken: resultado.accessToken,
            expiresIn: resultado.expiresIn,
            requiere_onboarding: resultado.requiere_onboarding
        };

        // SECURITY FIX (Feb 2026): Eliminada exposición de refreshToken en desarrollo
        // El token ya está en cookie httpOnly, no necesita exponerse en JSON

        return ResponseHelper.success(res, responseData, 'Login exitoso');
    });

    static register = asyncHandler(async (req, res) => {
        const usuario = await UsuarioModel.crear(req.body);

        // FASE 7: Retornar rol_id del sistema dinámico
        const usuarioData = {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                rol_id: usuario.rol_id,
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

        // Usar AuthModel para refresh
        const resultado = await AuthModel.refrescarToken(refreshToken);

        return ResponseHelper.success(res, {
            accessToken: resultado.accessToken,
            expiresIn: resultado.expiresIn
        }, 'Token refrescado exitosamente');
    });

    static logout = asyncHandler(async (req, res) => {
        const token = JwtService.extractFromHeader(req.headers.authorization);
        if (token) {
            const secondsUntilExpiry = JwtService.getSecondsUntilExpiry(token);
            if (secondsUntilExpiry > 0) {
                await addToTokenBlacklist(token, secondsUntilExpiry);
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

        // FASE 7 COMPLETADA (Ene 2026): Solo sistema de roles dinámicos
        const usuarioData = {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                telefono: usuario.telefono,
                // Sistema de roles dinámicos (solo rol_id como fuente de verdad)
                rol_id: usuario.rol_id,
                rol_codigo: usuario.rol_codigo,
                rol_nombre: usuario.rol_nombre,
                nivel_jerarquia: usuario.nivel_jerarquia || 10,
                organizacion_id: usuario.organizacion_id,
                profesional_id: usuario.profesional_id || null,
                email_verificado: usuario.email_verificado,
                onboarding_completado: usuario.onboarding_completado,  // Dic 2025 - Flujo unificado
                // Datos de la organización (para filtros de tipos profesionales, etc.)
                categoria_id: usuario.categoria_id || null,
                categoria_codigo: usuario.categoria_codigo || null,
                nombre_comercial: usuario.nombre_comercial || null,
                // NOTA Feb 2026: plan_actual eliminado de organizaciones
                // El plan ahora se obtiene via suscripciones_org cuando es necesario
                // Multi-moneda (Fase 4 - Dic 2025)
                moneda: usuario.moneda || 'MXN',
                zona_horaria: usuario.zona_horaria || 'America/Mexico_City'
            }
        };

        return ResponseHelper.success(res, usuarioData, 'Información del usuario');
    });

    static cambiarPassword = asyncHandler(async (req, res) => {
        const { passwordAnterior, passwordNueva } = req.body;

        // Usar AuthModel para cambio de password
        await AuthModel.cambiarPassword(req.user.id, passwordAnterior, passwordNueva);

        return ResponseHelper.success(res, null, 'Contraseña cambiada exitosamente');
    });

    static actualizarPerfil = asyncHandler(async (req, res) => {
        const usuarioActualizado = await UsuarioModel.actualizarPerfil(req.user.id, req.body);

        return ResponseHelper.success(res, { usuario: usuarioActualizado }, 'Perfil actualizado exitosamente');
    });

    static recuperarPassword = asyncHandler(async (req, res) => {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Usar AuthModel para reset de password
        const resultado = await AuthModel.solicitarResetPassword(email, ipAddress);

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

        // Usar AuthModel para verificación de email
        const resultado = await AuthModel.verificarEmail(token);

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

        // FASE 7: Usar rol_codigo para sistema dinámico
        const userData = { ...req.body, rol_codigo: 'super_admin' };
        const usuario = await UsuarioModel.crear(userData);

        return ResponseHelper.success(res, {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                rol_id: usuario.rol_id,
                rol_codigo: 'super_admin',
                activo: usuario.activo,
                creado_en: usuario.creado_en
            }
        }, 'Primer usuario super_admin creado exitosamente', 201);
    });

    static validarTokenReset = asyncHandler(async (req, res) => {
        const { token } = req.params;

        // Usar AuthModel para validar token
        const resultado = await AuthModel.validarTokenReset(token);

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

        // Usar AuthModel para confirmar reset
        const resultado = await AuthModel.confirmarResetPassword(token, passwordNueva, ipAddress);

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

    // ====================================================================
    // REGISTRO SIMPLIFICADO - Flujo Unificado (Dic 2025)
    // ====================================================================

    /**
     * POST /api/v1/auth/registrar
     * Registro simplificado: solo nombre + email
     * NO crea organización (igual que Google OAuth)
     * Usuario completará onboarding después de activar
     * @public
     */
    static registrarSimplificado = asyncHandler(async (req, res) => {
        const { nombre, email } = req.body;

        // 1. Verificar que el email no esté registrado
        const usuarioExistente = await UsuarioModel.buscarPorEmail(email);
        if (usuarioExistente) {
            return ResponseHelper.error(res, 'Este email ya está registrado. ¿Olvidaste tu contraseña?', 409);
        }

        // 2. Verificar que no haya activación pendiente
        const activacionExistente = await ActivacionModel.obtenerPorEmail(email);
        if (activacionExistente && activacionExistente.estado === 'pendiente') {
            return ResponseHelper.error(res, 'Ya existe un registro pendiente para este email. Revisa tu bandeja de entrada.', 409);
        }

        // 3. Crear activación pendiente (sin organización - flujo unificado)
        const activacion = await ActivacionModel.crear({
            // organizacion_id: null (implícito - flujo unificado)
            email,
            nombre,
            soy_profesional: true,  // Se configurará en onboarding
            horas_expiracion: 24
        });

        // 4. Enviar email de activación
        await emailService.enviarActivacionCuenta({
            email,
            nombre,
            token: activacion.token,
            nombre_negocio: null,  // Se configurará en onboarding
            expira_en: activacion.expira_en,
            es_reenvio: false
        });

        // 5. Responder (sin exponer token en producción)
        const responseData = {
            mensaje: 'Registro iniciado. Revisa tu email para activar tu cuenta.',
            email_enviado: email,
            expira_en: activacion.expira_en
        };

        // En desarrollo, incluir token para testing
        if (process.env.NODE_ENV !== 'production') {
            responseData.token = activacion.token;
        }

        return ResponseHelper.success(res, responseData, 'Email de activación enviado', 201);
    });

    /**
     * GET /api/v1/auth/activar/:token
     * Valida token de activación (para mostrar formulario de password)
     * @public
     */
    static validarActivacion = asyncHandler(async (req, res) => {
        const { token } = req.params;

        const resultado = await ActivacionModel.validarToken(token);

        if (!resultado.valido) {
            return ResponseHelper.error(res, resultado.error, 400, { valido: false });
        }

        return ResponseHelper.success(res, {
            valido: true,
            ...resultado.activacion
        }, 'Token de activación válido');
    });

    /**
     * POST /api/v1/auth/activar/:token
     * Activa cuenta creando usuario con password
     * Dic 2025 - Flujo unificado: soporta activación sin organización
     * @public
     */
    static activarCuenta = asyncHandler(async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;

        // 1. Hashear password (SECURITY FIX Feb 2026: usar config centralizada)
        const password_hash = await bcrypt.hash(password, AUTH_CONFIG.BCRYPT_SALT_ROUNDS);

        // 2. Activar cuenta (crear usuario y profesional si aplica)
        const resultado = await ActivacionModel.activar(token, password_hash);

        // 3. Generar tokens JWT para login automático
        const { accessToken, refreshToken, expiresIn } = JwtService.generateTokenPair(resultado.usuario);

        // 4. Establecer cookie de refresh
        res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // 5. Responder con datos del usuario y tokens
        const responseData = {
            usuario: {
                ...resultado.usuario,
                onboarding_completado: resultado.usuario.onboarding_completado
            },
            organizacion: resultado.organizacion,
            accessToken,
            expiresIn,
            requiere_onboarding: resultado.requiere_onboarding  // Flujo unificado Dic 2025
        };

        // SECURITY FIX (Feb 2026): Eliminada exposición de refreshToken en desarrollo

        return ResponseHelper.success(res, responseData, 'Cuenta activada exitosamente', 201);
    });

    // ====================================================================
    // MAGIC LINKS - Dic 2025
    // ====================================================================

    /**
     * POST /api/v1/auth/magic-link
     * Solicita un magic link para login sin contraseña
     * @public
     */
    static solicitarMagicLink = asyncHandler(async (req, res) => {
        const { email } = req.body;

        // 1. Crear magic link (el modelo maneja si el usuario existe o no)
        const magicLink = await ActivacionModel.crearMagicLink({ email });

        // 2. Si el usuario no existe, retornamos éxito simulado (seguridad)
        if (magicLink.simulado) {
            // Por seguridad, no revelamos si el email existe o no
            return ResponseHelper.success(res, {
                mensaje: 'Si existe una cuenta con este email, recibirás un enlace para iniciar sesión.',
                email_enviado: email
            }, 'Solicitud procesada');
        }

        // 3. Enviar email con magic link
        await emailService.enviarMagicLink({
            email,
            nombre: magicLink.usuario_nombre,
            token: magicLink.token,
            expira_en: magicLink.expira_en
        });

        // 4. Responder
        const responseData = {
            mensaje: 'Si existe una cuenta con este email, recibirás un enlace para iniciar sesión.',
            email_enviado: email,
            expira_en: magicLink.expira_en
        };

        // En desarrollo, incluir token para testing
        if (process.env.NODE_ENV !== 'production') {
            responseData.token = magicLink.token;
        }

        return ResponseHelper.success(res, responseData, 'Magic link enviado');
    });

    /**
     * GET /api/v1/auth/magic-link/verify/:token
     * Verifica magic link y autentica al usuario
     * @public
     */
    static verificarMagicLink = asyncHandler(async (req, res) => {
        const { token } = req.params;

        // 1. Verificar magic link
        const resultado = await ActivacionModel.verificarMagicLink(token);

        if (!resultado.valido) {
            return ResponseHelper.error(res, resultado.error, 400, { valido: false });
        }

        // 2. Generar tokens JWT
        const { accessToken, refreshToken, expiresIn } = JwtService.generateTokenPair(resultado.usuario);

        // 3. Establecer cookie de refresh
        res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // 4. Responder con datos del usuario y tokens
        const responseData = {
            usuario: resultado.usuario,
            organizacion: resultado.organizacion,
            accessToken,
            expiresIn,
            requiere_onboarding: !resultado.usuario.onboarding_completado
        };

        // SECURITY FIX (Feb 2026): Eliminada exposición de refreshToken en desarrollo

        return ResponseHelper.success(res, responseData, 'Login exitoso via magic link');
    });

    /**
     * POST /api/v1/auth/reenviar-activacion
     * Reenvía email de activación para un registro pendiente
     * @public
     */
    static reenviarActivacion = asyncHandler(async (req, res) => {
        const { email } = req.body;

        // 1. Buscar activación pendiente
        const activacionExistente = await ActivacionModel.obtenerPorEmail(email);

        if (!activacionExistente) {
            return ResponseHelper.error(res, 'No hay registro pendiente para este email', 404);
        }

        if (activacionExistente.estado === 'activada') {
            return ResponseHelper.error(res, 'Esta cuenta ya fue activada. Puedes iniciar sesión.', 400);
        }

        // 2. Reenviar (genera nuevo token)
        const nuevaActivacion = await ActivacionModel.reenviar(email);

        // 3. Enviar email
        await emailService.enviarActivacionCuenta({
            email,
            nombre: nuevaActivacion.nombre,
            token: nuevaActivacion.token,
            nombre_negocio: activacionExistente.nombre_comercial,
            expira_en: nuevaActivacion.expira_en,
            es_reenvio: true
        });

        return ResponseHelper.success(res, {
            mensaje: 'Email de activación reenviado',
            email_enviado: email,
            expira_en: nuevaActivacion.expira_en,
            reenvio_numero: nuevaActivacion.reenvios
        }, 'Email reenviado exitosamente');
    });

    // ====================================================================
    // OAUTH GOOGLE - Dic 2025
    // ====================================================================

    /**
     * POST /api/v1/auth/oauth/google
     * Autenticación con Google OAuth
     * - Si el usuario existe (por google_id o email): login
     * - Si no existe: crear usuario y requerir onboarding
     * @public
     */
    static oauthGoogle = asyncHandler(async (req, res) => {
        const { credential } = req.body; // Token ID de Google

        // 1. Verificar token con Google
        const googleData = await GoogleOAuthService.verifyToken(credential);

        // 2. Buscar usuario por Google ID
        let usuario = await UsuarioModel.buscarPorGoogleId(googleData.googleId);
        let esNuevo = false;

        if (!usuario) {
            // 3. Buscar por email (podría existir usuario sin Google vinculado)
            const usuarioPorEmail = await UsuarioModel.buscarPorEmail(googleData.email);

            if (usuarioPorEmail) {
                // Usuario existe con este email pero sin Google vinculado
                // Vincular Google a la cuenta existente
                usuario = await UsuarioModel.vincularGoogle(usuarioPorEmail.id, googleData);
            } else {
                // 4. Crear nuevo usuario desde Google (sin organización aún)
                usuario = await UsuarioModel.crearDesdeGoogle(googleData);
                esNuevo = true;
            }
        }

        // 5. Generar tokens JWT
        const { accessToken, refreshToken, expiresIn } = JwtService.generateTokenPair(usuario);

        // 6. Establecer cookie de refresh
        res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // 7. Responder (FASE 7: usar sistema de roles dinámicos)
        const responseData = {
            usuario: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellidos: usuario.apellidos,
                rol_id: usuario.rol_id,
                rol_codigo: usuario.rol_codigo,
                nivel_jerarquia: usuario.nivel_jerarquia || 10,
                organizacion_id: usuario.organizacion_id,
                avatar_url: usuario.avatar_url,
                onboarding_completado: usuario.onboarding_completado
            },
            organizacion: usuario.nombre_comercial ? {
                nombre_comercial: usuario.nombre_comercial
            } : null,
            accessToken,
            expiresIn,
            es_nuevo: esNuevo,
            requiere_onboarding: !usuario.onboarding_completado
        };

        // SECURITY FIX (Feb 2026): Eliminada exposición de refreshToken en desarrollo

        return ResponseHelper.success(res, responseData,
            esNuevo ? 'Cuenta creada con Google' : 'Login exitoso con Google'
        );
    });

    // ====================================================================
    // ONBOARDING - Dic 2025
    // ====================================================================

    /**
     * GET /api/v1/auth/onboarding/status
     * Verifica si el usuario completó el onboarding
     * @authenticated
     */
    static onboardingStatus = asyncHandler(async (req, res) => {
        const usuario = await UsuarioModel.buscarPorId(req.user.id);

        if (!usuario) {
            return ResponseHelper.notFound(res, 'Usuario no encontrado');
        }

        return ResponseHelper.success(res, {
            onboarding_completado: !!usuario.organizacion_id,
            tiene_organizacion: !!usuario.organizacion_id,
            organizacion_id: usuario.organizacion_id
        }, 'Estado de onboarding');
    });

    /**
     * POST /api/v1/auth/onboarding/complete
     * Completa el onboarding creando la organización
     * @authenticated
     */
    static onboardingComplete = asyncHandler(async (req, res) => {
        const {
            nombre_negocio,
            industria,
            estado_id,
            ciudad_id,
            soy_profesional = true,
            modulos = {}
        } = req.body;

        // Usar OnboardingService (emite eventos para dogfooding y rutas)
        const resultado = await OnboardingService.completar(req.user.id, {
            nombre_negocio,
            industria,
            estado_id,
            ciudad_id,
            soy_profesional,
            modulos
        });

        // Generar nuevos tokens con organizacion_id actualizado
        const usuarioActualizado = await UsuarioModel.buscarPorEmail(resultado.usuario.email);
        const { accessToken, refreshToken, expiresIn } = JwtService.generateTokenPair(usuarioActualizado);

        // Actualizar cookie
        res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        const responseData = {
            usuario: resultado.usuario,
            organizacion: resultado.organizacion,
            accessToken,
            expiresIn
        };

        // SECURITY FIX (Feb 2026): Eliminada exposición de refreshToken en desarrollo

        return ResponseHelper.success(res, responseData, 'Onboarding completado exitosamente', 201);
    });

    // ====================================================================
    // CAMBIO DE SUCURSAL - Ene 2026
    // ====================================================================

    /**
     * POST /api/v1/auth/cambiar-sucursal
     * Cambia sucursal activa y regenera tokens
     * Invalida token anterior y genera nuevo con sucursalId actualizado
     */
    static cambiarSucursal = asyncHandler(async (req, res) => {
        const { sucursal_id } = req.body;
        const userId = req.user.id;

        // 1. Validar y obtener usuario con nueva sucursal
        const usuarioActualizado = await UsuarioModel.buscarPorIdConSucursal(userId, sucursal_id);

        // 2. Invalidar token actual (blacklist Redis)
        const tokenActual = JwtService.extractFromHeader(req.headers.authorization);
        if (tokenActual) {
            const ttl = JwtService.getSecondsUntilExpiry(tokenActual);
            if (ttl > 0) {
                await addToTokenBlacklist(tokenActual, ttl);
            }
        }

        // 3. Invalidar cache de permisos
        const { invalidarCacheUsuario } = require('../../../middleware/permisos');
        invalidarCacheUsuario(userId);

        // 4. Generar nuevos tokens
        const { accessToken, refreshToken } = JwtService.generateTokenPair(usuarioActualizado);

        // 5. Actualizar cookie
        res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

        // 6. Obtener datos de sucursal
        const SucursalesModel = require('../../sucursales/models/sucursales.model');
        const sucursal = await SucursalesModel.obtenerPorId(
            sucursal_id,
            usuarioActualizado.organizacion_id
        );

        // 7. Respuesta
        return ResponseHelper.success(res, {
            sucursal: {
                id: sucursal?.id || sucursal_id,
                nombre: sucursal?.nombre,
                codigo: sucursal?.codigo,
                es_matriz: sucursal?.es_matriz || false
            },
            accessToken,
            expiresIn: 3600
        }, 'Sucursal cambiada exitosamente');
    });
}

module.exports = AuthController;
